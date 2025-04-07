const ProcessInstance = require('../mongo/processInstanceModel');
const Workflow = require('../mongo/workflowModel');
const { User } = require('../mongo/userModel');
const executionService = require('../services/processExecutionService');
const mongoose = require('mongoose');


exports.startProcess = async (req, res) => {
  try {
    const { workflowId, title, description, data } = req.body;
    
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
        message: 'Workflow has no initial state'
      });
    }
    
    if (initialState.requiredFields && initialState.requiredFields.length > 0) {
      const missingFields = initialState.requiredFields.filter(field => 
        !data || !data[field]
      );
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields for initial state',
          missingFields
        });
      }
    }
    
    let assignedTo = [];
    if (initialState.assignedRoles && initialState.assignedRoles.length > 0) {
      const users = await User.find({
        roles: { $in: initialState.assignedRoles }
      }).select('_id');
      
      assignedTo = users.map(user => user._id);
    }
    
    const processInstance = new ProcessInstance({
      workflow: workflowId,
      workflowVersion: workflow.version,
      workflowName: workflow.name,
      title,
      description,
      currentState: initialState.name,
      data: data || {},
      history: [{
        fromState: null,
        toState: initialState.name,
        action: 'start',
        executedBy: req.user._id,
        executedAt: new Date(),
        comments: 'Process started'
      }],
      startedBy: req.user._id,
      assignedTo,
      status: 'active'
    });
    
    const savedProcess = await processInstance.save();
    
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


exports.executeAction = async (req, res) => {
  try {
    const { processId, action } = req.params;
    const { data, comments } = req.body;
    
    const updatedProcess = await executionService.executeAction(
      processId, 
      action, 
      req.user, 
      data, 
      comments
    );
    
    res.status(200).json({
      success: true,
      message: `Action ${action} executed successfully`,
      data: {
        processId: updatedProcess._id,
        currentState: updatedProcess.currentState,
        status: updatedProcess.status
      }
    });
  } catch (error) {
    console.error('Error executing process action:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to execute action',
      error: error.stack
    });
  }
};


exports.getProcesses = async (req, res) => {
  try {
    const { 
      status, state, workflow, assignedToMe, startedByMe, 
      sortBy, order, page, limit 
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (state) query.currentState = state;
    if (workflow) query.workflow = workflow;
    
    if (req.user.role !== 'Admin') {
      if (assignedToMe === 'true') {
        query.assignedTo = req.user._id;
      } else if (startedByMe === 'true') {
        query.startedBy = req.user._id;
      } else {
        query.$or = [
          { assignedTo: req.user._id },
          { startedBy: req.user._id }
        ];
      }
    }
    
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNum - 1) * pageSize;
    
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; 
    }
    
    const processes = await ProcessInstance.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate('workflow', 'name')
      .populate('startedBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();
    
    const total = await ProcessInstance.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: processes.length,
      total,
      pages: Math.ceil(total / pageSize),
      currentPage: pageNum,
      data: processes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch processes',
      error: error.message
    });
  }
};


exports.getProcessById = async (req, res) => {
  try {
    const processId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(processId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid process ID format'
      });
    }
    
    const process = await ProcessInstance.findById(processId)
      .populate('workflow')
      .populate('startedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate({
        path: 'history.executedBy',
        select: 'name email'
      })
      .populate({
        path: 'comments.createdBy',
        select: 'name email'
      });
    
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Process instance not found'
      });
    }
    
    if (req.user.role !== 'Admin' && 
        !process.assignedTo.some(user => user._id.equals(req.user._id)) &&
        !process.startedBy._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this process'
      });
    }
    
    res.status(200).json({
      success: true,
      data: process
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch process',
      error: error.message
    });
  }
};


