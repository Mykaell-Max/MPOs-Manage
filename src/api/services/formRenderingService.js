const FormDefinition = require('../mongo/formDefinitionModel');
const ProcessInstance = require('../mongo/processInstanceModel');
const Workflow = require('../mongo/workflowModel');

class FormRenderingService {
  async getFormForAction(processId, actionName) {
    const process = await ProcessInstance.findById(processId);
    if (!process) {
      throw new Error('Process not found');
    }
    
    const workflow = await Workflow.findById(process.workflow)
      .populate('formDefinition');
      
    if (!workflow || !workflow.formDefinition) {
      throw new Error('Workflow has no form definition');
    }
    
    const formDefinition = workflow.formDefinition;
    const currentState = workflow.states.find(s => s.name === process.currentState);
    const action = currentState?.actions.find(a => a.name === actionName);
    
    if (!action) {
      throw new Error(`Action ${actionName} not found in current state`);
    }
    const processedFields = formDefinition.fields.map(field => {
      const processedField = { ...field };
      
      if (field.visibilityCondition) {
        const isVisible = this.evaluateCondition(
          field.visibilityCondition,
          { currentAction: actionName, currentState: process.currentState, data: process.data }
        );
        
        processedField.visible = isVisible;
      } else {
        processedField.visible = true;
      }
      
      if (action.requiredFields && action.requiredFields.includes(field.key)) {
        processedField.required = true;
      }
      
      processedField.value = process.data[field.key];
      
      return processedField;
    });
    
    return {
      formId: formDefinition._id,
      name: formDefinition.name,
      version: formDefinition.version,
      fields: processedFields.filter(f => f.visible),
      processData: process.data
    };
  }
  
  // evaluateCondition(conditionString, context) {
  //   try {
  //     const { currentAction, currentState, data } = context;
  //     return eval(conditionString);
  //   } catch (error) {
  //     console.error('Error evaluating condition:', error);
  //     return false;
  //   }
  // }
}

module.exports = new FormRenderingService();