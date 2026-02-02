/**
 * Message Templates for Demo Data
 * Used to generate realistic client/contractor conversations
 */

// Contractor update messages to clients
export const CLIENT_UPDATE_TEMPLATES = [
  "Hi {clientName}! Quick update on your {projectType} - {updateContent}",
  "Good morning {clientName}! Wanted to let you know {updateContent}",
  "Great news - we passed the {inspection} inspection today! Everything is looking good.",
  "Just wanted to let you know the {material} arrived and we'll be installing it {timeframe}.",
  "Hey {clientName}! The crew made great progress today. {progressUpdate}",
  "Update for today: {dailyUpdate}. Let me know if you have any questions!",
  "Hi {clientName}, the team completed {completedWork} today. On track for our timeline!",
  "Quick update - {subcontractor} finished their work and passed inspection.",
  "Good afternoon! We're wrapping up {currentPhase} phase this week.",
  "Hey {clientName}! Just finished {milestone} - here are some photos I thought you'd like to see.",
  "The {inspection} inspector came by today and we passed with flying colors!",
  "Wanted to give you a heads up - we'll be working on {upcomingWork} starting {date}.",
  "Great progress today! {progressUpdate} Tomorrow we're moving on to {nextStep}.",
  "Hi {clientName}! We're about {percentComplete}% complete now. Looking fantastic!",
  "Just a quick note - {vendorName} delivered the {material} today. Quality looks excellent.",
];

// Client question messages
export const CLIENT_QUESTION_TEMPLATES = [
  "Thanks for the update! I had a question about the {topic} - {question}",
  "Looks great! When do you think you'll be ready for {nextMilestone}?",
  "Can we schedule a time to walk through the {area} together?",
  "Quick question - is there any flexibility on the {topic}?",
  "This is looking amazing! What are our options for {designElement}?",
  "Thanks {contractorName}! Any chance we could upgrade to {upgrade}?",
  "Love the progress! When would be a good time to stop by and see it?",
  "I noticed {observation}. Is that normal for this phase?",
  "Can you send me a few more photos of {area}? My {familyMember} wants to see!",
  "Quick question about the {topic} - {specificQuestion}",
  "This looks great! Do we have time to make a small change to {element}?",
  "Thanks for the update. What's the timeline looking like for {phase}?",
  "Appreciate all the hard work! Is there anything you need from us?",
  "That looks perfect! When do you think we'll be ready for {milestone}?",
  "I'm excited to see the {material} going in. How long will that take?",
];

// Contractor response messages
export const CONTRACTOR_RESPONSE_TEMPLATES = [
  "Good question! {answer} Let me know if you need more details.",
  "Absolutely - {answer} I'll send over the options today.",
  "Great idea! We can definitely {suggestion}. It would be about {cost} additional.",
  "That's totally normal for this stage. {explanation}",
  "Sure thing! I'll send you more photos when we finish up today.",
  "Yes, we can make that change. {details} Just let me know!",
  "Perfect timing to ask - {answer} I was actually going to bring this up.",
  "We should have {area} ready for you to see by {date}. I'll reach out to schedule.",
  "Here's what I'm thinking for {topic}: {explanation}",
  "I checked with {vendor} and {answer}. Sound good?",
  "Great news - we can accommodate that! {details}",
  "Let me look into {topic} and get back to you by {date}.",
  "Absolutely! {answer} Want me to go ahead with that?",
  "Based on the current progress, I'd estimate {estimate}.",
  "That's a popular upgrade! {details} Want me to include it in a change order?",
];

