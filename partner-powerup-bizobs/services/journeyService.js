import { v4 as uuidv4 } from 'uuid';

// Industry-specific timing patterns (in minutes)
const INDUSTRY_TIMING_PATTERNS = {
  'retail': {
    'Product Discovery': { min: 5, max: 15, type: 'immediate' },
    'Product Selection': { min: 2, max: 8, type: 'immediate' },
    'Cart Addition': { min: 1, max: 3, type: 'immediate' },
    'Checkout Process': { min: 0.5, max: 2, type: 'immediate' },
    'Order Confirmation': { min: 0.5, max: 1, type: 'immediate' },
    'Order Shipped': { min: 240, max: 1440, type: 'business' }, // 4-24 hours
    'Order Delivered': { min: 1440, max: 4320, type: 'calendar' } // 1-3 days
  },
  'insurance': {
    'Initial Inquiry': { min: 0, max: 0, type: 'immediate' },
    'Document Submission': { min: 1440, max: 10080, type: 'customer' }, // 1-7 days
    'Review Process': { min: 2880, max: 7200, type: 'business' }, // 2-5 business days
    'Approval Decision': { min: 1440, max: 4320, type: 'business' }, // 1-3 business days
    'Policy Issuance': { min: 60, max: 1440, type: 'business' }, // 1-24 hours
    'Premium Payment': { min: 1440, max: 43200, type: 'customer' } // 1-30 days
  },
  'banking': {
    'Application Start': { min: 0, max: 0, type: 'immediate' },
    'Document Upload': { min: 10, max: 30, type: 'immediate' },
    'Identity Verification': { min: 5, max: 15, type: 'immediate' },
    'Credit Check': { min: 1, max: 5, type: 'immediate' },
    'Approval Decision': { min: 120, max: 1440, type: 'business' }, // 2-24 hours
    'Account Opening': { min: 1440, max: 2880, type: 'business' } // 1-2 business days
  },
  'technology': {
    'Discovery': { min: 5, max: 20, type: 'immediate' },
    'Feature Exploration': { min: 10, max: 30, type: 'immediate' },
    'Trial Signup': { min: 2, max: 5, type: 'immediate' },
    'Implementation': { min: 1440, max: 10080, type: 'business' }, // 1-7 days
    'Go Live': { min: 60, max: 240, type: 'business' }, // 1-4 hours
    'Data Persistence': { min: 1, max: 2, type: 'immediate' }
  }
};

// Calculate realistic timestamp based on business logic
function calculateRealisticTimestamp(baseTimestamp, stepName, industry, stepIndex) {
  const patterns = INDUSTRY_TIMING_PATTERNS[industry?.toLowerCase()] || INDUSTRY_TIMING_PATTERNS['technology'];
  const timing = patterns[stepName] || { min: 5, max: 15, type: 'immediate' };
  
  let delayMinutes = timing.min + Math.random() * (timing.max - timing.min);
  
  const baseDate = new Date(baseTimestamp);
  
  // Apply business logic based on type
  switch (timing.type) {
    case 'business':
      // Respect business hours (9 AM - 5 PM, Mon-Fri)
      delayMinutes = adjustForBusinessHours(baseDate, delayMinutes);
      break;
    case 'customer':
      // Customer-driven timing (can happen anytime but often in evening/weekends)
      delayMinutes = adjustForCustomerBehavior(baseDate, delayMinutes);
      break;
    case 'calendar':
      // Calendar days (shipping, delivery)
      delayMinutes = adjustForCalendarDays(baseDate, delayMinutes);
      break;
    case 'immediate':
    default:
      // No special adjustment needed
      break;
  }
  
  const resultDate = new Date(baseDate.getTime() + delayMinutes * 60 * 1000);
  return resultDate.toISOString();
}