exports.getAvailableActions = async (req, res) => {
  try {
    const processId = req.params.id;
    
    const process = await ProcessInstance.findById(processId);
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Process instance not found'
      });
    }
    
    if (process.status !== 'active') {
      return res.status(200).json({
        success: true,
        message: `No actions available for ${process.status} process`,
        data: []
      });
    }
    
    const workflow = await Workflow.findById(process.workflow);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Associated workflow not found'
      });
    }
    
    const currentState = workflow.states.find(
      state => state.name === process.currentState
    );
    if (!currentState) {
      return res.status(400).json({
        success: false,
        message: 'Current state not found in workflow'
      });
    }
    
    const availableActions = currentState.actions.filter(action => 
      action.allowedRoles.includes(req.user.role) || 
      (req.user.role === 'Admin' && action.allowedRoles.includes('Admin'))
    ).map(action => ({
      name: action.name,
      label: action.label,
      targetState: action.targetState,
      description: action.description,
      buttonVariant: action.buttonVariant,
      confirmationRequired: action.confirmationRequired,
      confirmationMessage: action.confirmationMessage,
      requiredFields: action.requiredFields || []
    }));
    
    res.status(200).json({
      success: true,
      currentState: {
        name: currentState.name,
        label: currentState.label
      },
      data: availableActions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get available actions',
      error: error.message
    });
  }
};


exports.addComment = async (req, res) => {
  try {
    const processId = req.params.id;
    const { text, attachments } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }
    
    const process = await ProcessInstance.findById(processId);
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Process instance not found'
      });
    }
    
    const canComment = 
      process.assignedTo.includes(req.user._id) || 
      process.startedBy.equals(req.user._id) ||
      req.user.role === 'Admin';
    
    if (!canComment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to comment on this process'
      });
    }
    
    const newComment = {
      text,
      attachments: attachments || [],
      createdBy: req.user._id,
      createdAt: new Date()
    };
    
    process.comments.push(newComment);
    await process.save();
    
    const updatedProcess = await ProcessInstance.findById(processId)
      .populate({
        path: 'comments.createdBy',
        select: 'name email'
      });
    
    const addedComment = updatedProcess.comments[updatedProcess.comments.length - 1];
    
    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: addedComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};


exports.getProcessHistory = async (req, res) => {
  try {
    const processId = req.params.id;
    
    const process = await ProcessInstance.findById(processId)
      .select('history')
      .populate({
        path: 'history.executedBy',
        select: 'name email role'
      });
    
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Process instance not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: process.history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch process history',
      error: error.message
    });
  }
};


exports.getMyTasks = async (req, res) => {
  try {
    const { status, sortBy, order, page, limit } = req.query;
    
    const query = {
      assignedTo: req.user._id,
      status: status || 'active'
    };
    
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNum - 1) * pageSize;
    
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.updatedAt = -1; 
    }
    
    const tasks = await ProcessInstance.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate('workflow', 'name')
      .populate('startedBy', 'name')
      .select('title description currentState workflowVersion createdAt updatedAt dueDate priority');
    
    const total = await ProcessInstance.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / pageSize),
      currentPage: pageNum,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your tasks',
      error: error.message
    });
  }
};


exports.reassignProcess = async (req, res) => {
  try {
    const { processId } = req.params;
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }
    
    const validUserIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validUserIds.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more user IDs are invalid'
      });
    }
    
    const usersCount = await User.countDocuments({
      _id: { $in: validUserIds }
    });
    
    if (usersCount !== validUserIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more users do not exist'
      });
    }
    
    const process = await ProcessInstance.findById(processId);
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Process instance not found'
      });
    }
    
    const isAdmin = req.user.role === 'Admin';
    const isAssignee = process.assignedTo.some(id => id.equals(req.user._id));
    
    if (!isAdmin && !isAssignee) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reassign this process'
      });
    }
    
    process.assignedTo = validUserIds;
    process.updatedAt = new Date();
    
    process.history.push({
      fromState: process.currentState,
      toState: process.currentState,
      action: 'reassign',
      executedBy: req.user._id,
      executedAt: new Date(),
      comments: `Process reassigned to different users`
    });
    
    await process.save();
    
    const updatedProcess = await ProcessInstance.findById(processId)
      .populate('assignedTo', 'name email role');
    
    res.status(200).json({
      success: true,
      message: 'Process reassigned successfully',
      data: updatedProcess
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reassign process',
      error: error.message
    });
  }
}


