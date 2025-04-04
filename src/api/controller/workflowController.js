const Workflow = require('../mongo/workflowModel');
const ProcessInstance = require('../mongo/processInstanceModel');
const FormDefinition = require('../mongo/formDefinitionModel');
const mongoose = require('mongoose');  

exports.createWorkflow = async (req, res) => {
  try {
    const workflowData = req.body;
    workflowData.createdBy = req.user._id; 

    if (!workflowData.name || !workflowData.states || !workflowData.states.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Workflow name and at least one state are required' 
      });
    }

    const initialStates = workflowData.states.filter(state => state.isInitial);
    if (initialStates.length !== 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Workflow must have exactly one initial state' 
      });
    }

    const stateNames = new Set(workflowData.states.map(state => state.name));
    const invalidTransitions = [];

    workflowData.states.forEach(state => {
      if (state.actions) {
        state.actions.forEach(action => {
          if (action.targetState && !stateNames.has(action.targetState)) {
            invalidTransitions.push({
              state: state.name,
              action: action.name,
              targetState: action.targetState
            });
          }
        });
      }
    });

    if (invalidTransitions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Workflow contains transitions to non-existent states',
        invalidTransitions
      });
    }

    const newWorkflow = new Workflow(workflowData);
    const savedWorkflow = await newWorkflow.save();

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: savedWorkflow
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A workflow with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create workflow',
      error: error.message
    });
  }
};


exports.getAllWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find().select('name description category version active createdAt');
    
    res.status(200).json({
      success: true,
      count: workflows.length,
      data: workflows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows',
      error: error.message
    });
  }
};


exports.getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow',
      error: error.message
    });
  }
};


exports.updateWorkflow = async (req, res) => {
  try {
    const workflowId = req.params.id;
    const workflowData = req.body;
    
    const currentWorkflow = await Workflow.findById(workflowId);
    if (!currentWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    await Workflow.findByIdAndUpdate(workflowId, { active: false });
    
    const newWorkflowData = {
      ...workflowData,
      createdBy: currentWorkflow.createdBy,
      updatedBy: req.user._id,
      version: currentWorkflow.version + 1,
      active: true
    };
    
    if (!newWorkflowData.name || !newWorkflowData.states || !newWorkflowData.states.length) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name and at least one state are required'
      });
    }
    
    const initialStates = newWorkflowData.states.filter(state => state.isInitial);
    if (initialStates.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Workflow must have exactly one initial state'
      });
    }
    
    const stateNames = new Set(newWorkflowData.states.map(state => state.name));
    const invalidTransitions = [];

    newWorkflowData.states.forEach(state => {
      if (state.actions) {
        state.actions.forEach(action => {
          if (action.targetState && !stateNames.has(action.targetState)) {
            invalidTransitions.push({
              state: state.name,
              action: action.name,
              targetState: action.targetState
            });
          }
        });
      }
    });

    if (invalidTransitions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Workflow contains transitions to non-existent states',
        invalidTransitions
      });
    }
    
    const newWorkflow = new Workflow(newWorkflowData);
    const savedWorkflow = await newWorkflow.save();
    
    res.status(200).json({
      success: true,
      message: 'Workflow updated with new version',
      data: savedWorkflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow',
      error: error.message
    });
  }
};


exports.getWorkflowVersions = async (req, res) => {
  try {
    const workflowName = req.params.name;
    const workflows = await Workflow.find({ name: workflowName })
                                  .sort({ version: -1 })
                                  .select('name description version active createdAt updatedAt');
    
    if (workflows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No workflows found with that name'
      });
    }
    
    res.status(200).json({
      success: true,
      count: workflows.length,
      data: workflows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow versions',
      error: error.message
    });
  }
};


exports.toggleWorkflowStatus = async (req, res) => {
  try {
    const workflowId = req.params.id;
    const { active } = req.body;
    
    if (active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Active status is required'
      });
    }
    
    const workflow = await Workflow.findByIdAndUpdate(
      workflowId,
      { 
        active, 
        updatedBy: req.user._id,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    const status = active ? 'activated' : 'deactivated';
    
    res.status(200).json({
      success: true,
      message: `Workflow successfully ${status}`,
      data: workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow status',
      error: error.message
    });
  }
};