// Scheduling messages
export const SCHEDULING_TEMPLATES = [
  "Hi {clientName}! Just confirming that {subcontractor} will be on site {date} for {work}.",
  "Quick heads up - we're planning to start {work} on {date}. Will you be around?",
  "The inspector is scheduled for {date} at {time}. I'll be there to meet them.",
  "Hey {clientName}! Can we schedule the {milestone} walkthrough for {date}?",
  "Just wanted to let you know the crew will be on site {days} this week.",
  "Reminder: {vendor} is delivering {material} on {date} between {timeRange}.",
  "We're scheduling the final walkthrough. Does {date} work for you?",
  "The {trade} crew will be here {date} to complete {work}.",
  "Hi {clientName}! Planning to have {phase} wrapped up by {date}.",
  "Just confirmed with {subcontractor} - they'll be here {date} for {work}.",
];

// Approval/decision request messages
export const APPROVAL_REQUEST_TEMPLATES = [
  "Hi {clientName}! We need your approval on {item} before we can proceed. Options attached.",
  "Quick decision needed - which {optionType} would you prefer? {options}",
  "I've attached the {document} for your review. Let me know if you have questions!",
  "Before we install the {item}, wanted to confirm your color choice: {options}",
  "We have a couple options for {topic}. Can you let me know your preference?",
  "Need your sign-off on {document} before {deadline}. I've attached it here.",
  "Which {item} direction would you prefer? See the attached samples.",
  "The {vendor} sent over the final {item} options. What do you think?",
];

// Client approval messages
export const CLIENT_APPROVAL_TEMPLATES = [
  "Let's go with option {optionLetter}! Thanks for laying everything out.",
  "The {optionA} looks perfect. Let's do that one!",
  "Approved! Go ahead with {decision}.",
  "I like the second option better. Can we go with that?",
  "Both look great but I'm leaning toward {preference}. Thoughts?",
  "Love it! Approved. Can't wait to see it installed!",
  "After thinking about it, let's go with {decision}.",
  "Yes, that works for us! Proceed when ready.",
  "The {option} matches perfectly with what we discussed. Go for it!",
  "Signed and approved! Thanks for making this easy.",
];

// Issue notification messages
export const ISSUE_NOTIFICATION_TEMPLATES = [
  "Hi {clientName}. We ran into a small issue today - {issue}. Here's our plan: {solution}",
  "Heads up - discovered {issue} when we opened up the {area}. Don't worry, we can fix it.",
  "Quick update on a challenge we found: {issue}. {impact} I'll keep you posted.",
  "Found something during {work} that we need to address: {issue}. Options are {options}.",
  "Just wanted to be transparent about {issue}. {explanation} Cost impact: {cost}.",
  "We discovered {issue} today. Good news is {silverLining}. Bad news is {impact}.",
];

// Weather delay messages
export const WEATHER_DELAY_TEMPLATES = [
  "Hi {clientName}! Rain in the forecast for {days}. We'll be working on {indoorWork} instead.",
  "Due to the weather, we're pushing {outdoorWork} to {newDate}. No impact on timeline.",
  "Storm coming through {days}. Crew will be on site as soon as conditions allow.",
  "Quick note - postponing {work} due to weather. Should be back at it by {date}.",
  "Weather delay update: {details}. Timeline adjustment: {impact}.",
];

// Project completion messages
export const COMPLETION_TEMPLATES = [
  "Hi {clientName}! We're in the home stretch! Just have {remainingItems} left on the punch list.",
  "Great news - the final inspection passed! Ready to schedule your walkthrough.",
  "We're wrapping up {projectType} this week! Can we schedule the final walkthrough?",
  "Almost there! The team is finishing up {finalWork} today.",
  "Your {projectType} is complete! Here are some final photos. Pleasure working with you!",
  "Final walkthrough completed. Thank you for trusting us with your {projectType}!",
];

