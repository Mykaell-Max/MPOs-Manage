const fs = require('fs');
const path = require('path');
const app = require('./app');
const PORT = global.env.PORT;

// Create necessary directories for file uploads
const tempUploadDir = process.env.UPLOAD_TEMP_DIR || path.join(__dirname, '../uploads/temp');
const documentStorageDir = process.env.DOCUMENT_STORAGE_PATH || path.join(__dirname, '../uploads/documents');

try {
  if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
    console.log(`Created temporary upload directory: ${tempUploadDir}`);
  }
  
  if (!fs.existsSync(documentStorageDir)) {
    fs.mkdirSync(documentStorageDir, { recursive: true });
    console.log(`Created document storage directory: ${documentStorageDir}`);
  }
} catch (error) {
  console.error('Error creating upload directories:', error);
}

app.listen(PORT, () => {
  console.log(`Service running on port ${PORT}...`);
});