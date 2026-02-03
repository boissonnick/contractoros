# Subcontractor Customer Discovery Framework

> **Created:** 2026-02-03
> **Purpose:** Structured approach to validate Sub Edition product-market fit before building
> **Goal:** 30+ quality interviews, clear go/no-go decision criteria, pilot program design

---

## Executive Summary

This framework guides ContractorOS through rigorous customer discovery for the Sub Edition opportunity. Before investing development resources, we need to validate:

1. **Pain severity** — Are payment/compliance/multi-GC problems painful enough to pay for?
2. **Willingness to pay** — What price point works for smaller margins?
3. **Feature priorities** — What solves real problems vs. "nice to have"?
4. **Competitive gaps** — What are they using now, and what's missing?
5. **Channel viability** — Can we reach this market efficiently?

**Timeline:** 6-8 weeks to complete discovery with actionable decision criteria.

---

## Part 1: Target Persona Profiles

### Persona A: Solo Tradesperson (1-2 people)

| Attribute | Details |
|-----------|---------|
| **Company size** | Owner-operator + maybe 1 helper |
| **Annual revenue** | $150K - $400K |
| **Trades** | Often single trade: electrician, plumber, HVAC tech |
| **GC relationships** | 3-8 GCs they work with regularly |
| **Technology** | iPhone, basic accounting (Wave, QuickBooks Simple Start), paper/Excel |
| **Decision maker** | Owner makes all decisions, no budget approval needed |
| **Pain points** | Cash flow (waiting 60-90 days), tracking who owes what, keeping COI current |
| **Time available** | Very little — evenings, weekends, truck cab |
| **Price sensitivity** | High — every dollar matters |
| **Buying behavior** | Word of mouth, trade community recommendations |

**Key Insight:** Mobile-first is mandatory. They don't have time for desktop software. Price must be <$50/month or they won't consider it.

### Persona B: Small Crew Sub (3-10 employees)

| Attribute | Details |
|-----------|---------|
| **Company size** | Owner + 2-9 field workers |
| **Annual revenue** | $500K - $2M |
| **Trades** | May have 2-3 related trades (plumbing + fire suppression) |
| **GC relationships** | 5-15 GCs, maybe 2-3 "anchor" relationships |
| **Technology** | Smartphones, QuickBooks, maybe industry-specific (ServiceTitan for residential) |
| **Decision maker** | Owner, possibly with spouse/partner input |
| **Pain points** | Crew scheduling across sites, payroll complexity, compliance tracking, cash flow |
| **Time available** | Some admin time, but owner still works in field |
| **Price sensitivity** | Moderate — willing to pay for real value |
| **Buying behavior** | Trade shows, supply house relationships, peer recommendations |

**Key Insight:** This is the sweet spot. Big enough to have real complexity, small enough to not have dedicated admin staff. Most underserved.

### Persona C: Growing Sub (11-30 employees)

| Attribute | Details |
|-----------|---------|
| **Company size** | Owner/GM + project managers + crews |
| **Annual revenue** | $2M - $8M |
| **Trades** | Multi-trade capabilities common |
| **GC relationships** | 10-25 GCs, relationship management matters |
| **Technology** | QuickBooks/Sage, project management tools, some use BuildOps/ServiceTitan |
| **Decision maker** | Owner with input from office manager/controller |
| **Pain points** | Multi-project visibility, profitability by project/GC, cash flow forecasting |
| **Time available** | Has admin staff, but still lean |
| **Price sensitivity** | Lower — values ROI over price |
| **Buying behavior** | More formal evaluation, may want demo |

**Key Insight:** Closest to GC product needs. May already use competitive tools. Feature set matters more than price.

### Persona D: Trade-Specific Considerations

Different trades have unique needs that affect discovery:

| Trade | Unique Pain Points | Software Maturity | Price Tolerance |
|-------|-------------------|-------------------|-----------------|
| **Electrical** | Complex licensing by state, IBEW union reporting, permit tracking | Moderate | Higher |
| **Plumbing** | Material price volatility, call-back warranty tracking | Low | Moderate |
| **HVAC** | Maintenance contracts (recurring revenue), equipment tracking | High (ServiceTitan) | Higher |
| **Drywall** | High labor content, productivity tracking, punch list exposure | Very low | Lower |
| **Concrete/Masonry** | Weather delays, batch tracking, equipment logistics | Low | Moderate |
| **Roofing** | Safety compliance, material waste tracking, warranty management | Low | Moderate |

