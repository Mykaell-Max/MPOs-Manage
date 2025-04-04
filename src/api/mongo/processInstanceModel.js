const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const HistoryEntrySchema = new mongoose.Schema({
  fromState: String,
  toState: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  executedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  executedAt: {
    type: Date,
    default: Date.now
  },
  comments: String,
  systemGenerated: {
    type: Boolean,
    default: false
  },
  formData: mongoose.Schema.Types.Mixed 
});

const ProcessInstanceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  workflowVersion: {
    type: Number,
    required: true
  },
  workflowName: {
    type: String,
    required: true
  },
  currentState: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'canceled', 'suspended'],
    default: 'active'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: Date,
  category: String,
  tags: [String],
  history: [HistoryEntrySchema],
  comments: [CommentSchema],
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  
  sla: {
    deadline: Date,
    status: {
      type: String,
      enum: ['within', 'atrisk', 'overdue'],
      default: 'within'
    },
    timeInStates: [{
      state: String,
      enteredAt: Date,
      exitedAt: Date,
      duration: Number 
    }]
  },
  
  externalReferences: [{
    system: String,
    identifier: String,
    url: String,
    lastSyncedAt: Date
  }],
  
  relatedDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    relationship: {
      type: String,
      enum: ['attachment', 'reference', 'output', 'input'],
      default: 'attachment'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

ProcessInstanceSchema.index({ currentState: 1 });
ProcessInstanceSchema.index({ workflowName: 1 });
ProcessInstanceSchema.index({ startedBy: 1 });
ProcessInstanceSchema.index({ assignedTo: 1 });
ProcessInstanceSchema.index({ startedAt: -1 });
ProcessInstanceSchema.index({ status: 1 }); 
ProcessInstanceSchema.index({ 'data.productName': 'text', title: 'text', description: 'text' });
ProcessInstanceSchema.index({ 'externalReferences.system': 1, 'externalReferences.identifier': 1 }); 

ProcessInstanceSchema.methods.canExecuteAction = async function(actionName, userId, userRole) {
  try {
    if (this.status !== 'active') {
      return false;
    }
    
    const workflow = await mongoose.model('Workflow').findById(this.workflow);
    if (!workflow) return false;

    const state = workflow.states.find(s => s.name === this.currentState);
    if (!state) return false;

    const action = state.actions.find(a => a.name === actionName);
    if (!action) return false;

    return action.allowedRoles.includes(userRole);
  } catch (error) {
    console.error('Error in canExecuteAction:', error);
    return false;
  }
};

ProcessInstanceSchema.methods.getAvailableActions = async function(userId, userRole) {
  try {
    if (this.status !== 'active') {
      return [];
    }
    
    const workflow = await mongoose.model('Workflow').findById(this.workflow);
    if (!workflow) return [];

    const state = workflow.states.find(s => s.name === this.currentState);
    if (!state) return [];

    return state.actions.filter(action => 
      action.allowedRoles.includes(userRole)
    );
  } catch (error) {
    console.error('Error in getAvailableActions:', error);
    return [];
  }
};

ProcessInstanceSchema.statics.findTasksForUser = function(userId, userRole) {
  return this.find({
    $or: [
      { assignedTo: userId },
      { startedBy: userId }
    ],
    status: 'active'
  })
  .populate('workflow', 'name states')
  .populate('startedBy', 'name email')
  .sort({ startedAt: -1 });
};

ProcessInstanceSchema.methods.updateSlaStatus = function() {
  if (!this.sla || !this.sla.deadline) {
    return;
  }
  
  const now = new Date();
  const deadline = new Date(this.sla.deadline);
  const timeDiff = deadline - now;
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  
  if (timeDiff < 0) {
    this.sla.status = 'overdue';
  } else if (daysDiff <= 1) { 
    this.sla.status = 'atrisk';
  } else {
    this.sla.status = 'within';
  }
  
  return this.sla.status;
};

ProcessInstanceSchema.methods.trackStateTransition = function(fromState, toState) {
  if (!this.sla) {
    this.sla = { timeInStates: [] };
  }
  
  const now = new Date();
  
  if (fromState) {
    const stateTracking = this.sla.timeInStates.find(s => 
      s.state === fromState && !s.exitedAt
    );
    
    if (stateTracking) {
      stateTracking.exitedAt = now;
      stateTracking.duration = now - stateTracking.enteredAt;
    }
  }
  
  this.sla.timeInStates.push({
    state: toState,
    enteredAt: now,
    exitedAt: null,
    duration: 0
  });
};

ProcessInstanceSchema.methods.addRelatedDocument = function(documentId, relationship, userId) {
  if (!this.relatedDocuments) {
    this.relatedDocuments = [];
  }
  
  this.relatedDocuments.push({
    _id: documentId,
    relationship: relationship || 'attachment',
    addedBy: userId,
    addedAt: new Date()
  });
};

ProcessInstanceSchema.methods.syncWithExternalSystem = function(system, identifier, url) {
  if (!this.externalReferences) {
    this.externalReferences = [];
  }
  
  const existingRef = this.externalReferences.find(ref => 
    ref.system === system && ref.identifier === identifier
  );
  
  if (existingRef) {
    existingRef.url = url;
    existingRef.lastSyncedAt = new Date();
  } else {
    this.externalReferences.push({
      system,
      identifier,
      url,
      lastSyncedAt: new Date()
    });
  }
};

module.exports = mongoose.model('ProcessInstance', ProcessInstanceSchema);