exports.getProcessStats = async (req, res) => {
    try {
      const query = {};
      
      if (req.user.role !== 'Admin') {
        query.$or = [
          { assignedTo: req.user._id },
          { startedBy: req.user._id }
        ];
      }
      
      const statusStats = await ProcessInstance.aggregate([
        { $match: query },
        { $group: {
          _id: "$status",
          count: { $sum: 1 }
        }},
        { $project: {
          status: "$_id",
          count: 1,
          _id: 0
        }}
      ]);
      
      const stateStats = await ProcessInstance.aggregate([
        { $match: query },
        { $group: {
          _id: "$currentState",
          count: { $sum: 1 }
        }},
        { $project: {
          state: "$_id",
          count: 1,
          _id: 0
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      const workflowStats = await ProcessInstance.aggregate([
        { $match: query },
        { $group: {
          _id: "$workflow",
          count: { $sum: 1 }
        }},
        { $lookup: {
          from: 'workflows',
          localField: '_id',
          foreignField: '_id',
          as: 'workflowInfo'
        }},
        { $project: {
          workflowId: "$_id",
          workflowName: { $arrayElemAt: ["$workflowInfo.name", 0] },
          count: 1,
          _id: 0
        }},
        { $sort: { count: -1 } }
      ]);
      
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const timeStats = await ProcessInstance.aggregate([
        { $match: { 
          ...query,
          createdAt: { $gte: lastWeek } 
        }},
        { $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
          },
          count: { $sum: 1 }
        }},
        { $project: {
          date: "$_id",
          count: 1,
          _id: 0
        }},
        { $sort: { date: 1 } }
      ]);
      
      const completionTimeStats = await ProcessInstance.aggregate([
        { $match: { 
          ...query,
          status: 'completed',
          completedAt: { $exists: true }
        }},
        { $project: {
          processTime: { 
            $divide: [
              { $subtract: ["$completedAt", "$createdAt"] },
              1000 * 60 * 60 
            ]
          }
        }},
        { $group: {
          _id: null,
          averageTime: { $avg: "$processTime" },
          minTime: { $min: "$processTime" },
          maxTime: { $max: "$processTime" },
          count: { $sum: 1 }
        }},
        { $project: {
          averageTime: { $round: ["$averageTime", 2] },
          minTime: { $round: ["$minTime", 2] },
          maxTime: { $round: ["$maxTime", 2] },
          count: 1,
          _id: 0
        }}
      ]);
      
      const userStats = await ProcessInstance.aggregate([
        { $match: { 
          ...query,
          status: 'completed'
        }},
        { $lookup: {
          from: 'users',
          localField: 'startedBy',
          foreignField: '_id',
          as: 'initiatorInfo'
        }},
        { $group: {
          _id: "$startedBy",
          userName: { $first: { $arrayElemAt: ["$initiatorInfo.name", 0] } },
          totalProcesses: { $sum: 1 },
          averageCompletionTime: { 
            $avg: { 
              $divide: [
                { $subtract: ["$completedAt", "$createdAt"] },
                1000 * 60 * 60 
              ]
            } 
          }
        }},
        { $project: {
          userId: "$_id",
          userName: 1,
          totalProcesses: 1,
          averageCompletionTime: { $round: ["$averageCompletionTime", 2] },
          _id: 0
        }},
        { $sort: { totalProcesses: -1 } },
        { $limit: 5 }
      ]);
      
      res.status(200).json({
        success: true,
        data: {
          byStatus: statusStats,
          byState: stateStats,
          byWorkflow: workflowStats,
          timeStats,
          completionTime: completionTimeStats[0] || { 
            averageTime: 0, 
            minTime: 0, 
            maxTime: 0, 
            count: 0 
          },
          topUsers: userStats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch process statistics',
        error: error.message
      });
    }
};
  

exports.getProcessTimeline = async (req, res) => {
try {
    const { processId } = req.params;
    
    const process = await ProcessInstance.findById(processId)
    .populate({
        path: 'history.executedBy',
        select: 'name'
    })
    .populate('workflow');
    
    if (!process) {
    return res.status(404).json({
        success: false,
        message: 'Process instance not found'
    });
    }
    
    const timeline = process.history.map((entry, index) => {
    const executorName = entry.executedBy ? entry.executedBy.name : 'System';
    
    return {
        id: index,
        date: entry.executedAt,
        action: entry.action,
        fromState: entry.fromState,
        toState: entry.toState,
        executor: executorName,
        comments: entry.comments || '',
        isLatest: index === process.history.length - 1
    };
    });
    
    const workflowStates = process.workflow ? process.workflow.states.map(state => ({
    name: state.name,
    label: state.label,
    color: state.color,
    isInitial: state.isInitial,
    isFinal: state.isFinal
    })) : [];
    
    res.status(200).json({
    success: true,
    data: {
        timeline,
        currentState: process.currentState,
        workflowStates,
        processTitle: process.title,
        startDate: process.createdAt,
        endDate: process.completedAt
    }
    });
} catch (error) {
    res.status(500).json({
    success: false,
    message: 'Failed to fetch process timeline',
    error: error.message
    });
}
};
  

exports.exportProcess = async (req, res) => {
try {
    const { processId } = req.params;
    const { format } = req.query; 
    
    const process = await ProcessInstance.findById(processId)
    .populate('workflow', 'name')
    .populate('startedBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate({
        path: 'history.executedBy',
        select: 'name email'
    });
    
    if (!process) {
    return res.status(404).json({
        success: false,
        message: 'Process instance not found'
    });
    }
    
    if (req.user.role !== 'Admin' && 
        !process.assignedTo.some(user => user._id.equals(req.user._id)) &&
        !process.startedBy._id.equals(req.user._id)) {
    return res.status(403).json({
        success: false,
        message: 'You do not have permission to export this process'
    });
    }
    
    const exportData = {
    processId: process._id,
    title: process.title,
    description: process.description || '',
    workflow: process.workflow.name,
    workflowVersion: process.workflowVersion,
    currentState: process.currentState,
    startedBy: process.startedBy.name,
    initiatedAt: process.createdAt,
    status: process.status,
    data: process.data,
    history: process.history.map(entry => ({
        action: entry.action,
        fromState: entry.fromState || 'N/A',
        toState: entry.toState,
        executedBy: entry.executedBy ? entry.executedBy.name : 'System',
        executedAt: entry.executedAt,
        comments: entry.comments || ''
    }))
    };
    
    if (format === 'csv') {
      // IMPLEMENT CSV EXPORT LOGIC HERE
      res.setHeader('Content-Disposition', `attachment; filename=process_${processId}.csv`);
      res.status(200).json({
          message: 'In a real implementation, this would be CSV data',
          data: exportData
      });
    } else if (format === 'pdf') {
      // IMPLEMENT PDF EXPORT LOGIC HERE
      res.setHeader('Content-Disposition', `attachment; filename=process_${processId}.pdf`);
      res.status(200).json({
          message: 'In a real implementation, this would be a PDF document',
          data: exportData
    });
    } else {
      // Default to JSON export
      res.setHeader('Content-Disposition', `attachment; filename=process_${processId}.json`);
      res.status(200).json(exportData);
    }
} catch (error) {
    res.status(500).json({
    success: false,
    message: 'Failed to export process data',
    error: error.message
    });
}
};
  

exports.bulkAction = async (req, res) => {
try {
    const { action } = req.params;
    const { processIds } = req.body;
    
    if (!processIds || !Array.isArray(processIds) || processIds.length === 0) {
    return res.status(400).json({
        success: false,
        message: 'Process IDs array is required'
    });
    }
    
    const validProcessIds = processIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validProcessIds.length !== processIds.length) {
    return res.status(400).json({
        success: false,
        message: 'One or more process IDs are invalid'
    });
    }
    
    let result;
    
    switch(action) {
    case 'cancel':
        if (req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can perform bulk cancellation'
        });
        }
        
        result = await ProcessInstance.updateMany(
        { 
            _id: { $in: validProcessIds },
            status: 'active'
        },
        { 
            $set: { 
            status: 'canceled',
            updatedAt: new Date()
            },
            $push: {
            history: {
                fromState: '$currentState',
                toState: '$currentState',
                action: 'cancel',
                executedBy: req.user._id,
                executedAt: new Date(),
                comments: 'Process canceled via bulk action'
            }
            }
        }
        );
        
        break;
        
    case 'reassign':
        const { userIds } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'User IDs array is required for reassignment'
        });
        }
        
        const validUserIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validUserIds.length !== userIds.length) {
        return res.status(400).json({
            success: false,
            message: 'One or more user IDs are invalid'
        });
        }
        
        const usersCount = await User.countDocuments({
        _id: { $in: validUserIds }
        });
        
        if (usersCount !== validUserIds.length) {
        return res.status(400).json({
            success: false,
            message: 'One or more users do not exist'
        });
        }
        
        if (req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can perform bulk reassignment'
        });
        }
        
        result = await ProcessInstance.updateMany(
        { 
            _id: { $in: validProcessIds },
            status: 'active' 
        },
        { 
            $set: { 
            assignedTo: validUserIds,
            updatedAt: new Date()
            },
            $push: {
            history: {
                fromState: '$currentState',
                toState: '$currentState',
                action: 'reassign',
                executedBy: req.user._id,
                executedAt: new Date(),
                comments: 'Process reassigned via bulk action'
            }
            }
        }
        );
        
        break;
        
    default:
        return res.status(400).json({
        success: false,
        message: `Unsupported bulk action: ${action}`
        });
    }
    
    res.status(200).json({
    success: true,
    message: `Bulk action '${action}' executed successfully`,
    affected: result.modifiedCount
    });
} catch (error) {
    res.status(500).json({
    success: false,
    message: 'Failed to execute bulk action',
    error: error.message
    });
}
};
  

