// Auto-generated wrapper for DiscoveryService
process.env.SERVICE_NAME = "DiscoveryService";
process.env.STEP_NAME = "Discovery";
process.title = process.env.SERVICE_NAME;
// Company context for tagging
process.env.COMPANY_NAME = process.env.COMPANY_NAME || 'DefaultCompany';
process.env.DOMAIN = process.env.DOMAIN || 'default.com';
process.env.INDUSTRY_TYPE = process.env.INDUSTRY_TYPE || 'general';
// Plain env tags often picked as [Environment] in Dynatrace
process.env.company = process.env.COMPANY_NAME;
process.env.app = 'BizObs-CustomerJourney';
process.env.service = process.env.SERVICE_NAME;
// Dynatrace service detection
process.env.DT_SERVICE_NAME = process.env.SERVICE_NAME;
process.env.DYNATRACE_SERVICE_NAME = process.env.SERVICE_NAME;
process.env.DT_LOGICAL_SERVICE_NAME = process.env.SERVICE_NAME;
process.env.DT_PROCESS_GROUP_NAME = process.env.SERVICE_NAME;
process.env.DT_PROCESS_GROUP_INSTANCE = process.env.SERVICE_NAME + '-' + (process.env.PORT || '');
process.env.DT_APPLICATION_NAME = 'BizObs-CustomerJourney';
process.env.DT_CLUSTER_ID = process.env.SERVICE_NAME;
process.env.DT_NODE_ID = process.env.SERVICE_NAME + '-node';
// Dynatrace simplified tags - space separated for proper parsing
process.env.DT_TAGS = 'company=' + process.env.COMPANY_NAME + ' app=BizObs-CustomerJourney service=' + process.env.SERVICE_NAME;
// Optional aggregate custom prop
process.env.DT_CUSTOM_PROP = 'company=' + process.env.COMPANY_NAME + ';app=BizObs-CustomerJourney;service=' + process.env.SERVICE_NAME + ';domain=' + process.env.DOMAIN + ';industryType=' + process.env.INDUSTRY_TYPE + ';service_type=customer_journey_step';
// Override argv[0] for Dynatrace process detection
if (process.argv && process.argv.length > 0) process.argv[0] = process.env.SERVICE_NAME;
require("/home/ec2-user/partner-powerup-bizobs/services/dynamic-step-service.cjs").createStepService(process.env.SERVICE_NAME, process.env.STEP_NAME);
