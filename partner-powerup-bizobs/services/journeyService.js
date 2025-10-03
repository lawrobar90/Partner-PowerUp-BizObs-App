import { v4 as uuidv4 } from 'uuid';

// Generate metadata based on step and industry
function generateStepMetadata(stepName, industry) {
  const baseMetadata = {
    timestamp: Date.now(),
    industry: industry || 'general',
    stepType: stepName.toLowerCase().replace(/\s+/g, '_')
  };
  
  // Add industry-specific metadata
  if (industry === 'retail') {
    return { ...baseMetadata, productCategory: 'general', priceRange: 'medium' };
  } else if (industry === 'travel') {
    return { ...baseMetadata, destination: 'various', tripType: 'leisure' };
  } else if (industry === 'banking') {
    return { ...baseMetadata, accountType: 'personal', riskLevel: 'low' };
  }
  
  return baseMetadata;
}

// Generate a deterministic template journey
async function generateTemplateJourney({ customer, region, journeyType, details, website, customSteps }) {
  // Use custom steps if provided, otherwise use default template
  let stepNames;
  if (customSteps && Array.isArray(customSteps) && customSteps.length > 0) {
    stepNames = customSteps.slice(0, 6); // Limit to 6 steps
    // Ensure we have exactly 6 steps
    while (stepNames.length < 6) {
      stepNames.push(`Step${stepNames.length + 1}`);
    }
  } else {
    // Default template based on industry
    const industrySteps = {
      'retail': ['Product Discovery', 'Product Selection', 'Cart Addition', 'Checkout Process', 'Order Confirmation', 'Post Purchase'],
      'travel': ['Destination Discovery', 'Package Selection', 'Customization', 'Booking Process', 'Confirmation', 'Post-Trip'],
      'banking': ['Discovery', 'Product Exploration', 'Application Process', 'Verification', 'Account Opening', 'First Transaction'],
      'technology': ['Discovery', 'Feature Exploration', 'Trial Signup', 'Implementation', 'Go Live', 'Optimization']
    };
    stepNames = industrySteps[region?.toLowerCase()] || industrySteps['technology'];
  }
  
  // Convert step names to full step objects with proper structure
  const steps = stepNames.map((stepName, index) => {
    const substepNames = generateSubstepsForStep(stepName, index);
    const substeps = substepNames.map((substepName, substepIndex) => ({
      substepIndex: substepIndex + 1,
      substepName: substepName.replace(/\s+/g, ''),
      description: `Customer ${substepName.toLowerCase()}`,
      serviceName: `${stepName.replace(/\s+/g, '')}Service`,
      endpoint: `/api/${stepName.toLowerCase().replace(/\s+/g, '-')}`,
      duration: 500 + Math.random() * 1000,
      eventType: `${stepName.toLowerCase().replace(/\s+/g, '_')}_${substepName.toLowerCase().replace(/\s+/g, '_')}`,
      metadata: generateStepMetadata(stepName, region)
    }));
    
    return {
      stepIndex: index + 1,
      stepName,
      description: `Customer ${stepName.toLowerCase()} phase`,
      duration: "2-5 minutes",
      substeps
    };
  });
  
  return {
    companyName: customer || 'Demo Company',
    domain: website || 'demo.com',
    industryType: region || 'general',
    journeyId: uuidv4(),
    steps,
    sources: [],
    provider: 'deterministic-template'
  };
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
  return journey;
}
