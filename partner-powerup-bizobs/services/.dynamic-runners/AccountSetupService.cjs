// Auto-generated wrapper for AccountSetupService
process.env.SERVICE_NAME = "AccountSetupService";
process.env.STEP_NAME = "AccountSetup";
process.title = process.env.SERVICE_NAME;
process.env.DT_SERVICE_NAME = process.env.SERVICE_NAME;
process.env.DYNATRACE_SERVICE_NAME = process.env.SERVICE_NAME;
process.env.DT_LOGICAL_SERVICE_NAME = process.env.SERVICE_NAME;
process.env.DT_PROCESS_GROUP_NAME = process.env.SERVICE_NAME;
process.env.DT_PROCESS_GROUP_INSTANCE = process.env.SERVICE_NAME + '-' + (process.env.PORT || '');
require("/home/ec2-user/partner-powerup-bizobs/services/dynamic-step-service.cjs").createStepService(process.env.SERVICE_NAME, process.env.STEP_NAME);
