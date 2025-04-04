const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  permissions: [String],
  isCustom: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: 6,
    select: false
  },
  roles: [String],  
  roleDetails: [RoleSchema],  
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  profileImage: String,

  substitutes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: Date,
    endDate: Date,
    reason: String,
    active: {
      type: Boolean,
      default: true
    },
    workflows: [mongoose.Schema.Types.ObjectId]  
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.hasRole = function(roleName) {
  return this.roles.includes(roleName);
};

UserSchema.methods.hasPermission = function(permission) {
  if (this.roles.includes('Admin')) return true;
  return this.roleDetails.some(role => 
    role.permissions && role.permissions.includes(permission)
  );
};

UserSchema.methods.canSubstituteFor = function(userId, workflowId = null) {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  return this.substitutes.some(sub => 
    sub.user.toString() === userId.toString() &&
    sub.active &&
    (!sub.startDate || sub.startDate <= now) &&
    (!sub.endDate || sub.endDate >= now) &&
    (!workflowId || !sub.workflows.length || sub.workflows.some(wf => wf.toString() === workflowId.toString()))
  );
};

UserSchema.methods.getActiveSubstitutes = function() {
  const now = new Date();
  
  return this.substitutes.filter(sub => 
    sub.active &&
    (!sub.startDate || sub.startDate <= now) &&
    (!sub.endDate || sub.endDate >= now)
  ).map(sub => sub.user);
};

UserSchema.virtual('fullName').get(function() {
  return `${this.name}`;
});

UserSchema.index({ email: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ 'substitutes.user': 1, 'substitutes.active': 1 });

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const RoleModel = mongoose.model('Role', new mongoose.Schema(RoleSchema.obj));

module.exports = {
  User: mongoose.model('User', UserSchema),
  Role: RoleModel
};
