const ProcessInstance = require('../mongo/processInstanceModel');
const Workflow = require('../mongo/workflowModel');
const mongoose = require('mongoose');

class ProcessExecutionService {
  async executeAction(processId, actionName, user, data = {}, comments = '') {
    // Get both process and workflow from validation method
    const { process, workflow } = await this.validateProcessAndAction(processId, actionName, user);
    
    // Use workflow.states instead of process.states
    const currentState = workflow.states.find(state => state.name === process.currentState);
    const actionToExecute = currentState.actions.find(action => action.name === actionName);
    
    if (actionToExecute.requiredFields && actionToExecute.requiredFields.length > 0) {
      this.validateRequiredFields(actionToExecute.requiredFields, data);
    }
    
    const targetState = actionToExecute.targetState;
    
    const historyEntry = {
      fromState: process.currentState,
      toState: targetState,
      action: actionName,
      executedBy: user._id,
      executedAt: new Date(),
      comments: comments,
      data: data
    };
    
    process.data = { ...process.data, ...data };
    process.currentState = targetState;
    process.history.push(historyEntry);
    
    const targetStateDefinition = workflow.states.find(state => state.name === targetState);
    
    if (targetStateDefinition.isFinal) {
      process.status = 'completed';
      process.completedAt = new Date();
    }
    
    await process.save();
    await this.handleAssignments(process, targetState, user);
    await this.triggerNotifications(process, historyEntry, user);
    return process;
  }
  
  async validateProcessAndAction(processId, actionName, user) {
    const process = await ProcessInstance.findById(processId);
    if (!process) {
      throw new Error('Process not found');
    }
    
    if (process.status !== 'active') {
      throw new Error(`Process is ${process.status} and cannot be modified`);
    }
    
    const workflow = await Workflow.findById(process.workflow);
    const currentState = workflow.states.find(state => state.name === process.currentState);
    
    if (!currentState) {
      throw new Error('Invalid process state');
    }
    
    const actionDefinition = currentState.actions.find(action => action.name === actionName);
    if (!actionDefinition) {
      throw new Error(`Action ${actionName} not available in current state`);
    }
    
    const canExecute = this.checkUserPermission(user, actionDefinition.allowedRoles);
    if (!canExecute) {
      throw new Error('You do not have permission to execute this action');
    }
    
    return { process, workflow };
  }
  
  checkUserPermission(user, allowedRoles) {
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }
    if (user.roles.includes('Admin')) {
      return true;
    }
    return user.roles.some(role => allowedRoles.includes(role));
  }
  
  validateRequiredFields(requiredFields, data) {
    const missingFields = requiredFields.filter(field => {
      const value = this.getNestedValue(data, field);
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  }
  
  async handleAssignments(process, targetState, user) {
    return null;
  }
  
  async triggerNotifications(process, historyEntry, user) {
    return null;
  }
}

module.exports = new ProcessExecutionService();