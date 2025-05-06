const Document = require('../mongo/documentModel');
const Folder = require('../mongo/folderModel');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const util = require('util');
const mkdir = util.promisify(fs.mkdir);


const calculateChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};


const ensureDirectoryExists = async (directoryPath) => {
  try {
    await mkdir(directoryPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};


exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const { title, description, folder, category, tags, isPublic } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Document title is required'
      });
    }
    
    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(tag => tag.trim());
    }
    
    if (folder && !mongoose.Types.ObjectId.isValid(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder ID'
      });
    }
    
    if (folder) {
      const folderExists = await Folder.findById(folder);
      if (!folderExists) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
    }
    
    const { originalname, mimetype, size, path: tempPath, filename } = req.file;
    
    const storageDir = path.join(process.env.DOCUMENT_STORAGE_PATH || 'uploads', 'documents');
    await ensureDirectoryExists(storageDir);
    
    const fileExtension = path.extname(originalname);
    const storageFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    const storagePath = path.join(storageDir, storageFilename);
    
    fs.renameSync(tempPath, storagePath);
    
    const checksum = await calculateChecksum(storagePath);
    
    const document = new Document({
      title,
      description,
      folder: folder || null,
      category: category || 'uncategorized',
      tags: parsedTags || [],
      status: 'draft',
      type: 'file',
      extension: fileExtension.substring(1),
      mimeType: mimetype,
      currentVersion: 1,
      isPublic: isPublic === 'true' || isPublic === true,
      owner: req.user._id,
      createdBy: req.user._id,
      versions: [{
        versionNumber: 1,
        fileName: originalname,
        fileSize: size,
        mimeType: mimetype,
        fileUrl: `/api/documents/download/${storageFilename}`,
        storagePath: storagePath,
        checksum,
        createdBy: req.user._id,
        createdAt: new Date(),
        comments: 'Initial version'
      }],
      accessPermissions: [{
        entity: 'user',
        entityId: req.user._id.toString(),
        permission: 'admin',
        grantedBy: req.user._id,
        grantedAt: new Date()
      }]
    });
    
    await document.save();
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentId: document._id,
        title: document.title,
        version: document.currentVersion,
        downloadUrl: document.versions[0].fileUrl
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};


exports.uploadNewVersion = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!document.hasPermission(req.user._id, 'write')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this document'
      });
    }
    
    if (document.isLocked && !document.lockedBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Document is locked by another user'
      });
    }
    
    const { originalname, mimetype, size, path: tempPath } = req.file;
    
    const storageDir = path.join(process.env.DOCUMENT_STORAGE_PATH || 'uploads', 'documents');
    await ensureDirectoryExists(storageDir);
    
    const fileExtension = path.extname(originalname);
    const storageFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    const storagePath = path.join(storageDir, storageFilename);
    
    fs.renameSync(tempPath, storagePath);
    
    const checksum = await calculateChecksum(storagePath);
    
    const newVersion = document.addVersion({
      fileName: originalname,
      fileSize: size,
      mimeType: mimetype,
      fileUrl: `/api/documents/download/${storageFilename}`,
      storagePath: storagePath,
      checksum,
      createdBy: req.user._id,
      createdAt: new Date(),
      comments: req.body.comments || 'New version'
    });
    
    if (req.body.title) document.title = req.body.title;
    if (req.body.description) document.description = req.body.description;
    if (req.body.category) document.category = req.body.category;
    if (req.body.tags) {
      let parsedTags = req.body.tags;
      if (typeof req.body.tags === 'string') {
        parsedTags = req.body.tags.split(',').map(tag => tag.trim());
      }
      document.tags = parsedTags;
    }
    
    document.updatedBy = req.user._id;
    document.updatedAt = new Date();
    
    if (document.isLocked && document.lockedBy.equals(req.user._id)) {
      document.isLocked = false;
      document.lockedBy = null;
      document.lockedAt = null;
    }
    
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'New document version uploaded successfully',
      data: {
        documentId: document._id,
        title: document.title,
        version: document.currentVersion,
        downloadUrl: newVersion.fileUrl
      }
    });
  } catch (error) {
    console.error('Error uploading new version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload new version',
      error: error.message
    });
  }
};


exports.downloadDocument = async (req, res) => {
  try {
    const { id, version } = req.params;
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!document.hasPermission(req.user._id, 'read')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this document'
      });
    }
    
    let requestedVersion;
    if (version) {
      requestedVersion = document.versions.find(v => v.versionNumber === parseInt(version));
    } else {
      requestedVersion = document.getLatestVersion();
    }
    
    if (!requestedVersion) {
      return res.status(404).json({
        success: false,
        message: 'Requested document version not found'
      });
    }
    
    if (!fs.existsSync(requestedVersion.storagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }
    
    document.downloadCount += 1;
    await document.save();
    
    res.setHeader('Content-Type', requestedVersion.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(requestedVersion.fileName)}"`);
    
    const fileStream = fs.createReadStream(requestedVersion.storagePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document',
      error: error.message
    });
  }
};