// Topics and content for message generation
export const MESSAGE_TOPICS = {
  inspections: [
    'rough electrical',
    'rough plumbing',
    'framing',
    'insulation',
    'drywall',
    'final electrical',
    'final plumbing',
    'HVAC',
    'fire',
    'building',
  ],
  materials: [
    'cabinets',
    'countertops',
    'flooring',
    'tile',
    'appliances',
    'fixtures',
    'hardware',
    'paint',
    'trim',
    'windows',
    'doors',
    'lighting',
  ],
  trades: [
    'electrician',
    'plumber',
    'HVAC technician',
    'tile installer',
    'cabinet installer',
    'painter',
    'flooring crew',
    'trim carpenter',
  ],
  areas: [
    'kitchen',
    'bathroom',
    'living room',
    'bedroom',
    'basement',
    'deck',
    'garage',
    'office',
    'common area',
  ],
  milestones: [
    'demo completion',
    'rough-in inspection',
    'drywall completion',
    'cabinet installation',
    'countertop installation',
    'flooring completion',
    'fixture installation',
    'final inspection',
    'punch list walkthrough',
    'final walkthrough',
  ],
};

// Work performed descriptions for daily logs
export const WORK_PERFORMED_TEMPLATES = {
  demo: [
    'Removed existing {item}',
    'Demolished {area} walls',
    'Cleared debris from work area',
    'Prepped space for new construction',
    'Disposed of old materials',
    'Protected adjacent areas with plastic sheeting',
  ],
  roughIn: [
    'Ran electrical wiring to {area}',
    'Installed plumbing rough-in for {fixture}',
    'Framed new wall for {purpose}',
    'Installed blocking for {item}',
    'Ran HVAC ductwork to {area}',
    'Set up temporary power for tools',
  ],
  finishes: [
    'Installed {material} in {area}',
    'Applied primer coat to {surface}',
    'Painted {area} with {color}',
    'Installed trim around {area}',
    'Grouted tile in {area}',
    'Mounted {fixture} in {area}',
  ],
  punchList: [
    'Touched up paint in {area}',
    'Adjusted {item} alignment',
    'Fixed {issue} in {area}',
    'Cleaned and polished {item}',
    'Final inspection walkthrough',
    'Addressed client feedback on {item}',
  ],
};

// Denver weather patterns (realistic for demo data)
export const DENVER_WEATHER = {
  winter: [
    { condition: 'clear', tempHigh: 45, tempLow: 22, precipitation: 0 },
    { condition: 'partly_cloudy', tempHigh: 48, tempLow: 25, precipitation: 0 },
    { condition: 'cloudy', tempHigh: 38, tempLow: 20, precipitation: 10 },
    { condition: 'snow', tempHigh: 32, tempLow: 18, precipitation: 40 },
    { condition: 'clear', tempHigh: 52, tempLow: 28, precipitation: 0 },
    { condition: 'rain', tempHigh: 42, tempLow: 30, precipitation: 30 },
  ],
  spring: [
    { condition: 'clear', tempHigh: 62, tempLow: 38, precipitation: 0 },
    { condition: 'partly_cloudy', tempHigh: 58, tempLow: 35, precipitation: 5 },
    { condition: 'rain', tempHigh: 55, tempLow: 40, precipitation: 45 },
    { condition: 'cloudy', tempHigh: 50, tempLow: 32, precipitation: 20 },
    { condition: 'clear', tempHigh: 70, tempLow: 42, precipitation: 0 },
  ],
  summer: [
    { condition: 'clear', tempHigh: 88, tempLow: 60, precipitation: 0 },
    { condition: 'partly_cloudy', tempHigh: 85, tempLow: 58, precipitation: 5 },
    { condition: 'thunderstorm', tempHigh: 78, tempLow: 55, precipitation: 60 },
    { condition: 'clear', tempHigh: 92, tempLow: 62, precipitation: 0 },
  ],
  fall: [
    { condition: 'clear', tempHigh: 68, tempLow: 42, precipitation: 0 },
    { condition: 'partly_cloudy', tempHigh: 62, tempLow: 38, precipitation: 5 },
    { condition: 'cloudy', tempHigh: 55, tempLow: 35, precipitation: 15 },
    { condition: 'rain', tempHigh: 50, tempLow: 32, precipitation: 35 },
  ],
};