**Beachhead Recommendation:** Electrical contractors — large market, complex compliance, underserved by current solutions, willing to pay.

---

## Part 2: Interview Recruitment Strategy

### Target: 30-40 Quality Interviews

| Persona | Target # | Rationale |
|---------|----------|-----------|
| Solo (1-2) | 8-10 | Validate mobile-first, understand price sensitivity |
| Small Crew (3-10) | 12-15 | **Primary target** — most interviews here |
| Growing (11-30) | 6-8 | Validate feature depth, competitive landscape |
| Recently churned from competitor | 4-5 | Understand what doesn't work |

### Where to Find Subcontractors

#### Online Channels (Fastest)

| Channel | How to Use | Expected Response |
|---------|-----------|-------------------|
| **LinkedIn** | Search "[trade] contractor" + location, send connection + message | 5-10% response rate |
| **Trade-specific Facebook groups** | Join groups, observe pain point discussions, DM active members | 10-15% response rate |
| **Reddit r/electricians, r/HVAC, r/Plumbing** | Observe discussions, DM users who post about business problems | 5-8% response rate |
| **Nextdoor business posts** | Find local contractors, reach out directly | Variable |
| **Google Maps reviews** | Find highly-rated local subs, call directly | 10-20% answer rate |
| **Trade association directories** | NECA (electrical), PHCC (plumbing), SMACNA (sheet metal) | Membership lists available |

**LinkedIn Message Template:**
```
Hi [Name],

I'm building software specifically for subcontractors (not GCs) —
focused on the payment tracking and multi-GC headaches I keep
hearing about.

Would you have 30 minutes this week to tell me about your biggest
business challenges? I'm not selling anything — just doing research
and your perspective would be incredibly valuable.

Happy to send a $50 Amazon gift card as thanks for your time.

[Your name]
```

#### Offline Channels (Higher Quality)

| Channel | How to Access | Notes |
|---------|--------------|-------|
| **Supply houses** | Electrical/plumbing distributors are community hubs. Ask manager for introductions. | Offer to buy lunch for a group |
| **Trade association meetings** | NECA, IEC, ABC chapters have monthly meetings | Attend as "interested in serving contractors" |
| **Trade shows** | Regional construction/trade shows | Set up informal conversations |
| **Union halls** | IBEW, UA, SMART local chapters | Tread carefully — introduce through members |
| **GCs you know** | Ask current ContractorOS users for sub introductions | Warm referrals |
| **Permit offices** | Contractors pulling permits — catch them in line | Quick informal chats |

#### Warm Introductions (Highest Conversion)

1. **Ask existing ContractorOS GC users** to introduce you to their best subs
2. **Ask your contractor (6-month observation)** for referrals to other subs
3. **Your network** — LinkedIn post asking for introductions

### Incentive Strategy

| Incentive | When to Use | Cost |
|-----------|------------|------|
| **$50 Amazon gift card** | Standard for 45-60 min interview | $50 |
| **$100 Visa gift card** | For hard-to-reach personas or longer sessions | $100 |
| **Free pilot access** | For potential beta users | $0 (value exchange) |
| **Referral bonus** | $25 for introducing another qualified sub | $25 |
| **Lunch/coffee** | In-person interviews | $20-40 |

**Budget:** $2,500-3,500 for 30-40 interviews

### Screening Criteria

**Must-have for interview:**
- [ ] Works as subcontractor (not GC, not supplier)
- [ ] Works with multiple GCs (not captive to one)
- [ ] Has been in business 2+ years
- [ ] Has experienced payment delays in past 12 months
- [ ] Willing to discuss business challenges openly

**Disqualify if:**
- Only does residential work (ServiceTitan territory)
- Captive sub for single GC
- Just started business (no pain points yet)
- Not the decision maker for software purchases

### Screening Questions (Pre-Interview)

Ask these via email/message before scheduling:

1. How many employees do you have? (Target: 1-30)
2. How many different GCs did you work with last year? (Target: 3+)
3. What percentage of your work is commercial vs. residential? (Target: 50%+ commercial)
4. In the last year, have you had issues getting paid on time? (Target: Yes)
5. Who makes decisions about software and tools for your business? (Target: Them)

---

## Part 3: Interview Guide (45-60 minutes)

### Pre-Interview Prep