exports.viewDocument = async (req, res) => {
  try {
    const { id, version } = req.params;
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!document.hasPermission(req.user._id, 'read')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this document'
      });
    }
    
    let requestedVersion;
    if (version) {
      requestedVersion = document.versions.find(v => v.versionNumber === parseInt(version));
    } else {
      requestedVersion = document.getLatestVersion();
    }
    
    if (!requestedVersion) {
      return res.status(404).json({
        success: false,
        message: 'Requested document version not found'
      });
    }
    
    if (!fs.existsSync(requestedVersion.storagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }
    
    document.viewCount += 1;
    document.lastViewedAt = new Date();
    await document.save();
    
    res.setHeader('Content-Type', requestedVersion.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(requestedVersion.fileName)}"`);
    
    const fileStream = fs.createReadStream(requestedVersion.storagePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view document',
      error: error.message
    });
  }
};


exports.getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id)
      .populate('owner', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('lockedBy', 'name email')
      .populate('folder', 'name path')
      .populate({
        path: 'versions.createdBy',
        select: 'name email'
      })
      .populate({
        path: 'relatedProcesses.process',
        select: 'title currentState'
      });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!document.hasPermission(req.user._id, 'read')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this document'
      });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document',
      error: error.message
    });
  }
};


exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!document.hasPermission(req.user._id, 'write')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this document'
      });
    }
    
    if (document.isLocked && !document.lockedBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Document is locked by another user'
      });
    }
    
    const allowedUpdates = ['title', 'description', 'category', 'tags', 'status', 'metadata'];
    
    Object.keys(updates).forEach(key => {
      if (!allowedUpdates.includes(key)) {
        delete updates[key];
      }
    });
    
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(tag => tag.trim());
    }
    
    Object.assign(document, updates);
    
    document.updatedBy = req.user._id;
    document.updatedAt = new Date();
    
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: document
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message
    });
  }
};


exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!document.hasPermission(req.user._id, 'delete')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this document'
      });
    }
    
    if (document.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Document is locked and cannot be deleted'
      });
    }
    
    if (document.relatedProcesses && document.relatedProcesses.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Document is referenced by active processes and cannot be deleted'
      });
    }
    
    if (permanent === 'true') {
      for (const version of document.versions) {
        try {
          if (fs.existsSync(version.storagePath)) {
            fs.unlinkSync(version.storagePath);
          }
        } catch (err) {
          console.error(`Error deleting file for version ${version.versionNumber}:`, err);
        }
      }
      
      await Document.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        message: 'Document permanently deleted',
        data: {}
      });
    } else {
      document.status = 'deleted';
      document.updatedBy = req.user._id;
      document.updatedAt = new Date();
      await document.save();
      
      res.status(200).json({
        success: true,
        message: 'Document marked as deleted',
        data: {
          id: document._id,
          status: document.status
        }
      });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};


exports.lockDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!document.hasPermission(req.user._id, 'write')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to lock this document'
      });
    }
    
    if (document.isLocked) {
      if (document.lockedBy.equals(req.user._id)) {
        document.lockedAt = new Date();
        await document.save();
        
        return res.status(200).json({
          success: true,
          message: 'Document lock extended',
          data: {
            lockedBy: {
              _id: req.user._id,
              name: req.user.name
            },
            lockedAt: document.lockedAt
          }
        });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Document is already locked by another user'
        });
      }
    }
    
    document.isLocked = true;
    document.lockedBy = req.user._id;
    document.lockedAt = new Date();
    
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'Document locked successfully',
      data: {
        lockedBy: {
          _id: req.user._id,
          name: req.user.name
        },
        lockedAt: document.lockedAt
      }
    });
  } catch (error) {
    console.error('Error locking document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock document',
      error: error.message
    });
  }
};


exports.unlockDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!document.isLocked) {
      return res.status(200).json({
        success: true,
        message: 'Document is already unlocked',
        data: {}
      });
    }
    
    const isAdmin = document.hasPermission(req.user._id, 'admin');
    const isLocker = document.lockedBy && document.lockedBy.equals(req.user._id);
    
    if (!isLocker && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to unlock this document'
      });
    }
    
    document.isLocked = false;
    document.lockedBy = null;
    document.lockedAt = null;
    
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'Document unlocked successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error unlocking document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock document',
      error: error.message
    });
  }
};


exports.getDocumentVersions = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id)
      .select('title currentVersion versions')
      .populate({
        path: 'versions.createdBy',
        select: 'name email'
      });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const isAdmin = req.user.roles && req.user.roles.includes('Admin');
    
    if (!isAdmin && !document.hasPermission(req.user._id, 'read')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this document'
      });
    }

    const versionsArray = Array.isArray(document.versions) ? document.versions : [];
    
    const versions = versionsArray.map(version => ({
      versionNumber: version.versionNumber,
      fileName: version.fileName,
      fileSize: version.fileSize,
      mimeType: version.mimeType,
      downloadUrl: version.fileUrl,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
      comments: version.comments || '',
      isCurrent: version.versionNumber === document.currentVersion
    })).sort((a, b) => b.versionNumber - a.versionNumber);
    
    res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        title: document.title,
        currentVersion: document.currentVersion,
        versions
      }
    });
  } catch (error) {
    console.error('Error getting document versions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document versions',
      error: error.message
    });
  }
};