exports.deleteWorkflow = async (req, res) => {
  try {
    const workflowId = req.params.id;
    
    const processCount = await ProcessInstance.countDocuments({ workflowId });
    
    if (processCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete workflow that is in use by process instances'
      });
    }
    
    const workflow = await Workflow.findByIdAndDelete(workflowId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Workflow successfully deleted',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete workflow',
      error: error.message
    });
  }
};


exports.getWorkflowStates = async (req, res) => {
  try {
    const workflowId = req.params.id;
    
    const workflow = await Workflow.findById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    const states = workflow.states.map(state => ({
      id: state._id,
      name: state.name,
      label: state.label,
      description: state.description,
      isInitial: state.isInitial,
      isFinal: state.isFinal,
      color: state.color,
      assignedRoles: state.assignedRoles,
      actionsCount: state.actions ? state.actions.length : 0
    }));
    
    res.status(200).json({
      success: true,
      count: states.length,
      workflowName: workflow.name,
      workflowVersion: workflow.version,
      data: states
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow states',
      error: error.message
    });
  }
};


exports.getStateDetails = async (req, res) => {
  try {
    const workflowId = req.params.workflowId;
    const stateName = req.params.stateName;
    
    const workflow = await Workflow.findById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    const state = workflow.states.find(s => s.name === stateName);
    
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found in workflow'
      });
    }
    
    res.status(200).json({
      success: true,
      data: state
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch state details',
      error: error.message
    });
  }
};


exports.getWorkflowDiagram = async (req, res) => {
  try {
    const workflowId = req.params.id;
    
    const workflow = await Workflow.findById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    const nodes = workflow.states.map(state => ({
      id: state.name,
      label: state.label,
      type: state.isInitial ? 'start' : state.isFinal ? 'end' : 'default',
      data: {
        description: state.description,
        color: state.color,
        assignedRoles: state.assignedRoles
      }
    }));
    
    const edges = [];
    workflow.states.forEach(state => {
      if (state.actions) {
        state.actions.forEach(action => {
          edges.push({
            id: `${state.name}-${action.name}-${action.targetState}`,
            source: state.name,
            target: action.targetState,
            label: action.label,
            data: {
              name: action.name,
              roles: action.allowedRoles,
              description: action.description
            }
          });
        });
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        workflowName: workflow.name,
        workflowVersion: workflow.version,
        nodes,
        edges
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow diagram data',
      error: error.message
    });
  }
};


exports.startProcess = async (req, res) => {
  try {
    const workflowId = req.params.id;
    const { title, data, description, priority, dueDate, category, tags } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Process title is required'
      });
    }
    
    const workflow = await Workflow.findById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    if (!workflow.active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start process with inactive workflow'
      });
    }
    
    const initialState = workflow.states.find(state => state.isInitial);
    
    if (!initialState) {
      return res.status(400).json({
        success: false,
        message: 'Workflow has no initial state defined'
      });
    }
    
    if (initialState.requiredFields && initialState.requiredFields.length > 0) {
      const missingFields = initialState.requiredFields.filter(field => 
        !data || data[field] === undefined
      );
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields for initial state',
          missingFields
        });
      }
    }
    
    const newProcess = new ProcessInstance({
      title,
      description,
      workflow: workflowId,
      workflowVersion: workflow.version,
      workflowName: workflow.name,
      currentState: initialState.name,
      data: data || {},
      priority: priority || 'medium',
      dueDate,
      category: category || workflow.category,
      tags,
      history: [{
        fromState: null,
        toState: initialState.name,
        action: 'start',
        executedBy: req.user._id,
        executedAt: new Date(),
        comments: 'Process started',
        systemGenerated: true
      }],
      assignedTo: initialState.assignedRoles?.length ? 
        await findUsersWithRoles(initialState.assignedRoles) : [],
      startedBy: req.user._id,
      status: 'active'
    });
    
    newProcess.trackStateTransition(null, initialState.name);
    
    if (dueDate) {
      newProcess.sla = { 
        deadline: new Date(dueDate),
        status: 'within'
      };
      newProcess.updateSlaStatus();
    }
    
    const savedProcess = await newProcess.save();
    
    res.status(201).json({
      success: true,
      message: 'Process started successfully',
      data: savedProcess
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start process',
      error: error.message
    });
  }
};


