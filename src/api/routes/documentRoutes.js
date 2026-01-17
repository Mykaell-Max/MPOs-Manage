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
router.post('/upload', upload.single('file'), (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Faz upload de um novo documento'
  */
  return documentController.uploadDocument(req, res, next);
});

// ====== SPECIFIC ROUTES FIRST ======
// Download a document
router.get('/download/:id', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Faz download de um documento'
  */
  return documentController.downloadDocument(req, res, next);
});
router.get('/download/:id/version/:version', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Faz download de uma versão específica do documento'
  */
  return documentController.downloadDocument(req, res, next);
});

// View document (without downloading)
router.get('/view/:id', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Visualiza documento sem baixar'
  */
  return documentController.viewDocument(req, res, next);
});
router.get('/view/:id/version/:version', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Visualiza versão específica do documento'
  */
  return documentController.viewDocument(req, res, next);
});

// Search documents 
router.get('/search', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Busca documentos'
  */
  return documentController.searchDocuments(req, res, next);
});

// Folder routes
router.post('/folders', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Cria uma nova pasta de documentos'
  */
  return documentController.createFolder(req, res, next);
});
router.get('/folders/:id', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Busca pasta de documentos por ID'
  */
  return documentController.getFolder(req, res, next);
});
router.get('/folders/:id/contents', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Lista conteúdos da pasta de documentos'
  */
  return documentController.listFolderContents(req, res, next);
});
router.put('/folders/:id', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Atualiza pasta de documentos'
  */
  return documentController.updateFolder(req, res, next);
});
router.delete('/folders/:id', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Exclui pasta de documentos'
  */
  return documentController.deleteFolder(req, res, next);
});

// ====== GENERIC ID ROUTES AFTER SPECIFIC ROUTES ======
// Get document metadata
router.get('/:id', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Busca metadados do documento por ID'
  */
  return documentController.getDocument(req, res, next);
});

// Update document metadata
router.put('/:id', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Atualiza metadados do documento'
  */
  return documentController.updateDocument(req, res, next);
});

// Delete document
router.delete('/:id', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Exclui documento'
  */
  return documentController.deleteDocument(req, res, next);
});

// Upload a new version of a document
router.post('/:id/version', upload.single('file'), (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Faz upload de uma nova versão do documento'
  */
  return documentController.uploadNewVersion(req, res, next);
});

// Lock/unlock document
router.post('/:id/lock', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Trava o documento'
  */
  return documentController.lockDocument(req, res, next);
});
router.post('/:id/unlock', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Destrava o documento'
  */
  return documentController.unlockDocument(req, res, next);
});

// Get document versions
router.get('/:id/versions', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Retorna versões do documento'
  */
  return documentController.getDocumentVersions(req, res, next);
});

// Set document permissions
router.put('/:id/permissions', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Define permissões do documento'
  */
  return documentController.setDocumentPermissions(req, res, next);
});

// Link document to process
router.post('/:documentId/link/:processId', (req, res, next) => {
  /*
    #swagger.tags = ['Documento']
    #swagger.description = 'Vincula documento ao processo'
  */
  return documentController.linkToProcess(req, res, next);
});

module.exports = router;