// Adjust timing for business hours
function adjustForBusinessHours(baseDate, delayMinutes) {
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  const currentHour = baseDate.getHours();
  const currentDay = baseDate.getDay(); // 0 = Sunday, 6 = Saturday
  
  // If it's weekend or after hours, delay to next business day
  if (currentDay === 0 || currentDay === 6 || currentHour < startHour || currentHour >= endHour) {
    // Calculate delay to next business day 9 AM
    let daysToAdd = 1;
    let nextDay = (currentDay + 1) % 7;
    
    // Skip weekends
    while (nextDay === 0 || nextDay === 6) {
      daysToAdd++;
      nextDay = (nextDay + 1) % 7;
    }
    
    delayMinutes = daysToAdd * 24 * 60 + (startHour - currentHour) * 60;
  }
  
  return delayMinutes;
}

// Adjust timing for customer behavior (evenings/weekends)
function adjustForCustomerBehavior(baseDate, delayMinutes) {
  const currentHour = baseDate.getHours();
  
  // Customers often act in evening hours, add some variance
  if (currentHour >= 18 || currentHour <= 8) {
    delayMinutes *= 0.7; // Faster response in evening
  } else {
    delayMinutes *= 1.3; // Slower during business hours
  }
  
  return delayMinutes;
}

// Adjust for calendar days (shipping, etc.)
function adjustForCalendarDays(baseDate, delayMinutes) {
  // Ensure minimum 1 day gap and round to realistic delivery times
  if (delayMinutes < 1440) delayMinutes = 1440; // Minimum 1 day
  
  // Round to reasonable delivery windows (morning or afternoon)
  const days = Math.floor(delayMinutes / 1440);
  const deliveryHour = Math.random() > 0.5 ? 10 : 14; // 10 AM or 2 PM delivery
  
  return days * 1440 + deliveryHour * 60;
}

// Generate metadata based on step and industry with timestamps
function generateStepMetadata(stepName, industry, timestamp) {
  const baseMetadata = {
    timestamp: new Date(timestamp).getTime(),
    timestampISO: timestamp,
    industry: industry || 'general',
    stepType: stepName.toLowerCase().replace(/\s+/g, '_'),
    businessDay: isBusinessDay(new Date(timestamp)),
    businessHours: isBusinessHours(new Date(timestamp))
  };
  
  // Add industry-specific metadata
  if (industry === 'retail') {
    return { ...baseMetadata, productCategory: 'general', priceRange: 'medium', shoppingSession: 'active' };
  } else if (industry === 'travel') {
    return { ...baseMetadata, destination: 'various', tripType: 'leisure', bookingWindow: 'advance' };
  } else if (industry === 'banking') {
    return { ...baseMetadata, accountType: 'personal', riskLevel: 'low', complianceCheck: 'required' };
  } else if (industry === 'insurance') {
    return { ...baseMetadata, policyType: 'personal', riskAssessment: 'standard', claimHistory: 'clean' };
  }
  
  return baseMetadata;
}

// Check if date is a business day
function isBusinessDay(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

// Check if time is during business hours
function isBusinessHours(date) {
  const hour = date.getHours();
  return hour >= 9 && hour < 17;
}

// Validate that timestamps are in sequential order
function validateTimestampSequence(steps) {
  const errors = [];
  let previousTimestamp = null;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepTime = new Date(step.timestamp);
    
    if (previousTimestamp && stepTime <= previousTimestamp) {
      errors.push({
        stepIndex: step.stepIndex,
        stepName: step.stepName,
        timestamp: step.timestamp,
        previousTimestamp: previousTimestamp.toISOString(),
        error: `Step ${step.stepIndex} timestamp (${step.timestamp}) is not after previous step timestamp (${previousTimestamp.toISOString()})`
      });
    }
    
    // Validate substep sequences within this step
    let previousSubstepTime = stepTime;
    for (let j = 0; j < step.substeps.length; j++) {
      const substep = step.substeps[j];
      const substepTime = new Date(substep.timestamp);
      
      if (substepTime < previousSubstepTime) {
        errors.push({
          stepIndex: step.stepIndex,
          stepName: step.stepName,
          substepIndex: substep.substepIndex,
          substepName: substep.substepName,
          timestamp: substep.timestamp,
          previousTimestamp: previousSubstepTime.toISOString(),
          error: `Substep ${substep.substepIndex} in step ${step.stepIndex} has timestamp (${substep.timestamp}) before previous substep (${previousSubstepTime.toISOString()})`
        });
      }
      previousSubstepTime = substepTime;
    }
    
    previousTimestamp = stepTime;
  }
  
  return errors;
}