// Safety observations for daily logs
export const SAFETY_OBSERVATIONS = [
  'All team members wearing proper PPE',
  'Hard hats required in work area',
  'Safety glasses worn during cutting operations',
  'First aid kit restocked and accessible',
  'Fire extinguisher verified on site',
  'Extension cords in good condition',
  'Scaffolding inspected before use',
  'Ladder safety protocols followed',
  'Work area properly ventilated',
  'Dust control measures in place',
  'No safety incidents to report',
  'Reminded crew about fall protection',
  'Tool safety check completed',
  'Proper lifting techniques observed',
];

// Delay reasons for daily logs
export const DELAY_REASONS = [
  'Material delivery delayed by supplier',
  'Waiting for inspection approval',
  'Weather conditions prevented outdoor work',
  'Subcontractor scheduling conflict',
  'Client requested design change',
  'Permit approval pending',
  'Discovered unexpected condition requiring engineering review',
  'Equipment maintenance required',
  'Waiting for material back-order to arrive',
  'Holiday schedule adjustment',
];

// Change order reasons
export const CHANGE_ORDER_REASONS = [
  'Client requested upgrade',
  'Field condition discovery',
  'Design modification',
  'Code compliance requirement',
  'Material substitution',
  'Scope addition',
  'Unforeseen structural issue',
  'Client preference change',
  'Value engineering suggestion',
  'Coordination with adjacent work',
];

// Photo captions by type
export const PHOTO_CAPTIONS = {
  progress: [
    '{phase} progress - {date}',
    '{area} taking shape',
    '{work} in progress',
    'Today\'s progress on {area}',
    '{milestone} complete',
    'Crew working on {task}',
  ],
  before: [
    'Before: {area} existing condition',
    'Starting point - {area}',
    'Original {area} layout',
    'Pre-demo {area}',
    'Existing {item} to be removed',
  ],
  after: [
    'After: {area} completed',
    'Final result - {area}',
    'Completed {area}',
    '{area} transformation complete',
    'Finished {item} installation',
  ],
  issue: [
    'Issue found: {issue}',
    'Discovered {issue} during {work}',
    '{area} requiring attention',
    'Documentation of {issue}',
    'Condition requiring repair',
  ],
  inspection: [
    '{inspection} inspection passed',
    'Inspector approved {area}',
    '{inspection} sign-off',
    'Ready for {inspection} inspection',
    'Post-inspection {area}',
  ],
};

// Task categories with typical durations
export const TASK_CATEGORIES = {
  inspection: {
    titles: [
      'Schedule {inspection} inspection',
      '{inspection} inspection',
      'Prepare for {inspection} inspection',
      'Final inspection walkthrough',
    ],
    avgDuration: 1,
  },
  materialDelivery: {
    titles: [
      'Order {material}',
      'Receive {material} delivery',
      'Stage {material} for installation',
      'Verify {material} quality and quantity',
    ],
    avgDuration: 1,
  },
  subcontractor: {
    titles: [
      'Schedule {trade} crew',
      '{trade} work - {area}',
      'Coordinate with {trade}',
      '{trade} punch list items',
    ],
    avgDuration: 3,
  },
  clientMeeting: {
    titles: [
      'Client walkthrough - {phase}',
      'Design review with client',
      'Selection meeting - {category}',
      'Final walkthrough with client',
      'Progress meeting with {clientName}',
    ],
    avgDuration: 1,
  },
  installation: {
    titles: [
      'Install {item} in {area}',
      '{item} installation',
      'Mount {item}',
      'Set {item}',
    ],
    avgDuration: 2,
  },
  preparation: {
    titles: [
      'Prep {area} for {work}',
      'Clear and clean {area}',
      'Protect {area} surfaces',
      'Set up for {work}',
    ],
    avgDuration: 1,
  },
};
