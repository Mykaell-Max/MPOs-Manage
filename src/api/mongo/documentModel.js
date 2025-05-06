const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  versionNumber: {
    type: Number,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  storagePath: {
    type: String,
    required: true
  },
  checksum: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comments: String,
  metadata: mongoose.Schema.Types.Mixed
}, { _id: true });

const AccessPermissionSchema = new mongoose.Schema({
  entity: {
    type: String,
    required: true,
    enum: ['user', 'role', 'department', 'public']
  },
  entityId: {
    type: String,
    required: function() {
      return this.entity !== 'public';
    }
  },
  permission: {
    type: String,
    enum: ['read', 'write', 'delete', 'admin'],
    required: true
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grantedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const SharingSchema = new mongoose.Schema({
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permission: {
    type: String,
    enum: ['read', 'write'],
    default: 'read'
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  message: String,
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: Date
}, { _id: true });

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder'
  },
  category: {
    type: String,
    default: 'uncategorized'
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'final', 'archived', 'deleted'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['file', 'folder', 'link'],
    default: 'file'
  },
  extension: String,
  mimeType: String,
  currentVersion: {
    type: Number,
    default: 1
  },
  versions: [VersionSchema],
  accessPermissions: [AccessPermissionSchema],
  sharing: [SharingSchema],
  isFavorite: {
    type: Boolean,
    default: false
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: Date,

  externalReferences: [{
    service: {
      type: String,
      required: true
    },
    referenceId: {
      type: String,
      required: true
    },
    referenceUrl: String,
    syncedAt: Date
  }],

  relatedProcesses: [{
    process: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcessInstance',
      required: true
    },
    relationship: {
      type: String,
      enum: ['attachment', 'reference', 'output', 'input'],
      default: 'attachment'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  preview: {
    available: {
      type: Boolean,
      default: false
    },
    thumbnailUrl: String,
    previewUrl: String,
    generatedAt: Date
  },
  
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: Date,
  lastViewedAt: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

DocumentSchema.index({ owner: 1 });
DocumentSchema.index({ folder: 1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ createdAt: -1 });
DocumentSchema.index({ 'accessPermissions.entityId': 1, 'accessPermissions.entity': 1 });
DocumentSchema.index({ 'relatedProcesses.process': 1 });
DocumentSchema.index({ title: 'text', description: 'text', tags: 'text' });
DocumentSchema.index({ category: 1, tags: 1 });

DocumentSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.versions || this.versions.length === 0) {
      return next(new Error('New document must have at least one version'));
    }
  }
  this.updatedAt = Date.now();
  next();
});

DocumentSchema.methods.addVersion = function(versionData) {
  const versionNumber = this.currentVersion + 1;
  const newVersion = {
    versionNumber,
    ...versionData
  };
  this.versions.push(newVersion);
  this.currentVersion = versionNumber;
  this.mimeType = versionData.mimeType;
  this.extension = versionData.fileName.split('.').pop();
  return newVersion;
};

DocumentSchema.methods.hasPermission = function(userId, requiredPermission) {
  if (!userId) return false;
  
  if (this.owner && this.owner.toString() === userId.toString()) {
    return true;
  }

  if (this.accessPermissions) {
    const userPermission = this.accessPermissions.find(p => 
      p.entity === 'user' && p.entityId === userId.toString()
    );
    
    if (userPermission) {
      if (userPermission.permission === 'admin') return true;
      if (userPermission.permission === 'write' && requiredPermission === 'read') return true;
      if (userPermission.permission === requiredPermission) return true;
    }
  }
  
  // TODO: check role-based permissions (would need users roles...)
  
  if (this.isPublic && requiredPermission === 'read') {
    return true;
  }
  
  return false;
};

DocumentSchema.methods.getLatestVersion = function() {
  if (!this.versions || this.versions.length === 0) {
    return null;
  }
  
  return this.versions.find(v => v.versionNumber === this.currentVersion) || 
         this.versions[this.versions.length - 1];
};

DocumentSchema.statics.findByUserAccess = async function(userId, permission = 'read', options = {}) {
  const { category, status, type, folder, search, sort = '-createdAt', page = 1, limit = 10 } = options;
  
  let query = this.find({
    $or: [
      { owner: userId },
      { 'accessPermissions': { 
        $elemMatch: { 
          entity: 'user', 
          entityId: userId.toString(), 
          permission: { $in: getPermissionHierarchy(permission) }
        }
      }},
      ...(permission === 'read' ? [{ isPublic: true }] : [])
    ]
  });
  
  // Apply filters
  if (category) query = query.where('category', category);
  if (status) query = query.where('status', status);
  if (type) query = query.where('type', type);
  if (folder) query = query.where('folder', folder);
  if (search) {
    query = query.find({
      $text: { $search: search }
    });
  }
  
  // Apply pagination
  const skip = (page - 1) * limit;
  query = query.sort(sort).skip(skip).limit(limit);
  
  return query;
};

function getPermissionHierarchy(permission) {
  switch(permission) {
    case 'read':
      return ['read', 'write', 'delete', 'admin'];
    case 'write':
      return ['write', 'delete', 'admin'];
    case 'delete':
      return ['delete', 'admin'];
    case 'admin':
      return ['admin'];
    default:
      return [permission];
  }
}

DocumentSchema.virtual('currentVersionData').get(function() {
  return this.getLatestVersion();
});

DocumentSchema.set('toJSON', { virtuals: true });
DocumentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Document', DocumentSchema);