// Generate a deterministic template journey with realistic timestamps
async function generateTemplateJourney({ customer, region, journeyType, details, website, customSteps }) {
  const startTime = new Date(); // Current time as journey start
  let currentTimestamp = startTime.toISOString();
  
  // Use custom steps if provided, otherwise use default template
  let stepNames;
  if (customSteps && Array.isArray(customSteps) && customSteps.length > 0) {
    stepNames = customSteps.slice(0, 6); // Limit to 6 steps
    // Ensure we have exactly 6 steps
    while (stepNames.length < 6) {
      stepNames.push(`Step${stepNames.length + 1}`);
    }
  } else {
    // Default template based on industry with MongoDB as final step
    const industrySteps = {
      'retail': ['Product Discovery', 'Product Selection', 'Cart Addition', 'Checkout Process', 'Order Confirmation', 'Data Persistence'],
      'travel': ['Destination Discovery', 'Package Selection', 'Customization', 'Booking Process', 'Confirmation', 'Data Persistence'],
      'banking': ['Application Start', 'Document Upload', 'Identity Verification', 'Credit Check', 'Account Opening', 'Data Persistence'],
      'insurance': ['Initial Inquiry', 'Document Submission', 'Review Process', 'Approval Decision', 'Policy Issuance', 'Data Persistence'],
      'technology': ['Discovery', 'Feature Exploration', 'Trial Signup', 'Implementation', 'Go Live', 'Data Persistence']
    };
    stepNames = industrySteps[region?.toLowerCase()] || industrySteps['technology'];
  }
  
  // Ensure the last step is always Data Persistence for MongoDB integration
  if (stepNames[stepNames.length - 1] !== 'Data Persistence') {
    stepNames[stepNames.length - 1] = 'Data Persistence';
  }
  
  // Convert step names to full step objects with realistic timestamps
  const steps = stepNames.map((stepName, index) => {
    // Calculate realistic timestamp for this step
    if (index > 0) {
      currentTimestamp = calculateRealisticTimestamp(currentTimestamp, stepName, region, index);
    }
    
    const substepNames = generateSubstepsForStep(stepName, index);
    const stepTimestamp = currentTimestamp;
    
    // Generate substeps with incremental timestamps within the step
    const substeps = substepNames.map((substepName, substepIndex) => {
      const substepDelay = substepIndex * 30000; // 30 seconds between substeps
      const substepTimestamp = new Date(new Date(stepTimestamp).getTime() + substepDelay).toISOString();
      
      return {
        substepIndex: substepIndex + 1,
        substepName: substepName.replace(/\s+/g, ''),
        description: `Customer ${substepName.toLowerCase()}`,
        serviceName: `${stepName.replace(/\s+/g, '')}Service`,
        endpoint: `/api/${stepName.toLowerCase().replace(/\s+/g, '-')}`,
        duration: 500 + Math.random() * 1000,
        timestamp: substepTimestamp,
        eventType: `${stepName.toLowerCase().replace(/\s+/g, '_')}_${substepName.toLowerCase().replace(/\s+/g, '_')}`,
        metadata: generateStepMetadata(stepName, region, substepTimestamp)
      };
    });
    
    // Calculate step duration based on substeps and next step timing
    const stepDuration = index < stepNames.length - 1 ? 
      Math.round((new Date(calculateRealisticTimestamp(currentTimestamp, stepNames[index + 1], region, index + 1)).getTime() - new Date(stepTimestamp).getTime()) / 60000) :
      Math.round(substeps.length * 0.5); // Default to 0.5 minutes per substep for last step
    
    return {
      stepIndex: index + 1,
      stepName,
      description: `Customer ${stepName.toLowerCase()} phase`,
      duration: `${stepDuration} minutes`,
      timestamp: stepTimestamp,
      estimatedDuration: stepDuration,
      businessRationale: generateBusinessRationale(stepName, region, stepDuration),
      substeps
    };
  });
  
  return {
    companyName: customer || 'Demo Company',
    domain: website || 'demo.com',
    industryType: region || 'general',
    journeyId: uuidv4(),
    journeyStartTime: startTime.toISOString(),
    businessHours: {
      timezone: 'UTC',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: '09:00-17:00'
    },
    steps,
    sources: [],
    provider: 'enhanced-template-with-timestamps'
  };
}