- Review their LinkedIn/website if available
- Note their trade and apparent company size
- Prepare trade-specific questions
- Test recording setup (with permission)
- Have notetaker if possible (or record)

### Interview Structure

```
Opening (5 min)
    ↓
Background/Context (10 min)
    ↓
Current Workflow Deep Dive (15 min)
    ↓
Pain Point Exploration (15 min)
    ↓
Feature Prioritization (5 min)
    ↓
Competitive/Alternatives (5 min)
    ↓
Pricing/Closing (5 min)
```

---

### Section 1: Opening (5 minutes)

**Goal:** Build rapport, set expectations, get permission to record.

**Script:**
> "Thanks so much for taking the time today. I really appreciate it.
>
> Quick background: I'm building software specifically for subcontractors — not for GCs to manage you, but for you to run your own business. Before I build anything, I want to make sure I understand what actually matters to people like you.
>
> This isn't a sales call. I'm here to learn from you. There are no wrong answers. I'm most interested in the challenges you face day-to-day.
>
> Do you mind if I record this? It's just so I can listen back and make sure I don't miss anything. The recording stays with me and won't be shared."

**Transition:**
> "Great. Let's start with some background on your business."

---

### Section 2: Background/Context (10 minutes)

**Goal:** Understand their business model, size, and context.

#### Questions:

1. **"Tell me about your business. What trade(s) do you focus on?"**
   - Listen for: specialization vs. generalist, commercial vs. residential mix

2. **"How many people work for you, including yourself?"**
   - Listen for: crew structure, office staff, growth trajectory

3. **"Roughly how many different GCs did you work with in the last 12 months?"**
   - Listen for: relationship concentration, loyalty patterns

4. **"What's your typical project size? Duration?"**
   - Listen for: commercial scale, project complexity

5. **"How did you get into this business?"**
   - Listen for: background, motivations, pride points

**Capture:** Company size, trade, revenue estimate, GC count, project types.

---

### Section 3: Current Workflow Deep Dive (15 minutes)

**Goal:** Understand how they run their business today, in detail.

#### Jobs-to-be-Done Questions:

1. **"Walk me through a typical week. How do you spend your time?"**
   - Listen for: time allocation, admin burden, field vs. office

2. **"When a GC reaches out about a new project, what happens next? Walk me through the whole process."**
   - Listen for: bidding process, communication, documentation

3. **"How do you track which jobs you're working on, what's due, who owes you money?"**
   - Listen for: tools used (or lack thereof), pain with current approach

4. **"When you finish a phase or milestone, what's the invoicing process like?"**
   - Listen for: billing complexity, GC requirements, delays

5. **"How do you handle scheduling crews when you have multiple jobs going?"**
   - Listen for: coordination challenges, communication tools

6. **"What about compliance stuff — insurance certificates, licenses, safety certs?"**
   - Listen for: tracking methods, expiration management, GC requirements

#### Tool Discovery:

7. **"What software or tools do you use to run your business today?"**
   - Probe: accounting, scheduling, communication, documentation
   - Listen for: satisfaction level, gaps, workarounds

8. **"If you could wave a magic wand and change one thing about how you manage the business side, what would it be?"**
   - Listen for: top pain point, unprompted priorities

**Capture:** Tools used, workflows, time spent on admin, coordination methods.

---

### Section 4: Pain Point Exploration (15 minutes)

**Goal:** Dig deep into specific pain points. Get stories, not generalizations.

#### Payment Pain Points:

1. **"Tell me about the last time you had trouble getting paid on a job."**
   - Follow up: "What happened? How long did it take? How did you handle it?"
   - Listen for: specific amounts, emotional impact, frequency

2. **"How long does it typically take to get paid after you invoice?"**
   - Listen for: DSO, variation by GC, cash flow impact

3. **"Have you ever had to file a lien or threaten legal action to get paid?"**
   - Listen for: frequency, knowledge of rights, outcomes

4. **"How do you decide which GCs to work with again vs. avoid?"**
   - Listen for: reputation importance, information sources

#### Multi-GC Management Pain:

5. **"What's the hardest part about working with multiple GCs at once?"**
   - Listen for: different requirements, tracking complexity

6. **"Do different GCs have different billing formats or compliance requirements?"**
   - Listen for: customization burden, time waste

7. **"How do you prioritize when two GCs need you at the same time?"**
   - Listen for: relationship management, conflict resolution

