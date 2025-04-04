const mongoose = require('mongoose');

const ValidationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['required', 'min', 'max', 'minLength', 'maxLength', 'pattern', 'email', 'url', 'custom'],
    required: true
  },
  value: mongoose.Schema.Types.Mixed, 
  message: {
    type: String, 
    required: true
  },
  customValidator: String
}, { _id: false });

const OptionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String,
  disabled: Boolean,
  default: Boolean
}, { _id: false });

const TableColumnSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'select', 'date', 'checkbox', 'currency'],
    default: 'text'
  },
  width: String,
  options: [OptionSchema],
  validation: [ValidationSchema],
  required: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const FieldPermissionSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true
  },
  view: {
    type: Boolean,
    default: true
  },
  edit: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const FormFieldSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'text', 'textarea', 'number', 'email', 'password', 'date', 'time', 'datetime',
      'select', 'multiselect', 'radio', 'checkbox', 'switch', 'file', 'image',
      'currency', 'cpf', 'cnpj', 'phone', 'cep', 'table', 'heading', 'paragraph',
      'divider', 'richtext', 'hidden', 'html', 'custom'
    ],
    required: true
  },
  label: {
    type: String,
    required: function() {
      // Label is required unless it's a hidden field or divider
      return !['hidden', 'divider'].includes(this.type);
    }
  },
  placeholder: String,
  helpText: String,
  defaultValue: mongoose.Schema.Types.Mixed,
  options: [OptionSchema],
  validation: [ValidationSchema],
  required: {
    type: Boolean,
    default: false
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  hidden: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  permissions: [FieldPermissionSchema],
  visibilityCondition: {
    type: String, // JavaScript condition as string (e.g., "data.status === 'approved'")
    default: null
  },
  enableCondition: {
    type: String,
    default: null
  },
  requiredCondition: {
    type: String,
    default: null
  },
  formatters: {
    display: String, // Function to format display value
    save: String     // Function to format saved value
  },
  mask: String, // Input mask pattern
  // For file/image uploads
  fileConfig: {
    maxSize: Number, // In bytes
    allowedTypes: [String], // mime types
    maxFiles: Number
  },
  // For table fields
  tableConfig: {
    columns: [TableColumnSchema],
    minRows: Number,
    maxRows: Number,
    addRowLabel: String,
    removeRowLabel: String
  },
  // UI specific properties
  ui: {
    width: {
      type: String,
      default: '100%'
    },
    cssClass: String,
    style: mongoose.Schema.Types.Mixed,
    order: {
      type: Number,
      default: 0
    },
    group: String, // For grouping fields
    col: {
      xs: Number,
      sm: Number,
      md: Number,
      lg: Number
    }
  },
  // For custom field types
  customConfig: mongoose.Schema.Types.Mixed
}, { _id: true });

const FormSectionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  fields: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FormField' }],
  order: {
    type: Number,
    default: 0
  },
  collapsible: {
    type: Boolean,
    default: false
  },
  collapsed: {
    type: Boolean,
    default: false
  },
  permissions: [FieldPermissionSchema],
  visibilityCondition: String,
  cssClass: String,
  style: mongoose.Schema.Types.Mixed
}, { _id: true });

const FormDefinitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
  fields: [FormFieldSchema],
  sections: [FormSectionSchema],
  layout: {
    type: {
      type: String,
      enum: ['simple', 'tabs', 'wizard', 'custom'],
      default: 'simple'
    },
    config: mongoose.Schema.Types.Mixed 
  },
  permissions: {
    create: [String], 
    view: [String], 
    edit: [String]  
  },
  tabs: [{
    key: String,
    title: String,
    description: String,
    fields: [String], 
    sections: [String], 
    icon: String,
    visibilityCondition: String,
    order: Number
  }],
  behaviors: [{
    event: {
      type: String,
      enum: ['onChange', 'onLoad', 'onSubmit', 'onFieldChange', 'onStateChange']
    },
    target: String, 
    action: String, 
    condition: String 
  }],
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
  associatedWorkflows: [{
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow'
    },
    states: [String] 
  }]
}, {
  timestamps: true
});

FormDefinitionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

FormDefinitionSchema.methods.createNewVersion = async function(userId) {
  const newVersion = new mongoose.models.FormDefinition({
    ...this.toObject(),
    _id: undefined, 
    version: this.version + 1,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: undefined,
    updatedBy: undefined
  });

  return await newVersion.save();
};

FormDefinitionSchema.methods.validateSubmission = function(data) {
  const errors = {};
  
  this.fields.forEach(field => {
    const value = data[field.key];
    const fieldErrors = [];
    
    if (field.hidden || (!field.required && (value === undefined || value === null || value === ''))) {
      return;
    }
    
    if (field.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${field.label} is required`);
    }
    
    if (field.validation && value !== undefined && value !== null) {
      field.validation.forEach(rule => {
        let isValid = true;
        
        switch (rule.type) {
          case 'min':
            isValid = Number(value) >= rule.value;
            break;
          case 'max':
            isValid = Number(value) <= rule.value;
            break;
          case 'minLength':
            isValid = String(value).length >= rule.value;
            break;
          case 'maxLength':
            isValid = String(value).length <= rule.value;
            break;
          case 'pattern':
            isValid = new RegExp(rule.value).test(String(value));
            break;
          case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
            break;
          case 'url':
            isValid = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(String(value));
            break;
        }
        
        if (!isValid) {
          fieldErrors.push(rule.message);
        }
      });
    }
    
    if (fieldErrors.length > 0) {
      errors[field.key] = fieldErrors;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

FormDefinitionSchema.methods.getVisibleFieldsForRole = function(role) {
  return this.fields.filter(field => {
    if (field.permissions && field.permissions.length > 0) {
      const rolePermission = field.permissions.find(p => p.role === role);
      if (rolePermission) {
        return rolePermission.view;
      }
    }
    return true;
  }).map(field => field.key);
};

FormDefinitionSchema.methods.getEditableFieldsForRole = function(role) {
  return this.fields.filter(field => {
    if (field.readOnly) return false;
    
    if (field.permissions && field.permissions.length > 0) {
      const rolePermission = field.permissions.find(p => p.role === role);
      if (rolePermission) {
        return rolePermission.edit;
      }
    }
    
    return true;
  }).map(field => field.key);
};

FormDefinitionSchema.index({ name: 1, version: -1 });
FormDefinitionSchema.index({ active: 1 });
FormDefinitionSchema.index({ 'associatedWorkflows.workflow': 1 });
FormDefinitionSchema.index({ createdBy: 1 });

module.exports = mongoose.model('FormDefinition', FormDefinitionSchema);