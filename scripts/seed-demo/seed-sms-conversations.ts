/**
 * Seed SMS Conversations and Messages for Demo Data
 *
 * Creates realistic SMS conversation threads between the construction
 * company and clients/subcontractors. Covers common scenarios:
 *   - Appointment confirmations
 *   - Project updates
 *   - Payment reminders
 *   - Material delivery notifications
 *   - Schedule changes
 *   - Inspection coordination
 *
 * Collections seeded:
 *   - smsConversations (top-level, filtered by orgId)
 *   - smsMessages (top-level, filtered by orgId)
 *
 * Uses the named "contractoros" database via shared db.ts module.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  generateId,
  toTimestamp,
  daysAgo,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

const db = getDb();

// ============================================
// Constants
// ============================================

/** Simulated Twilio phone number for outbound messages */
const TWILIO_PHONE_NUMBER = '+13035550199';

/** Demo project IDs (matching other seed scripts) */
const DEMO_PROJECTS = {
  smithKitchen: 'demo-proj-smith-kitchen',
  garciaBath: 'demo-proj-garcia-bath',
  mainStRetail: 'demo-proj-mainst-retail',
  cafeReno: 'demo-proj-cafe-ti',
  thompsonDeck: 'demo-proj-thompson-deck',
  wilsonFence: 'demo-proj-wilson-fence',
  officePark: 'demo-proj-office-park',
};

// ============================================
// Types (matching SmsConversation & SmsMessage)
// ============================================

interface ConversationSeed {
  id: string;
  orgId: string;
  phoneNumber: string;
  participantId: string;
  participantType: 'client' | 'subcontractor';
  participantName: string;
  lastMessageAt: Date;
  lastMessagePreview: string;
  lastMessageDirection: 'outbound' | 'inbound';
  unreadCount: number;
  projectId?: string;
  createdAt: Date;
}

interface MessageSeed {
  id: string;
  orgId: string;
  to: string;
  from: string;
  body: string;
  direction: 'outbound' | 'inbound';
  status: 'delivered' | 'sent' | 'queued';
  recipientId?: string;
  recipientType?: 'client' | 'subcontractor';
  recipientName?: string;
  projectId?: string;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  createdBy?: string;
}

// ============================================
// Phone number helpers (E.164 format)
// ============================================

/** Convert "(303) 555-1001" to "+13035551001" */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}

// ============================================
// Conversation Definitions
// ============================================

interface ConversationDef {
  participantId: string;
  participantType: 'client' | 'subcontractor';
  participantName: string;
  phoneNumber: string;
  projectId?: string;
  messages: Array<{
    direction: 'outbound' | 'inbound';
    body: string;
    minutesAfterStart: number;
  }>;
  daysAgoStart: number;
  unreadCount: number;
}