exports.setDocumentPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, isPublic } = req.body;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!document.hasPermission(req.user._id, 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to change document permissions'
      });
    }
    
    if (isPublic !== undefined) {
      document.isPublic = isPublic;
    }
    
    if (permissions && Array.isArray(permissions)) {
      const validPermissions = permissions.filter(p => 
        p.entity && ['user', 'role', 'department', 'public'].includes(p.entity) &&
        p.permission && ['read', 'write', 'delete', 'admin'].includes(p.permission)
      );
      
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid permission format'
        });
      }
      
      const ownerPermissionIndex = validPermissions.findIndex(p => 
        p.entity === 'user' && p.entityId === document.owner.toString() && p.permission !== 'admin'
      );
      
      if (ownerPermissionIndex !== -1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove admin permission from document owner'
        });
      }
      
      const entitiesToUpdate = new Set(validPermissions.map(p => `${p.entity}:${p.entityId}`));
      
      document.accessPermissions = document.accessPermissions.filter(p => {
        const key = `${p.entity}:${p.entityId}`;
        return !entitiesToUpdate.has(key);
      });
      
      document.accessPermissions.push(...validPermissions.map(p => ({
        ...p,
        grantedBy: req.user._id,
        grantedAt: new Date()
      })));
    }
    
    document.updatedBy = req.user._id;
    document.updatedAt = new Date();
    
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'Document permissions updated successfully',
      data: {
        isPublic: document.isPublic,
        permissions: document.accessPermissions
      }
    });
  } catch (error) {
    console.error('Error setting document permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set document permissions',
      error: error.message
    });
  }
};


exports.linkToProcess = async (req, res) => {
  try {
    const { documentId, processId } = req.params;
    const { relationship } = req.body;
    
    if (!relationship || !['attachment', 'reference', 'output', 'input'].includes(relationship)) {
      return res.status(400).json({
        success: false,
        message: 'Valid relationship type is required'
      });
    }
    
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(processId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid process ID'
      });
    }
    
    const processExists = await mongoose.model('ProcessInstance').findById(processId);
    if (!processExists) {
      return res.status(404).json({
        success: false,
        message: 'Process not found'
      });
    }
    
    const existingLink = document.relatedProcesses.find(rp => 
      rp.process.toString() === processId
    );
    
    if (existingLink) {
      existingLink.relationship = relationship;
    } else {
      document.relatedProcesses.push({
        process: processId,
        relationship,
        addedAt: new Date()
      });
    }
    
    document.updatedBy = req.user._id;
    document.updatedAt = new Date();
    
    await document.save();
    
    await mongoose.model('ProcessInstance').findByIdAndUpdate(processId, {
      $addToSet: {
        relatedDocuments: {
          _id: documentId,
          relationship,
          addedBy: req.user._id,
          addedAt: new Date()
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Document linked to process successfully',
      data: {
        documentId,
        processId,
        relationship
      }
    });
  } catch (error) {
    console.error('Error linking document to process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link document to process',
      error: error.message
    });
  }
};


exports.searchDocuments = async (req, res) => {
  try {
    const { search, category, status, type, folder, sortBy, sortOrder, page, limit } = req.query;
    
    let query = Document.find({
      $or: [
        { owner: req.user._id },
        { 'accessPermissions': { 
          $elemMatch: { 
            entity: 'user', 
            entityId: req.user._id.toString(), 
            permission: { $in: ['read', 'write', 'delete', 'admin'] }
          }
        }},
        { isPublic: true }
      ]
    });
    
    if (category) query = query.where('category', category);
    if (status) query = query.where('status', status || 'active');
    if (type) query = query.where('type', type);
    if (folder) query = query.where('folder', folder);
    if (search) {
      query = query.find({
        $text: { $search: search }
      });
    }
    
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }
    
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNum - 1) * pageSize;
    
    const documents = await query
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate('owner', 'name email')
      .populate('folder', 'name path');
    
    const total = await Document.countDocuments(query.getFilter());
    
    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      pages: Math.ceil(total / pageSize),
      currentPage: pageNum,
      data: documents.map(doc => ({
        _id: doc._id,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        tags: doc.tags,
        status: doc.status,
        type: doc.type,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        owner: doc.owner,
        folder: doc.folder,
        currentVersion: doc.currentVersion,
        isLocked: doc.isLocked,
        downloadUrl: doc.currentVersionData?.fileUrl
      }))
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search documents',
      error: error.message
    });
  }
};


exports.createFolder = async (req, res) => {
  // Implementation for folder creation
};


exports.getFolder = async (req, res) => {
  // Implementation for retrieving folder details
};


exports.listFolderContents = async (req, res) => {
  // Implementation for listing folder contents
};


exports.updateFolder = async (req, res) => {
  // Implementation for updating folder metadata
};


exports.deleteFolder = async (req, res) => {
  // Implementation for deleting folders
};