async function findUsersWithRoles(roles) {
  const User = mongoose.model('User');
  const users = await User.find({ roles: { $in: roles } });
  return users.map(user => user._id);
}


exports.searchWorkflows = async (req, res) => {
  try {
    const { name, category, active } = req.query;
    
    const query = {};
    
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (active !== undefined) {
      query.active = active === 'true';
    }
    
    const workflows = await Workflow.find(query)
                                  .select('name description category version active createdAt')
                                  .sort({ name: 1, version: -1 });
    
    res.status(200).json({
      success: true,
      count: workflows.length,
      data: workflows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search workflows',
      error: error.message
    });
  }
};


exports.cloneWorkflow = async (req, res) => {
  try {
    const sourceId = req.params.id;
    const { newName } = req.body;
    
    if (!newName) {
      return res.status(400).json({
        success: false,
        message: 'New workflow name is required'
      });
    }
    
    const existingWorkflow = await Workflow.findOne({ name: newName });
    
    if (existingWorkflow) {
      return res.status(409).json({
        success: false,
        message: 'A workflow with this name already exists'
      });
    }
    
    const sourceWorkflow = await Workflow.findById(sourceId);
    
    if (!sourceWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Source workflow not found'
      });
    }
    
    const newWorkflowData = {
      ...sourceWorkflow.toObject(),
      _id: undefined, 
      name: newName,
      version: 1,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: undefined,
      updatedBy: undefined
    };
    
    const newWorkflow = new Workflow(newWorkflowData);
    const savedWorkflow = await newWorkflow.save();
    
    res.status(201).json({
      success: true,
      message: 'Workflow cloned successfully',
      data: savedWorkflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clone workflow',
      error: error.message
    });
  }
};


exports.getWorkflowStats = async (req, res) => {
  try {
    const stats = await Workflow.aggregate([
      {
        $group: {
          _id: {
            name: "$name",
            active: "$active"
          },
          versions: { $sum: 1 },
          latestVersion: { $max: "$version" }
        }
      },
      {
        $group: {
          _id: "$_id.name",
          active: {
            $sum: {
              $cond: [{ $eq: ["$_id.active", true] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ["$_id.active", false] }, 1, 0]
            }
          },
          totalVersions: { $sum: "$versions" },
          latestVersion: { $max: "$latestVersion" }
        }
      },
      {
        $project: {
          name: "$_id",
          _id: 0,
          active: 1,
          inactive: 1,
          totalVersions: 1,
          latestVersion: 1
        }
      }
    ]);
    
    const totalWorkflows = stats.length;
    const activeWorkflows = stats.filter(wf => wf.active > 0).length;
    
    const categories = await Workflow.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: "$_id",
          _id: 0,
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalWorkflows,
        activeWorkflows,
        inactiveWorkflows: totalWorkflows - activeWorkflows,
        workflowStats: stats,
        categoryStats: categories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get workflow statistics',
      error: error.message
    });
  }
};


exports.associateForm = async (req, res) => {
  try {
    const workflowId = req.params.id;
    const { formId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(workflowId) || !mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow or form ID'
      });
    }
    
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    const FormDefinition = mongoose.model('FormDefinition');
    const formDefinition = await FormDefinition.findById(formId);
    if (!formDefinition) {
      return res.status(404).json({
        success: false,
        message: 'Form definition not found'
      });
    }
    
    workflow.formDefinition = formId;
    workflow.updatedBy = req.user._id;
    workflow.updatedAt = new Date();
    
    await workflow.save();
    
    await FormDefinition.updateOne(
      { _id: formId },
      {
        $addToSet: {
          associatedWorkflows: {
            workflow: workflowId,
            states: workflow.states.map(s => s.name)
          }
        },
        updatedBy: req.user._id,
        updatedAt: new Date()
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Form associated with workflow successfully',
      data: {
        workflow: workflow.name,
        form: formDefinition.name
      }
    });
  } catch (error) {
    console.error('Error associating form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to associate form with workflow',
      error: error.message
    });
  }
};