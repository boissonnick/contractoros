/**
 * Seed Messages for Demo Data
 *
 * Generates 120+ messages across all projects with realistic
 * client/contractor conversations covering updates, questions,
 * approvals, and scheduling.
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  CLIENT_UPDATE_TEMPLATES,
  CLIENT_QUESTION_TEMPLATES,
  CONTRACTOR_RESPONSE_TEMPLATES,
  SCHEDULING_TEMPLATES,
  APPROVAL_REQUEST_TEMPLATES,
  CLIENT_APPROVAL_TEMPLATES,
  ISSUE_NOTIFICATION_TEMPLATES,
  WEATHER_DELAY_TEMPLATES,
  COMPLETION_TEMPLATES,
  MESSAGE_TOPICS,
} from './data/message-templates';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  monthsAgo,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  generateId,
} from './utils';
import { DEMO_PROJECTS, DEMO_DATA_PREFIX } from './seed-activities';

// Types matching the Message and MessageChannel interfaces
export type MessageChannelType = 'project' | 'direct' | 'team' | 'client';

export interface MessageChannelSeed {
  id: string;
  orgId: string;
  type: MessageChannelType;
  name: string;
  projectId?: string;
  participantIds: string[];
  lastMessageAt?: Date;
  lastMessageText?: string;
  lastMessageBy?: string;
  createdBy: string;
  createdAt: Date;
}

export interface MessageSeed {
  id: string;
  channelId: string;
  orgId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  mentions: string[];
  attachmentURL?: string;
  attachmentName?: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Utility functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

// Template filling functions
function fillTemplate(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

// Convert DEMO_CLIENTS object to array with displayName for easier lookup
const CLIENT_LIST = Object.values(DEMO_CLIENTS).map(client => ({
  ...client,
  displayName: ('companyName' in client && client.companyName) || `${client.firstName} ${client.lastName}`,
}));

// Get client for a project based on clientId
function getClientForProject(projectId: string): typeof CLIENT_LIST[0] | undefined {
  const project = DEMO_PROJECTS.find(p => p.id === projectId);
  if (!project) return undefined;
  return CLIENT_LIST.find(client => client.id === project.clientId);
}

// Conversation thread types
type ThreadType = 'update' | 'question' | 'scheduling' | 'approval' | 'issue' | 'weather' | 'completion';

// Generate a conversation thread
function generateThread(
  threadType: ThreadType,
  project: typeof DEMO_PROJECTS[0],
  client: typeof CLIENT_LIST[0],
  channelId: string,
  orgId: string,
  baseDate: Date,
  messageIdStart: number
): { messages: MessageSeed[]; lastId: number } {
  const messages: MessageSeed[] = [];
  let messageId = messageIdStart;
  let currentDate = new Date(baseDate);

  const contractor = DEMO_USERS.owner;
  const projectPhase = project.phases?.[0] || 'Construction';

  // Common replacements
  const replacements: Record<string, string> = {
    clientName: client.firstName,
    contractorName: contractor.displayName.split(' ')[0],
    projectType: project.name.split(' ')[project.name.split(' ').length - 1] || 'project',
    phase: projectPhase,
    area: randomElement(MESSAGE_TOPICS.areas),
    material: randomElement(MESSAGE_TOPICS.materials),
    inspection: randomElement(MESSAGE_TOPICS.inspections),
    trade: randomElement(MESSAGE_TOPICS.trades),
    milestone: randomElement(MESSAGE_TOPICS.milestones),
    subcontractor: randomElement(['Tony\'s Plumbing', 'Elite Electric', 'ABC Flooring', 'Pro Tile Co']),
  };

  switch (threadType) {
    case 'update': {
      // Contractor sends update
      const updateTemplate = randomElement(CLIENT_UPDATE_TEMPLATES);
      messages.push({
        id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
        channelId,
        orgId,
        senderId: contractor.uid,
        senderName: contractor.displayName,
        text: fillTemplate(updateTemplate, {
          ...replacements,
          updateContent: `we completed ${randomElement(MESSAGE_TOPICS.milestones)} today`,
          progressUpdate: `The ${randomElement(MESSAGE_TOPICS.trades)} finished their work`,
          dailyUpdate: `Crew worked on ${randomElement(MESSAGE_TOPICS.areas)}`,
          completedWork: randomElement(MESSAGE_TOPICS.milestones),
          timeframe: randomElement(['tomorrow', 'this week', 'Monday', 'by Friday']),
          percentComplete: String(randomInt(40, 90)),
          nextStep: randomElement(MESSAGE_TOPICS.milestones),
          date: randomElement(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
          vendorName: randomElement(['ABC Supply', 'Home Depot Pro', 'Ferguson', 'BuildPro']),
        }),
        mentions: [],
        isEdited: false,
        createdAt: currentDate,
      });

      // Client responds (60% chance)
      if (Math.random() > 0.4) {
        currentDate = addHours(currentDate, randomInt(1, 8));
        const questionTemplate = randomElement(CLIENT_QUESTION_TEMPLATES);
        messages.push({
          id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
          channelId,
          orgId,
          senderId: client.id,
          senderName: client.displayName,
          text: fillTemplate(questionTemplate, {
            ...replacements,
            topic: randomElement(MESSAGE_TOPICS.materials),
            question: 'how long will that take?',
            nextMilestone: randomElement(MESSAGE_TOPICS.milestones),
            observation: 'some dust on the counters',
            familyMember: randomElement(['spouse', 'parents', 'kids']),
            specificQuestion: 'what are our options?',
            element: randomElement(MESSAGE_TOPICS.materials),
          }),
          mentions: [],
          isEdited: false,
          createdAt: currentDate,
        });

        // Contractor responds (80% chance)
        if (Math.random() > 0.2) {
          currentDate = addHours(currentDate, randomInt(1, 4));
          const responseTemplate = randomElement(CONTRACTOR_RESPONSE_TEMPLATES);
          messages.push({
            id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
            channelId,
            orgId,
            senderId: contractor.uid,
            senderName: contractor.displayName,
            text: fillTemplate(responseTemplate, {
              ...replacements,
              answer: 'We should have that done by end of week',
              suggestion: 'add that feature',
              cost: `$${randomInt(200, 2000)}`,
              explanation: 'That\'s a normal part of the process',
              details: 'I\'ll have the team take care of it',
              vendor: randomElement(['the supplier', 'our contact', 'the manufacturer']),
              estimate: `${randomInt(2, 5)} days`,
              date: randomElement(['tomorrow', 'Monday', 'this week']),
            }),
            mentions: [],
            isEdited: false,
            createdAt: currentDate,
          });
        }
      }
      break;
    }

    case 'scheduling': {
      const scheduleTemplate = randomElement(SCHEDULING_TEMPLATES);
      messages.push({
        id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
        channelId,
        orgId,
        senderId: contractor.uid,
        senderName: contractor.displayName,
        text: fillTemplate(scheduleTemplate, {
          ...replacements,
          date: randomElement(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
          time: `${randomInt(8, 10)}:00 AM`,
          days: randomElement(['Monday-Wednesday', 'this week', 'the next few days']),
          timeRange: `${randomInt(8, 10)} AM - ${randomInt(12, 4)} PM`,
          newDate: randomElement(['next Monday', 'Thursday', 'early next week']),
          work: randomElement(MESSAGE_TOPICS.milestones),
        }),
        mentions: [],
        isEdited: false,
        createdAt: currentDate,
      });

      // Client confirms (70% chance)
      if (Math.random() > 0.3) {
        currentDate = addHours(currentDate, randomInt(1, 6));
        messages.push({
          id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
          channelId,
          orgId,
          senderId: client.id,
          senderName: client.displayName,
          text: randomElement([
            'That works for us! Thanks for the heads up.',
            'Perfect, we\'ll make sure to be available.',
            'Sounds good! Looking forward to seeing the progress.',
            'Great, thanks for letting us know.',
            'Works for us. See you then!',
          ]),
          mentions: [],
          isEdited: false,
          createdAt: currentDate,
        });
      }
      break;
    }

    case 'approval': {
      const approvalTemplate = randomElement(APPROVAL_REQUEST_TEMPLATES);
      messages.push({
        id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
        channelId,
        orgId,
        senderId: contractor.uid,
        senderName: contractor.displayName,
        text: fillTemplate(approvalTemplate, {
          ...replacements,
          item: randomElement(MESSAGE_TOPICS.materials),
          optionType: randomElement(['color', 'finish', 'style', 'material']),
          options: 'Option A (standard) or Option B (upgraded)',
          document: randomElement(['change order', 'selection sheet', 'proposal']),
          deadline: randomElement(['end of week', 'tomorrow', 'Monday']),
        }),
        mentions: [],
        isEdited: false,
        createdAt: currentDate,
      });

      // Client responds with approval (90% chance)
      if (Math.random() > 0.1) {
        currentDate = addHours(currentDate, randomInt(2, 24));
        const approvalResponse = randomElement(CLIENT_APPROVAL_TEMPLATES);
        messages.push({
          id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
          channelId,
          orgId,
          senderId: client.id,
          senderName: client.displayName,
          text: fillTemplate(approvalResponse, {
            ...replacements,
            optionLetter: randomElement(['A', 'B']),
            optionA: 'first one',
            decision: randomElement(['Option A', 'Option B', 'the upgraded version']),
            preference: randomElement(['the darker color', 'the matte finish', 'the modern style']),
            option: randomElement(MESSAGE_TOPICS.materials),
          }),
          mentions: [],
          isEdited: false,
          createdAt: currentDate,
        });

        // Contractor confirms (80% chance)
        if (Math.random() > 0.2) {
          currentDate = addHours(currentDate, randomInt(1, 4));
          messages.push({
            id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
            channelId,
            orgId,
            senderId: contractor.uid,
            senderName: contractor.displayName,
            text: randomElement([
              'Perfect! I\'ll place the order today.',
              'Great choice! We\'ll get that scheduled.',
              'Excellent! Moving forward with that option.',
              'Thanks for the quick response! We\'re on it.',
            ]),
            mentions: [],
            isEdited: false,
            createdAt: currentDate,
          });
        }
      }
      break;
    }

    case 'issue': {
      const issueTemplate = randomElement(ISSUE_NOTIFICATION_TEMPLATES);
      messages.push({
        id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
        channelId,
        orgId,
        senderId: contractor.uid,
        senderName: contractor.displayName,
        text: fillTemplate(issueTemplate, {
          ...replacements,
          issue: randomElement([
            'we found some water damage behind the drywall',
            'the countertop measurements were slightly off',
            'we discovered some outdated wiring',
            'there\'s a small crack in the existing foundation',
          ]),
          solution: 'We\'ll repair it and keep moving forward',
          impact: 'It might add a day to the schedule',
          options: 'repair or replace',
          explanation: 'This is something we see occasionally in older homes',
          cost: `$${randomInt(300, 1500)}`,
          silverLining: 'we caught it early',
        }),
        mentions: [],
        isEdited: false,
        createdAt: currentDate,
      });

      // Client responds (80% chance)
      if (Math.random() > 0.2) {
        currentDate = addHours(currentDate, randomInt(1, 8));
        messages.push({
          id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
          channelId,
          orgId,
          senderId: client.id,
          senderName: client.displayName,
          text: randomElement([
            'Thanks for letting me know. What do you recommend?',
            'Appreciate the transparency. Let\'s go with the repair.',
            'I understand. Please proceed with fixing it.',
            'Good to know. How much will this add to the cost?',
            'Thanks for catching that! Whatever you think is best.',
          ]),
          mentions: [],
          isEdited: false,
          createdAt: currentDate,
        });
      }
      break;
    }

    case 'weather': {
      const weatherTemplate = randomElement(WEATHER_DELAY_TEMPLATES);
      messages.push({
        id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
        channelId,
        orgId,
        senderId: contractor.uid,
        senderName: contractor.displayName,
        text: fillTemplate(weatherTemplate, {
          ...replacements,
          days: randomElement(['tomorrow', 'the next two days', 'Tuesday']),
          indoorWork: randomElement(['cabinet installation', 'painting', 'electrical work']),
          outdoorWork: randomElement(['deck framing', 'exterior work', 'roofing']),
          newDate: randomElement(['Thursday', 'Friday', 'early next week']),
          work: randomElement(MESSAGE_TOPICS.milestones),
          date: randomElement(['Wednesday', 'Thursday', 'Friday']),
          details: 'We\'ll be working inside until conditions improve',
          impact: 'No change to the overall completion date',
        }),
        mentions: [],
        isEdited: false,
        createdAt: currentDate,
      });

      // Client acknowledges (60% chance)
      if (Math.random() > 0.4) {
        currentDate = addHours(currentDate, randomInt(1, 6));
        messages.push({
          id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
          channelId,
          orgId,
          senderId: client.id,
          senderName: client.displayName,
          text: randomElement([
            'Makes sense. Stay safe out there!',
            'Thanks for the update. Safety first!',
            'Understood. Appreciate you keeping us in the loop.',
            'No problem at all. See you when it clears up.',
          ]),
          mentions: [],
          isEdited: false,
          createdAt: currentDate,
        });
      }
      break;
    }

    case 'completion': {
      const completionTemplate = randomElement(COMPLETION_TEMPLATES);
      messages.push({
        id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
        channelId,
        orgId,
        senderId: contractor.uid,
        senderName: contractor.displayName,
        text: fillTemplate(completionTemplate, {
          ...replacements,
          remainingItems: randomElement(['a few minor touch-ups', 'cabinet adjustments', 'final cleaning']),
          finalWork: randomElement(['punch list items', 'touch-ups', 'final details']),
        }),
        mentions: [],
        isEdited: false,
        createdAt: currentDate,
      });

      // Client responds excitedly
      currentDate = addHours(currentDate, randomInt(1, 4));
      messages.push({
        id: `${DEMO_DATA_PREFIX}msg_${String(messageId++).padStart(4, '0')}`,
        channelId,
        orgId,
        senderId: client.id,
        senderName: client.displayName,
        text: randomElement([
          'This is so exciting! We can\'t wait to see the finished product!',
          'Amazing! Thank you so much for all your hard work!',
          'It looks incredible! We\'re thrilled with the results!',
          'Wow! The transformation is amazing! Thank you!',
          'We love it! Can\'t wait for the final walkthrough!',
        ]),
        mentions: [],
        isEdited: false,
        createdAt: currentDate,
      });
      break;
    }
  }

  return { messages, lastId: messageId };
}

// Main function to generate messages and channels
export function generateMessages(orgId: string): { channels: MessageChannelSeed[]; messages: MessageSeed[] } {
  const channels: MessageChannelSeed[] = [];
  const messages: MessageSeed[] = [];
  let messageIdCounter = 1;
  let channelIdCounter = 1;

  // Filter to projects that should have messages
  const projectsWithMessages = DEMO_PROJECTS.filter(p =>
    p.status === 'active' || p.status === 'completed' || p.status === 'on_hold'
  );

  for (const project of projectsWithMessages) {
    const client = getClientForProject(project.id);
    if (!client) continue;

    // Create channel for this project
    const channelId = `${DEMO_DATA_PREFIX}channel_${String(channelIdCounter++).padStart(4, '0')}`;
    const channel: MessageChannelSeed = {
      id: channelId,
      orgId,
      type: 'client',
      name: `${project.name} - ${client.displayName}`,
      projectId: project.id,
      participantIds: [DEMO_USERS.owner.uid, client.id],
      createdBy: DEMO_USERS.owner.uid,
      createdAt: project.startDate ? new Date(project.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    };

    // Determine number of threads based on project status
    let threadCount: number;
    if (project.status === 'completed') {
      threadCount = randomInt(8, 12);
    } else if (project.status === 'active') {
      threadCount = randomInt(5, 10);
    } else {
      threadCount = randomInt(2, 4);
    }

    // Distribute threads over project timeline
    const projectStart = project.startDate
      ? new Date(project.startDate)
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const projectEnd = project.status === 'completed' && project.endDate
      ? new Date(project.endDate)
      : new Date();
    const projectDuration = (projectEnd.getTime() - projectStart.getTime()) / (threadCount + 1);

    // Thread type distribution
    const threadTypes: ThreadType[] = [];

    // Always start with an update
    threadTypes.push('update');

    // Add scheduling early
    if (threadCount > 2) threadTypes.push('scheduling');

    // Add approvals mid-project
    if (threadCount > 3) threadTypes.push('approval');

    // Mix of updates, questions, and issues
    for (let i = threadTypes.length; i < threadCount - 1; i++) {
      const type = randomElement(['update', 'update', 'scheduling', 'approval', 'issue', 'weather']);
      threadTypes.push(type as ThreadType);
    }

    // End with completion for completed projects
    if (project.status === 'completed') {
      threadTypes.push('completion');
    } else {
      threadTypes.push('update');
    }

    // Generate threads
    for (let i = 0; i < threadTypes.length; i++) {
      const baseDate = new Date(projectStart.getTime() + projectDuration * (i + 1));
      const { messages: threadMessages, lastId } = generateThread(
        threadTypes[i],
        project,
        client,
        channelId,
        orgId,
        baseDate,
        messageIdCounter
      );

      messages.push(...threadMessages);
      messageIdCounter = lastId;
    }

    // Update channel with last message info
    if (messages.length > 0) {
      const channelMessages = messages.filter(m => m.channelId === channelId);
      const lastMessage = channelMessages[channelMessages.length - 1];
      if (lastMessage) {
        channel.lastMessageAt = lastMessage.createdAt;
        channel.lastMessageText = lastMessage.text.substring(0, 100);
        channel.lastMessageBy = lastMessage.senderId;
      }
    }

    channels.push(channel);
  }

  console.log(`Generated ${channels.length} message channels and ${messages.length} messages`);

  return { channels, messages };
}

// Export for seeding
export { DEMO_DATA_PREFIX };

// Conversion function for Firestore - Channel
export function convertChannelToFirestore(channel: MessageChannelSeed): Record<string, unknown> {
  return {
    ...channel,
    lastMessageAt: channel.lastMessageAt ? Timestamp.fromDate(channel.lastMessageAt) : null,
    createdAt: Timestamp.fromDate(channel.createdAt),
  };
}

// Conversion function for Firestore - Message
export function convertMessageToFirestore(message: MessageSeed): Record<string, unknown> {
  return {
    ...message,
    createdAt: Timestamp.fromDate(message.createdAt),
    updatedAt: message.updatedAt ? Timestamp.fromDate(message.updatedAt) : null,
  };
}