// Generate business rationale for timing
function generateBusinessRationale(stepName, industry, duration) {
  const lowerStep = stepName.toLowerCase();
  const industryContext = industry || 'general';
  
  if (lowerStep.includes('discover') || lowerStep.includes('research')) {
    return `Research phase typically takes ${duration} minutes as customers compare options in ${industryContext}`;
  }
  
  if (lowerStep.includes('process') || lowerStep.includes('checkout')) {
    return `Processing time reflects ${industryContext} industry standards for verification and payment handling`;
  }
  
  if (lowerStep.includes('deliver') || lowerStep.includes('ship')) {
    return `Delivery timing based on ${industryContext} logistics and standard shipping practices`;
  }
  
  if (lowerStep.includes('approval') || lowerStep.includes('review')) {
    return `Review period accounts for ${industryContext} compliance requirements and business hour processing`;
  }
  
  return `Timing optimized for ${industryContext} customer experience and operational efficiency`;
}

// Generate realistic substeps based on step name
function generateSubstepsForStep(stepName, index) {
  const lowerStep = stepName.toLowerCase();
  
  // Discovery/Research type steps
  if (lowerStep.includes('discover') || lowerStep.includes('research') || lowerStep.includes('explor')) {
    return ['Initial Research', 'Compare Options', 'Gather Information'];
  }
  
  // Selection/Choice type steps
  if (lowerStep.includes('select') || lowerStep.includes('choose') || lowerStep.includes('pick')) {
    return ['Review Options', 'Make Selection', 'Confirm Choice'];
  }
  
  // Process/Implementation type steps
  if (lowerStep.includes('process') || lowerStep.includes('implement') || lowerStep.includes('setup')) {
    return ['Initiate Process', 'Configure Settings', 'Validate Setup'];
  }
  
  // Completion/Finish type steps
  if (lowerStep.includes('complet') || lowerStep.includes('finish') || lowerStep.includes('final')) {
    return ['Final Review', 'Complete Process', 'Receive Confirmation'];
  }
  
  // Data Persistence/Storage type steps (MongoDB integration)
  if (lowerStep.includes('persist') || lowerStep.includes('data') || lowerStep.includes('storage') || 
      lowerStep.includes('record') || lowerStep.includes('archive')) {
    return ['Collect Journey Data', 'Validate Data Integrity', 'Store in Database'];
  }
  
  // Purchase/Payment type steps
  if (lowerStep.includes('purchase') || lowerStep.includes('payment') || lowerStep.includes('checkout')) {
    return ['Add to Cart', 'Enter Payment', 'Process Transaction'];
  }
  
  // Post/Follow-up type steps
  if (lowerStep.includes('post') || lowerStep.includes('follow') || lowerStep.includes('after')) {
    return ['Follow-up Contact', 'Feedback Collection', 'Ongoing Support'];
  }
  
  // Generic fallback
  return [`${stepName} Start`, `${stepName} Progress`, `${stepName} Complete`];
}

export async function generateJourney({ customer, region, journeyType, details, website, customSteps }) {
  const journey = await generateTemplateJourney({ customer, region, journeyType, details, website, customSteps });
  
  // Validate timestamp sequence
  const validationErrors = validateTimestampSequence(journey.steps);
  if (validationErrors.length > 0) {
    console.error('❌ Timestamp sequence validation failed:', validationErrors);
    throw new Error(`Journey generation failed: Non-sequential timestamps detected. Errors: ${JSON.stringify(validationErrors, null, 2)}`);
  }
  
  console.log('✅ Timestamp sequence validation passed - all timestamps are sequential');
  return journey;
}

// Export validation function for external use
export { validateTimestampSequence };
