const mongoose = require('mongoose');

const StateActionSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    label: { 
        type: String, 
        required: true 
    },
    targetState: { 
        type: String, 
        required: true 
    },
    allowedRoles: [{ 
        type: String
    }],
    requiredFields: [String],
    description: String,
    buttonVariant: { 
        type: String, 
        default: 'primary' 
    },
    confirmationRequired: { 
        type: Boolean, 
        default: false 
    },
    confirmationMessage: String
});

const WorkflowStateSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    label: { 
        type: String, 
        required: true 
    },
    description: String,
    isInitial: { 
        type: Boolean, 
        default: false 
    },
    isFinal: { 
        type: Boolean, 
        default: false 
    },
    color: { 
        type: String, 
        default: '#3498db' 
    },
    assignedRoles: [{ 
        type: String
    }],
    actions: [StateActionSchema],
    visibleFields: [String],
    editableFields: [String],
    requiredFields: [String]
});

const WorkflowSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
    },
    description: String,
    version: { 
        type: Number, 
        default: 1 
    },
    active: { 
        type: Boolean, 
        default: true 
    },
    category: {
        type: String,
        default: 'default'
    },
    states: [WorkflowStateSchema],
    formDefinition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FormDefinition'
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: Date,
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
});

WorkflowSchema.index({ name: 1, version: 1 }, { unique: true });

WorkflowSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

WorkflowSchema.methods.getAvailableActions = function(stateName, userRole) {
    const state = this.states.find(s => s.name === stateName);
    if (!state) return [];
    
    return state.actions.filter(action => 
        action.allowedRoles.includes(userRole) || 
        action.allowedRoles.includes('admin')
    );
};

WorkflowSchema.statics.findActive = function() {
    return this.find({ active: true });
};

module.exports = mongoose.model('Workflow', WorkflowSchema);