#### Compliance Pain:

8. **"Tell me about a time when a compliance issue caused a problem — expired insurance, missing cert, etc."**
   - Listen for: specific stories, consequences, frequency

9. **"How do you track what documents each GC needs and when they expire?"**
   - Listen for: methods, failures, time spent

#### Crew Management Pain:

10. **"When you have crews on multiple sites, what's the biggest challenge?"**
    - Listen for: communication, time tracking, productivity visibility

#### Quantify the Pain:

11. **"If you had to guess, how many hours per week do you spend on paperwork and admin vs. actual work?"**
    - Listen for: specific numbers, frustration level

12. **"What's the dollar impact of payment delays on your business? Rough estimate is fine."**
    - Listen for: specific amounts, interest costs, opportunity costs

**Capture:** Top 3 pain points ranked, specific stories, quantified impact.

---

### Section 5: Feature Prioritization (5 minutes)

**Goal:** Validate feature priorities from pain point discussion.

**Exercise:**
> "I'm going to read you a list of potential features. For each one, tell me if it's a 'Must Have,' 'Nice to Have,' or 'Don't Care' for your business."

| Feature | Must Have | Nice to Have | Don't Care |
|---------|-----------|--------------|------------|
| Dashboard showing all your projects across all GCs | | | |
| Track who owes you money and how long overdue | | | |
| Automatic reminders when insurance/certs expire | | | |
| Schedule crews across multiple job sites | | | |
| Time tracking with GPS verification | | | |
| See GC payment reputation before bidding | | | |
| Generate preliminary notices to protect lien rights | | | |
| Track profitability by project and by GC | | | |
| Mobile app to manage everything from the truck | | | |
| Automatic invoice reminders to GCs | | | |

**Follow-up:** "Looking at your 'Must Haves,' if you could only pick ONE, which would it be?"

**Capture:** Feature priority ranking, top "must have."

---

### Section 6: Competitive/Alternatives (5 minutes)

**Goal:** Understand current solutions and gaps.

1. **"Have you tried any software specifically designed for subcontractors?"**
   - If yes: "What was your experience? Why did you stop/keep using it?"
   - If no: "Why not? What's held you back?"

2. **"What do you use for accounting/invoicing today?"**
   - Listen for: QuickBooks, Wave, paper, Excel

3. **"Have you heard of [Siteline/BuildOps/Levelset/etc.]?"**
   - If yes: "What do you know about it? Have you tried it?"

4. **"If a GC uses software like Procore and invites you to their system, what's that experience like?"**
   - Listen for: frustration with GC-centric tools

5. **"What would make you switch from what you're using now?"**
   - Listen for: switching triggers, deal-breakers

**Capture:** Current tools, competitive awareness, switching criteria.

---

### Section 7: Pricing & Closing (5 minutes)

**Goal:** Understand willingness to pay and close strong.

#### Pricing Questions:

1. **"If a tool solved [their top pain point], what would that be worth to you per month?"**
   - Don't suggest a number first — let them anchor

2. **"Would you pay $79/month for software that [top 3 features]?"**
   - Watch their reaction. Silence or hesitation is data.

3. **"What's the maximum you'd pay per month for business software? Minimum?"**
   - Listen for: range, reasoning

4. **"How do you typically decide to try new software? Free trial? Demo? Recommendation?"**
   - Listen for: buying process

#### Pilot Interest:

5. **"If I built this, would you be interested in being an early tester? You'd get free access in exchange for feedback."**
   - Listen for: enthusiasm level, conditions

#### Referrals:

6. **"Do you know any other subcontractors who have similar challenges who might be willing to talk to me?"**
   - Ask for 2-3 names/contacts

#### Closing:

> "This has been incredibly helpful. Thank you for being so open about your business. I'll send your gift card within 24 hours. If I have quick follow-up questions, would you be open to a 10-minute call?"

**Capture:** Price anchor, willingness to pay, pilot interest, referrals.

---

## Part 4: Specific Questions Bank

### Open-Ended Discovery Questions

**Business Model:**
- "How do you find new GCs to work with?"
- "What makes a good GC relationship vs. a bad one?"
- "How has your business changed in the last 2-3 years?"

**Workflow:**
- "What does a typical Monday morning look like for you?"
- "When things go wrong on a job, what usually causes it?"
- "How do you decide how to price a job?"

