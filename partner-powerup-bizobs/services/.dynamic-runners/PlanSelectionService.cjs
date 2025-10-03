// Auto-generated wrapper for PlanSelectionService
process.env.SERVICE_NAME = "PlanSelectionService";
process.env.STEP_NAME = "PlanSelection";
process.title = process.env.SERVICE_NAME;
process.env.DT_SERVICE_NAME = process.env.SERVICE_NAME;
process.env.DYNATRACE_SERVICE_NAME = process.env.SERVICE_NAME;
process.env.DT_LOGICAL_SERVICE_NAME = process.env.SERVICE_NAME;
process.env.DT_PROCESS_GROUP_NAME = process.env.SERVICE_NAME;
process.env.DT_PROCESS_GROUP_INSTANCE = process.env.SERVICE_NAME + '-' + (process.env.PORT || '');
require("/home/ec2-user/partner-powerup-bizobs/services/dynamic-step-service.cjs").createStepService(process.env.SERVICE_NAME, process.env.STEP_NAME);
