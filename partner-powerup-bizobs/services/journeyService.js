import { v4 as uuidv4 } from 'uuid';

// Generate a deterministic template journey
async function generateTemplateJourney({ customer, region, journeyType, details, website }) {
  // Deterministic mock 6-step journey with substeps
  const steps = [
    { name: 'Discover', substeps: ['Landing', 'Search', 'Filter'] },
    { name: 'Select', substeps: ['Compare Options', 'View Details'] },
    { name: 'Customize', substeps: ['Choose Add-ons', 'Enter Preferences'] },
    { name: 'Book', substeps: ['Enter Traveller Info', 'Payment'] },
    { name: 'Confirm', substeps: ['Receive Email', 'Itinerary'] },
    { name: 'Post-Trip', substeps: ['Feedback', 'NPS Survey'] }
  ];
  
  return {
    id: uuidv4(),
    customer, 
    region, 
    journeyType, 
    details, 
    website,
    createdAt: Date.now(),
    steps,
    sources: [],
    provider: 'deterministic-template'
  };
}

export async function generateJourney({ customer, region, journeyType, details, website }) {
  const journey = await generateTemplateJourney({ customer, region, journeyType, details, website });
  return journey;
}