**Pain Points:**
- "What wakes you up at 3 AM worrying about the business?"
- "If you could hire someone to handle one task, what would it be?"
- "What's the most frustrating part of running this business?"

### "Tell Me About the Last Time..." Questions

These elicit specific stories rather than generalizations:

- "Tell me about the last time you had a cash flow crunch."
- "Tell me about the last time a GC screwed you on payment."
- "Tell me about the last time you missed a deadline because of a compliance issue."
- "Tell me about the last time you had a scheduling conflict between jobs."
- "Tell me about the last time you lost money on a project."
- "Tell me about the last time you had to turn down work."

### Quantitative Questions

**Business Metrics:**
- "How many active projects do you typically have at once?"
- "What's your average project value?"
- "What percentage of your revenue comes from your top 3 GCs?"
- "How many employees do you have? W-2 vs. 1099?"

**Pain Quantification:**
- "In the last year, roughly how much money was late by 30+ days?"
- "How many hours per week do you spend on admin/paperwork?"
- "How many different GC compliance systems do you have to log into?"
- "What's your average DSO (days sales outstanding)?"

**Technology:**
- "How much do you currently spend per month on business software?"
- "What percentage of your work is done on your phone vs. computer?"
- "How often do you check email during the workday?"

### Jobs-to-be-Done Framing

Frame questions around the job they're trying to accomplish:

| Job to Be Done | Discovery Question |
|----------------|-------------------|
| Get paid faster | "When you need to accelerate a payment, what do you do?" |
| Know what's owed | "How do you know, right now, who owes you money and how much?" |
| Stay compliant | "How do you make sure you never miss an insurance renewal?" |
| Win more bids | "How do you decide which projects to bid on?" |
| Schedule crews | "How do you decide who works where tomorrow?" |
| Track profitability | "How do you know if a job made money or lost money?" |
| Build GC relationships | "How do you become a GC's 'go-to' sub for your trade?" |

### Red Flag Questions

Questions that reveal if they're NOT a good target customer:

- "Are you planning to grow, stay the same size, or wind down?"
  - (Wind down = not a customer)

- "Do you do mostly residential or commercial work?"
  - (100% residential = ServiceTitan territory)

- "Do you work exclusively with one GC or many?"
  - (Captive sub = different needs)

- "Who handles the business side — you or someone else?"
  - (Not decision maker = limited value)

---

## Part 5: Analysis Framework

### Interview Debrief Template

Complete within 24 hours of each interview:

```
INTERVIEW DEBRIEF
================
Date:
Interviewee:
Company:
Trade:
Size: employees, $revenue
GC relationships:

TOP 3 PAIN POINTS (ranked):
1.
2.
3.

KEY QUOTES:
- "..."
- "..."

CURRENT TOOLS:
- Accounting:
- Scheduling:
- Communication:
- Other:

FEATURE PRIORITIES (from exercise):
Must Have:
Nice to Have:
Don't Care:

PRICE SENSITIVITY:
- Anchored at: $
- Reaction to $79:
- Max willing to pay: $

PILOT INTEREST: Yes/No/Maybe
REFERRALS PROVIDED:

OVERALL FIT SCORE: 1-5 (5 = ideal target customer)
NOTES:
```

### Pattern Synthesis

After every 10 interviews, conduct synthesis:

#### Pain Point Frequency Matrix

| Pain Point | Persona A (Solo) | Persona B (Small Crew) | Persona C (Growing) | Total |
|------------|------------------|------------------------|---------------------|-------|
| Payment delays | | | | |
| Cash flow unpredictability | | | | |
| Multi-GC tracking | | | | |
| Compliance management | | | | |
| Crew scheduling | | | | |
| Time tracking | | | | |
| GC reputation visibility | | | | |
| Lien rights management | | | | |
| Profitability tracking | | | | |

#### Feature Priority Rollup

| Feature | Must Have % | Nice to Have % | Don't Care % |
|---------|-------------|----------------|--------------|
| Multi-GC dashboard | | | |
| Payment tracking | | | |
| COI management | | | |
| Crew scheduling | | | |
| Time tracking | | | |
| GC reputation | | | |
| Lien automation | | | |
| Profitability analytics | | | |
| Mobile app | | | |

#### Price Sensitivity Analysis