exports.setPriority = async (req, res) => {
try {
    const { processId } = req.params;
    const { priority } = req.body;
    
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
    return res.status(400).json({
        success: false,
        message: 'Priority must be low, medium, high, or urgent'
    });
    }
    
    const process = await ProcessInstance.findById(processId);
    if (!process) {
    return res.status(404).json({
        success: false,
        message: 'Process instance not found'
    });
    }
    
    if (req.user.role !== 'Admin' && !process.startedBy.equals(req.user._id)) {
    return res.status(403).json({
        success: false,
        message: 'You do not have permission to change process priority'
    });
    }
    
    process.priority = priority;
    process.updatedAt = new Date();
    
    process.history.push({
    fromState: process.currentState,
    toState: process.currentState,
    action: 'setPriority',
    executedBy: req.user._id,
    executedAt: new Date(),
    comments: `Process priority changed to '${priority}'`
    });
    
    await process.save();
    
    res.status(200).json({
    success: true,
    message: 'Process priority updated successfully',
    data: {
        id: process._id,
        priority: process.priority
    }
    });
} catch (error) {
    res.status(500).json({
    success: false,
    message: 'Failed to update process priority',
    error: error.message
    });
}
};
  

exports.setDueDate = async (req, res) => {
try {
    const { processId } = req.params;
    const { dueDate } = req.body;
    
    if (!dueDate) {
    return res.status(400).json({
        success: false,
        message: 'Due date is required'
    });
    }
    
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
    return res.status(400).json({
        success: false,
        message: 'Invalid date format'
    });
    }
    
    const process = await ProcessInstance.findById(processId);
    if (!process) {
    return res.status(404).json({
        success: false,
        message: 'Process instance not found'
    });
    }
    
    if (req.user.role !== 'Admin' && !process.startedBy.equals(req.user._id)) {
    return res.status(403).json({
        success: false,
        message: 'You do not have permission to change process due date'
    });
    }
    
    process.dueDate = dueDateObj;
    process.updatedAt = new Date();
    
    process.history.push({
    fromState: process.currentState,
    toState: process.currentState,
    action: 'setDueDate',
    executedBy: req.user._id,
    executedAt: new Date(),
    comments: `Process due date set to ${dueDateObj.toISOString().split('T')[0]}`
    });
    
    await process.save();
    
    res.status(200).json({
    success: true,
    message: 'Process due date updated successfully',
    data: {
        id: process._id,
        dueDate: process.dueDate
    }
    });
} catch (error) {
    res.status(500).json({
    success: false,
    message: 'Failed to update process due date',
    error: error.message
    });
}
};
