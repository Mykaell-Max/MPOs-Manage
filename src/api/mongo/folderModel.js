const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessPermissions: [{
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
      ref: 'User'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
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
  updatedAt: Date
}, {
  timestamps: true
});

FolderSchema.index({ path: 1 }, { unique: true });
FolderSchema.index({ parent: 1 });
FolderSchema.index({ owner: 1 });
FolderSchema.index({ 'accessPermissions.entityId': 1, 'accessPermissions.entity': 1 });
FolderSchema.index({ name: 'text', description: 'text' });


module.exports = mongoose.model('Folder', FolderSchema);