| Price Point | "Too cheap" | "Good value" | "Expensive" | "Too expensive" |
|-------------|-------------|--------------|-------------|-----------------|
| $29/mo | | | | |
| $49/mo | | | | |
| $79/mo | | | | |
| $99/mo | | | | |
| $149/mo | | | | |

### Product-Market Fit Signals

**Strong Positive Signals (Green Lights):**

| Signal | Evidence Threshold |
|--------|-------------------|
| **Pain is visceral** | 80%+ mention payment pain unprompted |
| **Hair on fire problem** | 50%+ have specific, recent stories with dollar amounts |
| **Would pay today** | 60%+ say yes to pilot or purchase intent |
| **Word of mouth potential** | 80%+ would tell other subs if it worked |
| **Clear "must have" feature** | One feature dominates with 70%+ must have |
| **No acceptable solution** | 80%+ unhappy with current tools |

**Caution Signals (Yellow Lights):**

| Signal | What It Means |
|--------|---------------|
| **Pain is acknowledged but not urgent** | May need to create urgency through marketing |
| **Price resistance at target price** | May need different pricing model or tier |
| **Feature fragmentation** | No clear "must have" = hard to position |
| **GC platform lock-in** | Subs forced to use GC tools may resist another |
| **Trade-specific variation** | May need to narrow focus to one trade |

**Negative Signals (Red Lights):**

| Signal | What It Means |
|--------|---------------|
| **"That would be nice but..." responses** | Not a burning need |
| **0% pilot interest** | Product not solving real problem |
| **Widespread satisfaction with Excel/paper** | No desire to change |
| **Price anchor below $20/mo** | Economics don't work |
| **Decision complexity** | "I'd have to ask my [spouse/partner/accountant]" |

### Competitive Analysis Summary

| Competitor | Awareness % | Usage % | Satisfaction | Key Gap |
|------------|-------------|---------|--------------|---------|
| Procore (as invited sub) | | | | |
| BuildOps | | | | |
| Siteline | | | | |
| ServiceTitan | | | | |
| QuickBooks | | | | |
| Excel/Paper | | | | |

### Decision Criteria

#### GO Decision (Launch Pilot)

Proceed to pilot if ALL of these are true:

- [ ] **Problem validated:** 80%+ cite payment/cash flow as top-3 pain
- [ ] **Pain quantified:** Average delayed payment impact >$50K/year
- [ ] **Feature clarity:** One feature has 70%+ "must have" rating
- [ ] **Price viable:** 60%+ comfortable with $49-79/mo price range
- [ ] **Pilot interest:** 20+ qualified subs interested in early access
- [ ] **Competitive gap:** Clear differentiation from existing solutions
- [ ] **Channel identified:** At least one viable acquisition channel

#### NO-GO Decision (Pivot or Abandon)

Stop or significantly pivot if ANY of these are true:

- [ ] **No burning pain:** <50% cite problem unprompted
- [ ] **Too fragmented:** No clear feature priority emerges
- [ ] **Price floor too low:** 70%+ anchor below $30/mo
- [ ] **Competitive satisfaction:** >50% happy with current solution
- [ ] **Wrong persona:** Primary pain in segment we can't serve
- [ ] **Channel blocked:** No viable path to reach customers

#### PIVOT Decision (Adjust Strategy)

Adjust approach if:

- [ ] **Pain exists but different:** E.g., scheduling > payments
- [ ] **Different persona:** E.g., growing subs (11-30) > small crew
- [ ] **Different trade:** E.g., HVAC > electrical as beachhead
- [ ] **Different feature focus:** E.g., compliance > payments as lead
- [ ] **Different pricing model:** E.g., per-project vs. subscription

---

## Part 6: Pilot Program Design

### Pilot Structure

| Element | Specification |
|---------|---------------|
| **Duration** | 90 days |
| **Pilot size** | 25-50 subs |
| **Composition** | 60% small crew (3-10), 30% solo, 10% growing |
| **Trade focus** | 80% primary trade (electrical), 20% adjacent |
| **Geographic** | 2-3 metros for support feasibility |
| **Price** | Free (value exchange for feedback) |

### Pilot Entry Criteria

Subs must:
- [ ] Complete onboarding call (30 min)
- [ ] Connect at least 2 active GC relationships
- [ ] Have at least 1 outstanding invoice to track
- [ ] Commit to weekly 15-min feedback calls for first month
- [ ] Agree to be referenced/quoted (with approval)

### Pilot MVP Feature Set

