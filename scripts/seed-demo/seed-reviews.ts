/**
 * Seed Review Management Demo Data
 *
 * Creates reviews, review requests, automation rules, and response templates
 * for the Horizon Construction Co. demo organization.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  monthsAgo,
  toTimestamp,
  randomItem,
  randomInt,
  logSection,
  logProgress,
  logSuccess,
  generateId,
} from './utils';

const db = getDb();
const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);

// Demo project references (matching seed-activities.ts)
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', clientKey: 'smith' },
  { id: 'demo-proj-wilson-fence', name: 'Wilson Fence Installation', clientKey: 'wilson' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', clientKey: 'mainStRetail' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', clientKey: 'garcia' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI', clientKey: 'downtownCafe' },
];

const REVIEW_TEXTS = {
  positive: [
    'Absolutely outstanding work! The team was professional, punctual, and the finished product exceeded our expectations. Would highly recommend.',
    'Mike and his crew did an incredible job. Communication was excellent throughout the project and the craftsmanship is top-notch.',
    'We couldn\'t be happier with the results. The project was completed on time and on budget. Will definitely hire again.',
    'Professional from start to finish. The attention to detail was remarkable. Our neighbors keep complimenting the work!',
    'Great experience overall. The team was respectful of our home, cleaned up daily, and delivered quality work.',
    'Horizon Construction exceeded our expectations. The project manager kept us informed every step of the way.',
    'Five stars! The quality of work speaks for itself. Fair pricing and no surprises. Highly recommend!',
  ],
  neutral: [
    'Good work overall. There were a few minor delays but the final result was solid.',
    'The project came out well. Communication could have been better at times, but the quality is good.',
    'Decent experience. Work quality was good but the timeline slipped a couple weeks.',
  ],
  negative: [
    'Some communication issues during the project. The final result was okay but took longer than expected.',
  ],
};

const REVIEWER_NAMES = [
  'Robert S.', 'Maria G.', 'James T.', 'Jennifer W.', 'Michael B.',
  'Tom R.', 'Susan M.', 'David A.', 'Lisa K.', 'Chris P.',
  'Amanda H.', 'Brian J.', 'Sarah D.', 'Kevin L.', 'Nicole F.',
];

async function seedReviews() {
  logSection('Seeding Reviews');

  const reviews = [];
  const platforms = ['google', 'google', 'google', 'yelp', 'facebook', 'manual'] as const;

  // Generate 15 reviews across projects
  for (let i = 0; i < 15; i++) {
    const project = DEMO_PROJECTS[i % DEMO_PROJECTS.length];
    const client = DEMO_CLIENTS[project.clientKey as keyof typeof DEMO_CLIENTS];
    const platform = platforms[i % platforms.length];
    const rating = i < 10 ? 5 : i < 13 ? 4 : 3;
    const textPool = rating >= 4 ? REVIEW_TEXTS.positive : rating === 3 ? REVIEW_TEXTS.neutral : REVIEW_TEXTS.negative;
    const reviewDate = daysAgo(randomInt(5, 180));

    const review = {
      orgId: DEMO_ORG_ID,
      projectId: project.id,
      clientId: client.id,
      platform,
      externalId: platform !== 'manual' ? `ext-${platform}-${i}` : null,
      rating,
      reviewText: randomItem(textPool),
      reviewerName: REVIEWER_NAMES[i % REVIEWER_NAMES.length],
      reviewDate: toTimestamp(reviewDate),
      // Add response to some reviews
      ...(i < 8 ? {
        responseText: 'Thank you so much for the kind words! We truly appreciate your trust in Horizon Construction. It was a pleasure working with you.',
        respondedAt: toTimestamp(new Date(reviewDate.getTime() + 86400000)), // 1 day later
        respondedBy: DEMO_USERS.owner.uid,
      } : {}),
      syncedAt: platform !== 'manual' ? toTimestamp(daysAgo(1)) : null,
      createdAt: toTimestamp(reviewDate),
      updatedAt: toTimestamp(reviewDate),
    };

    const docRef = orgRef.collection('reviews').doc(generateId('review'));
    reviews.push({ ref: docRef, data: review });
  }

  // Write in batch
  const batch = db.batch();
  for (const { ref, data } of reviews) {
    batch.set(ref, data);
  }
  await batch.commit();
  logSuccess(`Created ${reviews.length} reviews`);
}

async function seedReviewRequests() {
  logSection('Seeding Review Requests');

  const requests = [];
  const statuses = ['completed', 'completed', 'sent', 'sent', 'pending', 'clicked', 'failed'] as const;

  for (let i = 0; i < 10; i++) {
    const project = DEMO_PROJECTS[i % DEMO_PROJECTS.length];
    const client = DEMO_CLIENTS[project.clientKey as keyof typeof DEMO_CLIENTS];
    const status = statuses[i % statuses.length];
    const createdDate = daysAgo(randomInt(3, 90));
    const channel = i % 3 === 0 ? 'email' : 'sms';

    const request = {
      orgId: DEMO_ORG_ID,
      projectId: project.id,
      clientId: client.id,
      channel,
      status,
      recipientName: `${client.firstName} ${client.lastName}`,
      recipientEmail: client.email,
      recipientPhone: client.phone,
      sentAt: status !== 'pending' ? toTimestamp(new Date(createdDate.getTime() + 60000)) : null,
      clickedAt: ['clicked', 'completed'].includes(status) ? toTimestamp(new Date(createdDate.getTime() + 3600000)) : null,
      completedAt: status === 'completed' ? toTimestamp(new Date(createdDate.getTime() + 7200000)) : null,
      errorMessage: status === 'failed' ? 'SMS delivery failed - invalid phone number' : null,
      retryCount: status === 'failed' ? 2 : 0,
      createdAt: toTimestamp(createdDate),
      updatedAt: toTimestamp(createdDate),
    };

    const docRef = orgRef.collection('reviewRequests').doc(generateId('reqrev'));
    requests.push({ ref: docRef, data: request });
  }

  const batch = db.batch();
  for (const { ref, data } of requests) {
    batch.set(ref, data);
  }
  await batch.commit();
  logSuccess(`Created ${requests.length} review requests`);
}

async function seedAutomationRules() {
  logSection('Seeding Automation Rules');

  const rules = [
    {
      orgId: DEMO_ORG_ID,
      name: 'Post-Completion Review Request',
      description: 'Send a review request 3 days after project is marked complete',
      enabled: true,
      trigger: 'project_completed',
      delayDays: 3,
      channel: 'email',
      requestsSent: 8,
      reviewsReceived: 5,
      createdAt: toTimestamp(monthsAgo(3)),
      updatedAt: toTimestamp(daysAgo(7)),
    },
    {
      orgId: DEMO_ORG_ID,
      name: 'Final Invoice Follow-Up',
      description: 'Request review after final invoice is paid',
      enabled: true,
      trigger: 'invoice_paid',
      delayDays: 1,
      channel: 'sms',
      requestsSent: 4,
      reviewsReceived: 2,
      createdAt: toTimestamp(monthsAgo(2)),
      updatedAt: toTimestamp(daysAgo(14)),
    },
    {
      orgId: DEMO_ORG_ID,
      name: 'Manual Review Outreach',
      description: 'Template for manually sending review requests to select clients',
      enabled: false,
      trigger: 'manual',
      delayDays: 0,
      channel: 'email',
      requestsSent: 2,
      reviewsReceived: 1,
      createdAt: toTimestamp(monthsAgo(1)),
      updatedAt: toTimestamp(monthsAgo(1)),
    },
  ];

  const batch = db.batch();
  for (const rule of rules) {
    const docRef = orgRef.collection('reviewAutomationRules').doc(generateId('rule'));
    batch.set(docRef, rule);
  }
  await batch.commit();
  logSuccess(`Created ${rules.length} automation rules`);
}

async function seedResponseTemplates() {
  logSection('Seeding Response Templates');

  const templates = [
    {
      orgId: DEMO_ORG_ID,
      name: '5-Star Thank You',
      description: 'For positive 5-star reviews',
      body: 'Thank you so much, {{reviewerName}}! We truly appreciate your kind words about the {{projectName}} project. It was a pleasure working with you, and we\'re thrilled you love the results!',
      variables: ['reviewerName', 'projectName'],
      sentiment: 'positive',
      minRating: 5,
      maxRating: 5,
      usageCount: 12,
      createdAt: toTimestamp(monthsAgo(4)),
      updatedAt: toTimestamp(daysAgo(5)),
    },
    {
      orgId: DEMO_ORG_ID,
      name: 'Positive Review Response',
      description: 'For 4-5 star reviews',
      body: 'Thank you for the wonderful review, {{reviewerName}}! We appreciate you choosing Horizon Construction for your project. Your satisfaction is our top priority!',
      variables: ['reviewerName'],
      sentiment: 'positive',
      minRating: 4,
      maxRating: 5,
      usageCount: 8,
      createdAt: toTimestamp(monthsAgo(4)),
      updatedAt: toTimestamp(daysAgo(10)),
    },
    {
      orgId: DEMO_ORG_ID,
      name: 'Neutral Review Response',
      description: 'For 3-star reviews',
      body: 'Thank you for your feedback, {{reviewerName}}. We appreciate you sharing your experience. We\'re always looking to improve and would love to discuss how we can do better. Please feel free to reach out to us directly.',
      variables: ['reviewerName'],
      sentiment: 'neutral',
      minRating: 3,
      maxRating: 3,
      usageCount: 3,
      createdAt: toTimestamp(monthsAgo(3)),
      updatedAt: toTimestamp(daysAgo(20)),
    },
    {
      orgId: DEMO_ORG_ID,
      name: 'Concern Resolution',
      description: 'For negative 1-2 star reviews',
      body: 'We\'re sorry to hear about your experience, {{reviewerName}}. This is not the standard we hold ourselves to. Please contact Mike Johnson at (303) 555-0100 so we can make this right.',
      variables: ['reviewerName'],
      sentiment: 'negative',
      minRating: 1,
      maxRating: 2,
      usageCount: 1,
      createdAt: toTimestamp(monthsAgo(3)),
      updatedAt: toTimestamp(monthsAgo(2)),
    },
  ];

  const batch = db.batch();
  for (const template of templates) {
    const docRef = orgRef.collection('reviewResponseTemplates').doc(generateId('tmpl'));
    batch.set(docRef, template);
  }
  await batch.commit();
  logSuccess(`Created ${templates.length} response templates`);
}

async function main() {
  logSection('Review Management Seed Script');
  logProgress(`Organization: ${DEMO_ORG_ID}`);

  await seedReviews();
  await seedReviewRequests();
  await seedAutomationRules();
  await seedResponseTemplates();

  logSection('Review Seed Complete!');
  logSuccess('15 reviews, 10 requests, 3 rules, 4 templates created');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
