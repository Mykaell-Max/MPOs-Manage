const FormDefinition = require('../mongo/formDefinitionModel');
const Workflow = require('../mongo/workflowModel');
const mongoose = require('mongoose');


exports.createFormDefinition = async (req, res) => {
  try {
    const formData = req.body;
    
    formData.createdBy = req.user._id;
    
    if (!formData.name) {
      return res.status(400).json({
        success: false,
        message: 'Form name is required'
      });
    }
    
    const existingForm = await FormDefinition.findOne({ 
      name: formData.name,
      active: true 
    });
    
    if (existingForm) {
      return res.status(409).json({
        success: false,
        message: 'A form with this name already exists'
      });
    }
    
    if (formData.fields && formData.fields.length > 0) {
      const keys = formData.fields.map(field => field.key);
      const uniqueKeys = new Set(keys);
      
      if (keys.length !== uniqueKeys.size) {
        return res.status(400).json({
          success: false,
          message: 'Field keys must be unique within a form'
        });
      }
    }
    
    const newForm = new FormDefinition(formData);
    await newForm.save();
    
    res.status(201).json({
      success: true,
      message: 'Form definition created successfully',
      data: newForm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create form definition',
      error: error.message
    });
  }
};


exports.getAllFormDefinitions = async (req, res) => {
  try {
    const { active, search, page, limit, sort } = req.query;
    
    const query = {};
    
    if (active !== undefined) {
      query.active = active === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;
    
    const sortField = sort || '-createdAt';
    
    const forms = await FormDefinition.find(query)
      .select('name description version active createdBy createdAt updatedAt')
      .populate('createdBy', 'name email')
      .sort(sortField)
      .skip(skip)
      .limit(pageSize);
    
    const totalForms = await FormDefinition.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: forms.length,
      total: totalForms,
      pages: Math.ceil(totalForms / pageSize),
      currentPage: pageNumber,
      data: forms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve form definitions',
      error: error.message
    });
  }
};


exports.getFormDefinition = async (req, res) => {
  try {
    const formId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }
    
    const form = await FormDefinition.findById(formId)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('associatedWorkflows.workflow', 'name');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve form definition',
      error: error.message
    });
  }
};


exports.getFormDefinitionByName = async (req, res) => {
  try {
    const formName = req.params.name;
    
    const form = await FormDefinition.findOne({
      name: formName,
      active: true
    })
    .sort('-version')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve form definition',
      error: error.message
    });
  }
};


exports.updateFormDefinition = async (req, res) => {
  try {
    const formId = req.params.id;
    const formData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }
    
    const currentForm = await FormDefinition.findById(formId);
    
    if (!currentForm) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    if (formData.fields && formData.fields.length > 0) {
      const keys = formData.fields.map(field => field.key);
      const uniqueKeys = new Set(keys);
      
      if (keys.length !== uniqueKeys.size) {
        return res.status(400).json({
          success: false,
          message: 'Field keys must be unique within a form'
        });
      }
    }
    
    const newFormData = {
      ...currentForm.toObject(),
      ...formData,
      _id: undefined,
      version: currentForm.version + 1,
      createdBy: currentForm.createdBy,
      createdAt: currentForm.createdAt,
      updatedBy: req.user._id,
      updatedAt: new Date()
    };
    
    await FormDefinition.findByIdAndUpdate(formId, { active: false });
    
    const newForm = new FormDefinition(newFormData);
    await newForm.save();
    
    if (currentForm.associatedWorkflows && currentForm.associatedWorkflows.length > 0) {
      for (const association of currentForm.associatedWorkflows) {
        await Workflow.updateOne(
          { _id: association.workflow },
          { $set: { formDefinition: newForm._id } }
        );
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Form definition updated with new version',
      data: newForm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update form definition',
      error: error.message
    });
  }
};


exports.toggleFormStatus = async (req, res) => {
  try {
    const formId = req.params.id;
    const { active } = req.body;
    
    if (active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Active status is required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }
    
    const form = await FormDefinition.findByIdAndUpdate(
      formId,
      {
        active,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    const statusText = active ? 'activated' : 'deactivated';
    
    res.status(200).json({
      success: true,
      message: `Form definition ${statusText} successfully`,
      data: form
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update form status',
      error: error.message
    });
  }
};


exports.deleteFormDefinition = async (req, res) => {
  try {
    const formId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }
    
    const form = await FormDefinition.findById(formId);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    const usedInWorkflow = await Workflow.findOne({ formDefinition: formId });
    
    if (usedInWorkflow) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete form that is used in workflows. Deactivate it instead.'
      });
    }
    
    await FormDefinition.findByIdAndDelete(formId);
    
    res.status(200).json({
      success: true,
      message: 'Form definition deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete form definition',
      error: error.message
    });
  }
};