Based on discovery (adjust after analysis):

**Wave 1 (Day 1):**
- Multi-GC project dashboard
- Basic payment tracking (who owes, how much, how long)
- COI expiration tracking with alerts
- Mobile-first interface

**Wave 2 (Day 30):**
- Invoice reminder automation
- GC payment history (within pilot cohort)
- Crew scheduling (basic calendar)

**Wave 3 (Day 60):**
- Lien notice generation (state-specific)
- Time tracking with project allocation
- Basic profitability view

### Pilot Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Activation** | 80%+ complete onboarding | Connected GCs + first invoice tracked |
| **Weekly active** | 70%+ | Logged in 4+ days in last 7 |
| **Core action** | 60%+ | Tracked payment or sent reminder |
| **NPS** | 50+ | Survey at day 30, 60, 90 |
| **Would pay** | 60%+ | "Would you pay $79/mo?" at day 60 |
| **Referral** | 40%+ | Would recommend to peer |
| **Retention intent** | 70%+ | "Would you keep using after pilot?" |

### Pilot Feedback Cadence

| Touchpoint | Timing | Method | Focus |
|------------|--------|--------|-------|
| **Onboarding call** | Day 0 | Video call, 30 min | Setup, expectations |
| **Week 1 check-in** | Day 7 | Video call, 15 min | First impressions, blockers |
| **Week 2-4 calls** | Weekly | Video call, 15 min | Usage, feedback, bugs |
| **Day 30 survey** | Day 30 | Survey + call | NPS, feature satisfaction |
| **Month 2 calls** | Bi-weekly | Video call, 15 min | Deep usage patterns |
| **Day 60 survey** | Day 60 | Survey + call | Payment intent, feature priority |
| **Exit interview** | Day 90 | Video call, 30 min | Comprehensive review |

### Pilot Data Collection

Track automatically:
- Login frequency and duration
- Features used (heat map)
- Actions taken (invoices tracked, reminders sent, etc.)
- Mobile vs. desktop usage
- Support tickets submitted

Collect via surveys:
- Feature satisfaction (1-5 scale per feature)
- Missing features (open-ended)
- Bugs/issues encountered
- Competitive comparison
- Willingness to pay (price laddering)

### Pilot-to-Paid Conversion

**Day 75:** Announce pricing for post-pilot
- Pilot users get 50% off first 6 months
- Annual option with 2 months free

**Day 85:** Payment collection begins
- Credit card required to continue
- Grace period of 15 days

**Day 90:** Pilot ends
- Non-converters off-boarded with data export
- Converters become paying customers
- Case studies from top users

### Post-Pilot Decision Framework

| Outcome | Criteria | Action |
|---------|----------|--------|
| **Launch** | NPS 50+, 60%+ convert to paid, retention 70%+ | Full product launch |
| **Iterate** | NPS 30-50, 40-60% convert, clear feature gaps | Additional pilot cycle |
| **Pivot** | NPS <30, <40% convert, fundamental issues | Revisit positioning/features |
| **Kill** | <20% activation, universal dissatisfaction | Abandon Sub Edition |

---

## Appendix A: Outreach Templates

### LinkedIn Connection Request
```
Hi [Name] - I'm researching how subcontractors manage the business
side of things (payments, compliance, scheduling). Would love to
hear about your experience if you have 30 min. Happy to compensate
your time. Thanks! - [Your name]
```

### LinkedIn Follow-Up Message
```
Thanks for connecting, [Name]!

I'm building software specifically for subs - not another GC tool
that treats you as secondary. Before I build anything, I want to
make sure I understand what actually matters.

Would you have 30-45 minutes this week for a call? I'll send a
$50 Amazon gift card as thanks for your time. No sales pitch -
just research.

What day works best?
```

### Cold Email (if you have email)
```
Subject: Quick question about running your [trade] business

Hi [Name],

I found your company through [source] and I'm reaching out because
I'm researching the challenges subcontractors face running their
businesses.

I'm not selling anything - I'm trying to understand problems before
I build solutions. I keep hearing about payment delays and
compliance headaches, but I want to hear directly from people like you.

Would you have 30 minutes for a call this week? I'll send a $50
Amazon gift card as thanks for your time.

If you're interested, just reply and I'll send some time options.

Thanks,
[Your name]

P.S. If this isn't your thing, no worries - just delete this email.
```

