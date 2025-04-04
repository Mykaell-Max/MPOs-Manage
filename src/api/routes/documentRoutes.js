const express = require('express');
const router = express.Router();
const documentController = require('../controller/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_TEMP_DIR || 'uploads/temp');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // limit: 10mb
  }
});

// Apply authentication middleware
router.use(authMiddleware.authenticate);

// Upload a new document
router.post('/upload', upload.single('file'), documentController.uploadDocument);

// ====== SPECIFIC ROUTES FIRST ======
// Download a document
router.get('/download/:id', documentController.downloadDocument);
router.get('/download/:id/version/:version', documentController.downloadDocument);

// View document (without downloading)
router.get('/view/:id', documentController.viewDocument);
router.get('/view/:id/version/:version', documentController.viewDocument);

// Search documents 
router.get('/search', documentController.searchDocuments);

// Folder routes
router.post('/folders', documentController.createFolder);
router.get('/folders/:id', documentController.getFolder);
router.get('/folders/:id/contents', documentController.listFolderContents);
router.put('/folders/:id', documentController.updateFolder);
router.delete('/folders/:id', documentController.deleteFolder);

// ====== GENERIC ID ROUTES AFTER SPECIFIC ROUTES ======
// Get document metadata
router.get('/:id', documentController.getDocument);

// Update document metadata
router.put('/:id', documentController.updateDocument);

// Delete document
router.delete('/:id', documentController.deleteDocument);

// Upload a new version of a document
router.post('/:id/version', upload.single('file'), documentController.uploadNewVersion);

// Lock/unlock document
router.post('/:id/lock', documentController.lockDocument);
router.post('/:id/unlock', documentController.unlockDocument);

// Get document versions
router.get('/:id/versions', documentController.getDocumentVersions);

// Set document permissions
router.put('/:id/permissions', documentController.setDocumentPermissions);

// Link document to process
router.post('/:documentId/link/:processId', documentController.linkToProcess);

module.exports = router;