const CONVERSATIONS: ConversationDef[] = [
  // ---- CLIENT CONVERSATIONS ----

  // 1. Smith - Kitchen appointment confirmation
  {
    participantId: DEMO_CLIENTS.smith.id,
    participantType: 'client',
    participantName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    phoneNumber: toE164(DEMO_CLIENTS.smith.phone),
    projectId: DEMO_PROJECTS.smithKitchen,
    daysAgoStart: 1,
    unreadCount: 1,
    messages: [
      {
        direction: 'outbound',
        body: 'Hi Robert, this is Mike from Horizon Construction. Just confirming our appointment tomorrow at 9 AM to review the kitchen cabinet installation. Will you be available?',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'Hi Mike! Yes, 9 AM works perfectly. My wife and I will both be here. Is there anything we need to prepare?',
        minutesAfterStart: 35,
      },
      {
        direction: 'outbound',
        body: 'No prep needed on your end. We just want to walk through the layout one more time before the cabinets arrive Thursday. See you then!',
        minutesAfterStart: 42,
      },
      {
        direction: 'inbound',
        body: 'Sounds great, looking forward to it. Thanks for the heads up!',
        minutesAfterStart: 50,
      },
    ],
  },

  // 2. Garcia - Payment reminder
  {
    participantId: DEMO_CLIENTS.garcia.id,
    participantType: 'client',
    participantName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    phoneNumber: toE164(DEMO_CLIENTS.garcia.phone),
    projectId: DEMO_PROJECTS.garciaBath,
    daysAgoStart: 3,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'Hi Maria, this is a friendly reminder that invoice #INV-2024-022 for $2,850.00 (Garcia Master Bath - Milestone 2) is due this Friday. You can pay online at your client portal or by check.',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'Thanks for the reminder! I submitted the payment through the portal just now. Should show up shortly.',
        minutesAfterStart: 180,
      },
      {
        direction: 'outbound',
        body: 'Got it, thank you Maria! Payment confirmed. We\'ll have the tile crew starting on Monday as planned.',
        minutesAfterStart: 195,
      },
    ],
  },

  // 3. Thompson - Project update / deck progress
  {
    participantId: DEMO_CLIENTS.thompson.id,
    participantType: 'client',
    participantName: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`,
    phoneNumber: toE164(DEMO_CLIENTS.thompson.phone),
    projectId: DEMO_PROJECTS.thompsonDeck,
    daysAgoStart: 2,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'Good afternoon James! Quick update on the deck - footings are poured and curing. We\'re on schedule to start framing on Wednesday. I\'ll send photos through the portal tonight.',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'That\'s great news! The concrete looked solid when I peeked outside this morning. Thanks for the update.',
        minutesAfterStart: 45,
      },
      {
        direction: 'outbound',
        body: 'Glad to hear it! The footings came out really well. We\'ll have the lumber delivered Tuesday afternoon so we\'re ready to go Wednesday morning.',
        minutesAfterStart: 52,
      },
    ],
  },

  // 4. Wilson - Material delivery notification
  {
    participantId: DEMO_CLIENTS.wilson.id,
    participantType: 'client',
    participantName: `${DEMO_CLIENTS.wilson.firstName} ${DEMO_CLIENTS.wilson.lastName}`,
    phoneNumber: toE164(DEMO_CLIENTS.wilson.phone),
    projectId: DEMO_PROJECTS.wilsonFence,
    daysAgoStart: 5,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'Hi Jennifer, heads up that we have a material delivery scheduled for your property tomorrow between 10 AM - 12 PM. The cedar fence boards and posts will be dropped in the side yard. Please make sure the gate is accessible.',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'Got it! I\'ll make sure the side gate is unlocked. Will someone from your team be there to receive it?',
        minutesAfterStart: 25,
      },
      {
        direction: 'outbound',
        body: 'Yes, Carlos will be on-site to receive and verify the delivery. He\'ll arrive around 9:30 AM.',
        minutesAfterStart: 30,
      },
      {
        direction: 'inbound',
        body: 'Perfect, thanks Mike!',
        minutesAfterStart: 33,
      },
    ],
  },

  // 5. Brown - Schedule change notification
  {
    participantId: DEMO_CLIENTS.brown.id,
    participantType: 'client',
    participantName: `${DEMO_CLIENTS.brown.firstName} ${DEMO_CLIENTS.brown.lastName}`,
    phoneNumber: toE164(DEMO_CLIENTS.brown.phone),
    daysAgoStart: 7,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'Hi Michael, unfortunately we need to push our initial walkthrough from Wednesday to Friday due to a scheduling conflict with another project. Would Friday at 10 AM work for you?',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'Friday works. Can we do 11 AM instead? I have a morning meeting.',
        minutesAfterStart: 90,
      },
      {
        direction: 'outbound',
        body: '11 AM on Friday is perfect. I\'ll update the calendar. See you then!',
        minutesAfterStart: 100,
      },
    ],
  },

  // 6. Downtown Cafe - Commercial project update
  {
    participantId: DEMO_CLIENTS.downtownCafe.id,
    participantType: 'client',
    participantName: 'Tom Richards',
    phoneNumber: toE164(DEMO_CLIENTS.downtownCafe.phone),
    projectId: DEMO_PROJECTS.cafeReno,
    daysAgoStart: 1,
    unreadCount: 2,
    messages: [
      {
        direction: 'outbound',
        body: 'Tom, good news - the city approved the electrical permit for the cafe expansion. We can start the panel upgrade next week. Sarah will reach out to schedule.',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'Fantastic! That was faster than expected. Will the work require us to shut down for any days?',
        minutesAfterStart: 15,
      },
      {
        direction: 'outbound',
        body: 'We\'ll need one full day for the panel swap - probably Wednesday. The rest of the wiring can happen while you\'re open since it\'s in the expansion area.',
        minutesAfterStart: 22,
      },
      {
        direction: 'inbound',
        body: 'Wednesday works. We\'re normally closed for deep cleaning. Could we also discuss adding two more outlets in the bar area? I know it\'s a change order but wanted to mention it.',
        minutesAfterStart: 40,
      },
      {
        direction: 'inbound',
        body: 'Also, can you send me an updated timeline? The investors are asking for our grand reopening date.',
        minutesAfterStart: 42,
      },
    ],
  },

  // 7. Main St Retail - Inspection coordination
  {
    participantId: DEMO_CLIENTS.mainStRetail.id,
    participantType: 'client',
    participantName: 'Susan Martinez',
    phoneNumber: toE164(DEMO_CLIENTS.mainStRetail.phone),
    projectId: DEMO_PROJECTS.mainStRetail,
    daysAgoStart: 4,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'Susan, the framing inspection is scheduled for Thursday at 2 PM. Inspector needs access to all areas of the storefront. Can you coordinate with your property manager?',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'I\'ll have the property manager open up by 1:30. Is there anything they need to see specifically?',
        minutesAfterStart: 60,
      },
      {
        direction: 'outbound',
        body: 'They\'ll review the structural framing, fire blocking, and nailing patterns. Our crew will be there to answer any questions. I\'ll text you as soon as we get the results.',
        minutesAfterStart: 75,
      },
      {
        direction: 'inbound',
        body: 'Great, thanks for keeping me in the loop.',
        minutesAfterStart: 80,
      },
    ],
  },

  // 8. Office Park - Commercial lease coordination
  {
    participantId: DEMO_CLIENTS.officePark.id,
    participantType: 'client',
    participantName: 'David Anderson',
    phoneNumber: toE164(DEMO_CLIENTS.officePark.phone),
    projectId: DEMO_PROJECTS.officePark,
    daysAgoStart: 6,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'David, we finished the drywall in Suite 200 today. The team will start mudding and taping tomorrow. On track for the painting contractor to start next Monday.',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'Looks like we\'re making good progress. The new tenant is eager to move in. Any chance we can accelerate the timeline?',
        minutesAfterStart: 120,
      },
      {
        direction: 'outbound',
        body: 'I\'ll see if we can bring the painters in a day early. The flooring is already ordered and expected Wednesday of next week. I\'ll put together an updated schedule.',
        minutesAfterStart: 135,
      },
    ],
  },

  // ---- SUBCONTRACTOR CONVERSATIONS ----

  // 9. Peak Plumbing - Rough-in coordination
  {
    participantId: 'sub-peak-plumbing',
    participantType: 'subcontractor',
    participantName: 'David Martinez (Peak Plumbing)',
    phoneNumber: '+13035553001',
    projectId: DEMO_PROJECTS.garciaBath,
    daysAgoStart: 2,
    unreadCount: 1,
    messages: [
      {
        direction: 'outbound',
        body: 'David, the Garcia bath demo is complete. You\'re clear to start the plumbing rough-in tomorrow morning. The vanity location has changed slightly - check the updated plans in the portal.',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'Got it. I\'ll review the plans tonight. How many days do I have before drywall closes up?',
        minutesAfterStart: 30,
      },
      {
        direction: 'outbound',
        body: 'Drywall isn\'t scheduled until next Thursday, so you have about 5 working days. Should be plenty of time.',
        minutesAfterStart: 38,
      },
      {
        direction: 'inbound',
        body: 'Perfect. I\'ll have my crew there at 7 AM. Need to coordinate with the electrician on the shower fan location - can you connect me with Jennifer from Mountain Electric?',
        minutesAfterStart: 45,
      },
    ],
  },

  // 10. Mountain Electric - Emergency callout
  {
    participantId: 'sub-mountain-electric',
    participantType: 'subcontractor',
    participantName: 'Jennifer Kim (Mountain Electric)',
    phoneNumber: '+13035553002',
    projectId: DEMO_PROJECTS.cafeReno,
    daysAgoStart: 0,
    unreadCount: 1,
    messages: [
      {
        direction: 'inbound',
        body: 'Mike, we found an issue with the existing panel at the cafe. The main breaker is undersized for the new load calc. We need to upgrade to a 400A service instead of 200A.',
        minutesAfterStart: 0,
      },
      {
        direction: 'outbound',
        body: 'Thanks for catching that, Jennifer. What\'s the cost difference and how does it affect the timeline?',
        minutesAfterStart: 12,
      },
      {
        direction: 'inbound',
        body: 'About $3,200 more for the panel and meter base. Adds 1 day to the electrical work. I can have a formal quote to you by end of day.',
        minutesAfterStart: 18,
      },
      {
        direction: 'outbound',
        body: 'Send the quote over. I\'ll prepare a change order for the client. Let\'s plan for the 400A panel - better to do it right.',
        minutesAfterStart: 25,
      },
      {
        direction: 'inbound',
        body: 'Agreed. Quote coming your way this afternoon. I\'ll also coordinate with Xcel Energy for the service upgrade.',
        minutesAfterStart: 30,
      },
    ],
  },

  // 11. Denver Tile - Material selection
  {
    participantId: 'sub-denver-tile',
    participantType: 'subcontractor',
    participantName: 'Maria Santos (Denver Tile)',
    phoneNumber: '+13035553005',
    projectId: DEMO_PROJECTS.smithKitchen,
    daysAgoStart: 4,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'Maria, the client selected the Carrara marble mosaic for the kitchen backsplash. Can you check lead time and availability?',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'I checked with my distributor - 3-4 week lead time. We\'d need to order by Friday to stay on schedule. Want me to send a material order sheet?',
        minutesAfterStart: 90,
      },
      {
        direction: 'outbound',
        body: 'Yes, please send the order sheet. I\'ll get client approval today and we can place the order tomorrow.',
        minutesAfterStart: 100,
      },
    ],
  },

  // 12. Alpine HVAC - Schedule confirmation
  {
    participantId: 'sub-alpine-hvac',
    participantType: 'subcontractor',
    participantName: 'Robert Chen (Alpine HVAC)',
    phoneNumber: '+13035553003',
    projectId: DEMO_PROJECTS.officePark,
    daysAgoStart: 3,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'Robert, are we still on for the HVAC rough-in at Office Park Suite 200 starting Monday? Ductwork and register locations are marked on the floor.',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'Yes, confirmed for Monday. I\'ll have two guys there. Quick question - is the rooftop unit already in place or are we setting that too?',
        minutesAfterStart: 45,
      },
      {
        direction: 'outbound',
        body: 'The RTU is already set from the base building install. You just need to connect the new ductwork to the existing trunk line. I\'ll have the mechanical drawings on-site.',
        minutesAfterStart: 55,
      },
      {
        direction: 'inbound',
        body: 'Great, that saves us a half day. See you Monday.',
        minutesAfterStart: 60,
      },
    ],
  },

  // 13. Garcia - Follow-up on tile selections
  {
    participantId: DEMO_CLIENTS.garcia.id,
    participantType: 'client',
    participantName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    phoneNumber: toE164(DEMO_CLIENTS.garcia.phone),
    projectId: DEMO_PROJECTS.garciaBath,
    daysAgoStart: 8,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'Hi Maria, just a reminder that we need your tile selections finalized by Friday so we can order in time. The samples are still at our showroom if you\'d like to see them again.',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'I\'ve been going back and forth between the two options. Can I stop by the showroom tomorrow afternoon?',
        minutesAfterStart: 120,
      },
      {
        direction: 'outbound',
        body: 'Absolutely! Sarah will be there until 4 PM and can walk you through both options. The porcelain has a faster lead time if that helps.',
        minutesAfterStart: 130,
      },
      {
        direction: 'inbound',
        body: 'Good to know. I\'ll come by around 2 PM. Thanks Mike!',
        minutesAfterStart: 140,
      },
    ],
  },

  // 14. Front Range Painting - Scheduling
  {
    participantId: 'sub-front-range-paint',
    participantType: 'subcontractor',
    participantName: 'Jake Thompson (FR Painting)',
    phoneNumber: '+13035553006',
    projectId: DEMO_PROJECTS.mainStRetail,
    daysAgoStart: 1,
    unreadCount: 0,
    messages: [
      {
        direction: 'outbound',
        body: 'Jake, drywall finishing at the Main St. retail space should be complete by Thursday. Can your crew start priming Friday?',
        minutesAfterStart: 0,
      },
      {
        direction: 'inbound',
        body: 'Friday works. How many coats are we doing? And did the client finalize their color selections?',
        minutesAfterStart: 60,
      },
      {
        direction: 'outbound',
        body: 'Two coats plus primer. Colors are confirmed - Sherwin Williams Agreeable Gray for walls, Extra White for trim. I\'ll have the paint ordered and on-site Thursday.',
        minutesAfterStart: 70,
      },
      {
        direction: 'inbound',
        body: 'Perfect. I\'ll plan for a 3-day job with a 2-man crew. Friday through the following Tuesday should do it.',
        minutesAfterStart: 78,
      },
    ],
  },

  // 15. Smith - Warranty follow-up
  {
    participantId: DEMO_CLIENTS.smith.id,
    participantType: 'client',
    participantName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    phoneNumber: toE164(DEMO_CLIENTS.smith.phone),
    projectId: DEMO_PROJECTS.smithKitchen,
    daysAgoStart: 10,
    unreadCount: 0,
    messages: [
      {
        direction: 'inbound',
        body: 'Hi Mike, quick question - one of the cabinet doors seems slightly misaligned. Is this something covered under warranty?',
        minutesAfterStart: 0,
      },
      {
        direction: 'outbound',
        body: 'Hi Robert, absolutely - all our cabinetry work is covered for 1 year. I\'ll have Carlos swing by this week to adjust it. What day works best?',
        minutesAfterStart: 45,
      },
      {
        direction: 'inbound',
        body: 'Thursday afternoon would be ideal. Thanks for the quick response!',
        minutesAfterStart: 55,
      },
      {
        direction: 'outbound',
        body: 'Thursday afternoon it is. Carlos will text you when he\'s on his way. It\'s usually just a hinge adjustment - takes about 15 minutes.',
        minutesAfterStart: 62,
      },
    ],
  },
];

// ============================================
// Build Firestore Documents
// ============================================

function buildConversationsAndMessages(): {
  conversations: ConversationSeed[];
  messages: MessageSeed[];
} {
  const conversations: ConversationSeed[] = [];
  const messages: MessageSeed[] = [];

  for (const conv of CONVERSATIONS) {
    const conversationId = generateId('sms-conv');
    const startDate = daysAgo(conv.daysAgoStart);
    // Set a reasonable work-hour start time
    startDate.setHours(9, 0, 0, 0);

    const convMessages: MessageSeed[] = [];

    for (const msg of conv.messages) {
      const msgDate = new Date(startDate.getTime() + msg.minutesAfterStart * 60 * 1000);
      const messageId = generateId('sms-msg');

      const isOutbound = msg.direction === 'outbound';

      convMessages.push({
        id: messageId,
        orgId: DEMO_ORG_ID,
        to: isOutbound ? conv.phoneNumber : TWILIO_PHONE_NUMBER,
        from: isOutbound ? TWILIO_PHONE_NUMBER : conv.phoneNumber,
        body: msg.body,
        direction: msg.direction,
        status: 'delivered',
        recipientId: isOutbound ? conv.participantId : undefined,
        recipientType: isOutbound ? conv.participantType : undefined,
        recipientName: isOutbound ? conv.participantName : undefined,
        projectId: conv.projectId,
        createdAt: msgDate,
        sentAt: msgDate,
        deliveredAt: new Date(msgDate.getTime() + 5000), // delivered 5s later
        createdBy: isOutbound ? DEMO_USERS.owner.uid : undefined,
      });
    }

    // Last message info for the conversation
    const lastMsg = convMessages[convMessages.length - 1];

    conversations.push({
      id: conversationId,
      orgId: DEMO_ORG_ID,
      phoneNumber: conv.phoneNumber,
      participantId: conv.participantId,
      participantType: conv.participantType,
      participantName: conv.participantName,
      lastMessageAt: lastMsg.createdAt,
      lastMessagePreview: lastMsg.body.length > 100
        ? lastMsg.body.substring(0, 97) + '...'
        : lastMsg.body,
      lastMessageDirection: lastMsg.direction,
      unreadCount: conv.unreadCount,
      projectId: conv.projectId,
      createdAt: convMessages[0].createdAt,
    });

    messages.push(...convMessages);
  }

  return { conversations, messages };
}

// ============================================
// Seed Function
// ============================================

async function seedSMSConversations(): Promise<{
  conversationCount: number;
  messageCount: number;
}> {
  logSection('Seeding SMS Conversations & Messages');

  const { conversations, messages } = buildConversationsAndMessages();

  // Seed conversations
  logProgress(`Writing ${conversations.length} SMS conversations...`);

  await executeBatchWrites(
    db,
    conversations,
    (batch, conv) => {
      const ref = db.collection('smsConversations').doc(conv.id);
      batch.set(ref, {
        orgId: conv.orgId,
        phoneNumber: conv.phoneNumber,
        participantId: conv.participantId,
        participantType: conv.participantType,
        participantName: conv.participantName,
        lastMessageAt: toTimestamp(conv.lastMessageAt),
        lastMessagePreview: conv.lastMessagePreview,
        lastMessageDirection: conv.lastMessageDirection,
        unreadCount: conv.unreadCount,
        projectId: conv.projectId || null,
        createdAt: toTimestamp(conv.createdAt),
      });
    },
    'SMS Conversations'
  );

  logSuccess(`Created ${conversations.length} SMS conversations`);

  // Seed messages
  logProgress(`Writing ${messages.length} SMS messages...`);

  await executeBatchWrites(
    db,
    messages,
    (batch, msg) => {
      const ref = db.collection('smsMessages').doc(msg.id);
      batch.set(ref, {
        orgId: msg.orgId,
        to: msg.to,
        from: msg.from,
        body: msg.body,
        direction: msg.direction,
        status: msg.status,
        recipientId: msg.recipientId || null,
        recipientType: msg.recipientType || null,
        recipientName: msg.recipientName || null,
        projectId: msg.projectId || null,
        createdAt: toTimestamp(msg.createdAt),
        sentAt: msg.sentAt ? toTimestamp(msg.sentAt) : null,
        deliveredAt: msg.deliveredAt ? toTimestamp(msg.deliveredAt) : null,
        createdBy: msg.createdBy || null,
      });
    },
    'SMS Messages'
  );

  logSuccess(`Created ${messages.length} SMS messages`);

  // Summary breakdown
  const clientConvs = conversations.filter(c => c.participantType === 'client');
  const subConvs = conversations.filter(c => c.participantType === 'subcontractor');
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  logProgress(`  Client conversations: ${clientConvs.length}`);
  logProgress(`  Subcontractor conversations: ${subConvs.length}`);
  logProgress(`  Total unread messages: ${totalUnread}`);

  return {
    conversationCount: conversations.length,
    messageCount: messages.length,
  };
}

// ============================================
// Main Export
// ============================================

export { seedSMSConversations };

// Run if executed directly
if (require.main === module) {
  seedSMSConversations()
    .then(({ conversationCount, messageCount }) => {
      console.log(
        `\nCompleted: Created ${conversationCount} conversations with ${messageCount} messages`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding SMS conversations:', error);
      process.exit(1);
    });
}