exports.cloneFormDefinition = async (req, res) => {
  try {
    const formId = req.params.id;
    const { newName } = req.body;
    
    if (!newName) {
      return res.status(400).json({
        success: false,
        message: 'New form name is required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }
    
    const existingForm = await FormDefinition.findOne({ 
      name: newName,
      active: true 
    });
    
    if (existingForm) {
      return res.status(409).json({
        success: false,
        message: 'A form with this name already exists'
      });
    }
    
    const sourceForm = await FormDefinition.findById(formId);
    
    if (!sourceForm) {
      return res.status(404).json({
        success: false,
        message: 'Source form not found'
      });
    }
    
    const cloneData = {
      ...sourceForm.toObject(),
      _id: undefined,
      name: newName,
      version: 1,
      associatedWorkflows: [],
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedBy: undefined,
      updatedAt: undefined
    };
    
    const clonedForm = new FormDefinition(cloneData);
    await clonedForm.save();
    
    res.status(201).json({
      success: true,
      message: 'Form definition cloned successfully',
      data: clonedForm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clone form definition',
      error: error.message
    });
  }
};


exports.getFormVersions = async (req, res) => {
  try {
    const formName = req.params.name;
    
    const versions = await FormDefinition.find({ name: formName })
      .select('name version active createdBy createdAt updatedAt')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort('-version');
    
    if (versions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No form versions found'
      });
    }
    
    res.status(200).json({
      success: true,
      count: versions.length,
      data: versions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve form versions',
      error: error.message
    });
  }
};


exports.associateWithWorkflow = async (req, res) => {
  try {
    const formId = req.params.id;
    const { workflowId, states } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(formId) || !mongoose.Types.ObjectId.isValid(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form or workflow ID'
      });
    }
    
    const form = await FormDefinition.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    if (states && states.length > 0) {
      const workflowStates = workflow.states.map(state => state.name);
      const invalidStates = states.filter(state => !workflowStates.includes(state));
      
      if (invalidStates.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some states do not exist in workflow',
          invalidStates
        });
      }
    }
    
    const existingAssoc = form.associatedWorkflows.find(
      assoc => assoc.workflow.toString() === workflowId
    );
    
    if (existingAssoc) {
      existingAssoc.states = states || [];
    } else {
      form.associatedWorkflows.push({
        workflow: workflowId,
        states: states || []
      });
    }
    
    form.updatedBy = req.user._id;
    form.updatedAt = new Date();
    
    await form.save();
    
    await Workflow.findByIdAndUpdate(workflowId, { 
      formDefinition: formId,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });
    
    const updatedForm = await FormDefinition.findById(formId)
      .populate('associatedWorkflows.workflow', 'name');
    
    res.status(200).json({
      success: true,
      message: 'Form associated with workflow successfully',
      data: updatedForm.associatedWorkflows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to associate form with workflow',
      error: error.message
    });
  }
};


exports.removeWorkflowAssociation = async (req, res) => {
  try {
    const { formId, workflowId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(formId) || !mongoose.Types.ObjectId.isValid(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form or workflow ID'
      });
    }
    
    const form = await FormDefinition.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    form.associatedWorkflows = form.associatedWorkflows.filter(
      assoc => assoc.workflow.toString() !== workflowId
    );
    
    form.updatedBy = req.user._id;
    form.updatedAt = new Date();
    
    await form.save();
    
    await Workflow.updateOne(
      { _id: workflowId, formDefinition: formId },
      { $unset: { formDefinition: "" } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Workflow association removed successfully',
      data: form.associatedWorkflows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove workflow association',
      error: error.message
    });
  }
};


exports.getFormPermissions = async (req, res) => {
  try {
    const formId = req.params.id;
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role parameter is required'
      });
    }
    
    const form = await FormDefinition.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    const visibleFields = form.getVisibleFieldsForRole(role);
    const editableFields = form.getEditableFieldsForRole(role);
    
    const fieldPermissions = form.fields.map(field => ({
      key: field.key,
      visible: visibleFields.includes(field.key),
      editable: editableFields.includes(field.key)
    }));
    
    res.status(200).json({
      success: true,
      data: {
        role,
        permissions: {
          canView: form.permissions.view.includes(role),
          canEdit: form.permissions.edit.includes(role),
          canCreate: form.permissions.create.includes(role)
        },
        fieldPermissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get form permissions',
      error: error.message
    });
  }
};


exports.validateFormData = async (req, res) => {
  try {
    const formId = req.params.id;
    const data = req.body;
    
    const form = await FormDefinition.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    const validation = form.validateSubmission(data);
    
    res.status(200).json({
      success: true,
      isValid: validation.isValid,
      errors: validation.errors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate form data',
      error: error.message
    });
  }
};