### Referral Request (Post-Interview)
```
Subject: Quick favor - know any other subs I should talk to?

Hi [Name],

Thanks again for the conversation last week - it was incredibly
helpful.

Quick favor: do you know 2-3 other subcontractors who might be
willing to share their perspective? Doesn't have to be [same trade] -
any trade works.

If you're comfortable sharing their contact info (or introducing via
email), I'd really appreciate it. Same deal for them - $50 gift card
for their time.

Thanks!
[Your name]
```

---

## Appendix B: Interview Logistics

### Recording Setup

**Zoom/Google Meet:**
1. Get verbal permission at start
2. Use Zoom's built-in recording or Grain/Otter.ai
3. Ensure backup (voice memo on phone)

**Phone Calls:**
1. Get verbal permission
2. Use Rev Call Recorder or similar
3. Or speakerphone + voice memo

### Note-Taking System

**During interview:**
- Timestamp key quotes
- Note emotional reactions (frustration, enthusiasm)
- Mark unexpected insights with "!"
- Mark areas to probe deeper with "?"

**After interview:**
- Complete debrief template within 24 hours
- Tag interview with key themes
- Add to master synthesis spreadsheet

### Scheduling

- Use Calendly or Cal.com for self-scheduling
- Offer early morning (6-7am before jobsite) or evening (5-7pm)
- Be flexible - these are busy people
- Send reminder 24 hours and 1 hour before
- Have backup contact method (phone) if they no-show

---

## Appendix C: Synthesis Spreadsheet Template

Create a Google Sheet with these tabs:

### Tab 1: Interview Log
| Date | Name | Company | Trade | Size | Revenue Est | GC Count | Pilot Interest | Referrals |

### Tab 2: Pain Points
| Interviewee | Pain 1 | Pain 2 | Pain 3 | Key Quote | Quantified Impact |

### Tab 3: Feature Priority
| Interviewee | Must Have 1 | Must Have 2 | Must Have 3 | Nice to Have | Don't Care |

### Tab 4: Pricing
| Interviewee | Price Anchor | Reaction to $79 | Max WTP | Current Software Spend |

### Tab 5: Tools
| Interviewee | Accounting | Scheduling | Communication | Industry-Specific | Satisfaction |

### Tab 6: Themes
| Theme | Count | Representative Quotes | Implications |

---

## Appendix D: Timeline

### Week 1-2: Setup & Initial Outreach
- [ ] Finalize screening criteria
- [ ] Set up scheduling system (Calendly)
- [ ] Create recording/transcription workflow
- [ ] Send 50 LinkedIn connection requests
- [ ] Post in 3 trade Facebook groups
- [ ] Contact 5 supply houses for introductions
- [ ] Schedule first 5-10 interviews

### Week 3-4: Primary Interview Phase
- [ ] Conduct 15-20 interviews
- [ ] Complete debriefs within 24 hours
- [ ] Conduct first synthesis (after 10)
- [ ] Adjust questions based on patterns
- [ ] Request referrals actively

### Week 5-6: Deep Dive Phase
- [ ] Conduct remaining 10-15 interviews
- [ ] Focus on personas with strongest signals
- [ ] Conduct second synthesis (after 25)
- [ ] Begin competitive deep-dive research
- [ ] Identify pilot candidates

### Week 7: Analysis & Decision
- [ ] Complete full synthesis
- [ ] Score against go/no-go criteria
- [ ] Draft findings presentation
- [ ] Make recommendation
- [ ] If GO: Begin pilot recruitment

### Week 8: Pilot Preparation (if GO)
- [ ] Finalize pilot participant list
- [ ] Define MVP feature set
- [ ] Create onboarding materials
- [ ] Set up feedback systems
- [ ] Schedule kickoff calls

---

## Quick Start Checklist

**To start this week:**

- [ ] Create LinkedIn search for "[electrical/plumbing/HVAC] contractor" in [your city]
- [ ] Send 20 connection requests with personalized notes
- [ ] Join 3 trade-specific Facebook groups and observe discussions
- [ ] Ask your contractor contact for 3 sub referrals
- [ ] Set up Calendly with morning/evening availability
- [ ] Order $500 in Amazon gift cards
- [ ] Test recording setup (Zoom + voice memo backup)
- [ ] Print this guide and have it ready for first interview

**First interview goal:** Book by end of week 1.

---

*Last Updated: 2026-02-03*
