# Marketing & Review Management Research

**Author:** Claude Code (Research Agent)
**Date:** 2026-02-03
**Status:** Complete
**Sprint:** 40
**Module:** Reviews & Marketing

---

## Executive Summary

This document evaluates review platforms, review management tools, and marketing features for contractors using ContractorOS. The review ecosystem is critical for contractor success - **69% of customers leave reviews when prompted**, and displaying reviews can increase conversions by up to **270%**.

### Key Recommendations

1. **Google Business Profile** is the #1 priority platform (70%+ of contractor reviews happen here)
2. **NiceJob** recommended as MVP integration partner ($75/month, simple API, contractor-focused)
3. **SMS + Email dual-channel** review requests maximize response rates (98% SMS open rate vs 20-28% email)
4. **24-48 hour window** after project completion is optimal timing for review requests
5. **Build in-house first** for portfolio/before-after photos (aligns with existing photo features)
6. **FTC Compliance** is mandatory - new Consumer Review Rule actively enforced since late 2025

---

## Part 1: Review Platform API Comparison

### Platform Summary Matrix

| Platform | API Available | Auth Method | Reviews Access | Reply Capability | Cost | Priority |
|----------|--------------|-------------|----------------|------------------|------|----------|
| **Google Business Profile** | Yes (Official) | OAuth 2.0 | Full (own business) | Yes | Free | **P0** |
| **Facebook** | Yes (Graph API) | OAuth 2.0 | Full (own page) | Yes | Free | **P1** |
| **Yelp** | Yes (Fusion API) | API Key | 3-7 per business | Partner only | $9.99/1000 calls | **P2** |
| **Houzz** | No (3rd party only) | N/A | Scraping only | No | N/A | **P3** |
| **Angi/HomeAdvisor** | Limited | Email request | Leads API only | No | N/A | **P4** |
| **BBB** | Yes (Limited) | API Key | Yes | Accredited only | Free | **P3** |
| **Nextdoor** | No (3rd party only) | N/A | Scraping only | No | N/A | **P4** |

### Detailed Platform Analysis

#### Google Business Profile API

**Why Critical:** Most contractor leads start with "contractor near me" search. 87% of consumers check Google reviews before hiring.

**API Capabilities:**
- **Read Reviews:** Fetch all reviews from your verified business profile in real-time
- **Reply to Reviews:** Programmatically post replies without logging into Google
- **Review Metadata:** Rating (1-5), text, reviewer name, date, language, review ID
- **Filtering:** By rating, keyword, or date for easy tracking

**Technical Requirements:**
- OAuth 2.0 credentials (registered Google Cloud project)
- Business must be verified on Google
- Owner or Manager access required (Site Manager cannot use API)
- G Suite administrator must enable necessary services for reply functionality

**Limitations:**
- Cannot create or delete customer reviews
- Cannot edit review content or ratings
- Cannot access personal reviewer data (emails, phones)
- 300 queries per minute rate limit

**Cost:** The Business Profile API is **free** - no billing, no per-request costs.

**Sources:**
- [Google Business Profile API Documentation](https://developers.google.com/my-business/content/review-data)
- [Google My Business API Reference](https://developers.google.com/my-business/reference/rest)

---

#### Facebook Graph API (Reviews/Recommendations)

**Why Important:** 45% of consumers check Facebook before hiring. Strong social proof value.

**API Capabilities:**
- Read reviews/recommendations from business pages
- Respond to reviews programmatically
- Access review metadata (date, rating/recommendation status, text)

**Important Change:** Facebook no longer uses star ratings. Places are now either "recommended" or "not recommended" (field: `recommends_rating`).

**Technical Requirements:**
- Facebook Developer account
- Verified business
- OAuth 2.0 with app review
- Page access token

**Limitations:**
- Graph API returns reviewer comments and timestamps
- Privacy policy restricts: reviewer name and profile picture require explicit user permission
- App review process required before going live
- Does not support external research or competitor analysis

**Third-Party Options:**
- [Ayrshare Reviews API](https://www.ayrshare.com/reviews-api-review-management-with-an-api/) - Streamlines management across Facebook and Google
- [Apify Facebook Reviews Scraper](https://apify.com/apify/facebook-reviews-scraper) - For data collection

**Cost:** Free with Facebook Developer account

**Sources:**
- [Facebook API Guide](https://elfsight.com/blog/how-to-get-and-use-facebook-api/)
- [Facebook Reviews API Documentation](https://wextractor.com/facebook)

---

#### Yelp Fusion API

**API Capabilities:**
- Business search and lookup
- Reviews endpoint: Up to 3 reviews per business (Plus), up to 7 (Enterprise)
- First 160 characters of each review only
- No review response capability in basic API

**Pricing Tiers:**
| Plan | Cost | Reviews per Business | Notes |
|------|------|---------------------|-------|
| Starter | Free (5,000 calls trial) | Error on reviews endpoint | Search only |
| Plus | $9.99/1000 calls | Up to 3 reviews | 160 char limit |
| Enterprise | Custom | Up to 7 reviews | Full access |

**Recent Updates (2025-2026):**
- AI-powered assistant for connecting users with contractors
- Yelp Fusion MCP Server available for developers
- Integration with Apple Maps for "Request a Quote" button
- AI-powered summaries for job information

**Technical Requirements:**
- Yelp user account for API credentials
- 30-day free trial available

**Limitations:**
- Review text limited to 160 characters
- Starter tier cannot access reviews endpoint
- No reply capability in standard API

**Sources:**
- [Yelp Fusion API Documentation](https://docs.developer.yelp.com/docs/places-intro)
- [Yelp Business Reviews Endpoint](https://www.yelp.com/developers/documentation/v3/business_reviews)
- [Yelp API Pricing](https://business.yelp.com/data/products/places-api/)

---

#### Houzz

**Platform Overview:** 70M+ homeowners, 3M+ construction/design professionals, 40M monthly active users worldwide.

**API Status:** No official public API available. Users have requested "API access should be added so that you can integrate external catalogs."

**Third-Party Options:**
- [Apify Houzz Scraper](https://apify.com/scrapingxpert/houzz/api) - Extract profiles, reviews, project info
- [Zembra Houzz Reviews API](https://zembratech.com/supported-platforms/houzz-reviews-api-2/) - Real-time insights
- [Local Data Exchange](https://www.localdataexchange.com/Houzz-Business-Reviews/) - Business reviews API

**Recommendation:** Guide users to maintain Houzz profile separately. Consider Houzz Pro integration for portfolio features.

**Sources:**
- [Houzz Pro Reviews 2026](https://www.capterra.com/p/199689/Houzz-Pro/reviews/)
- [Houzz API Integration Services](https://constacloud.com/houzz-api-integration-services.html)

---

#### Angi/HomeAdvisor

**Platform Overview:** Both owned by IAC (ANGI Homeservices). Combined in 2017.

**API Availability:**
- Limited CRM integration via email request to `crmintegrations@homeadvisor.com`
- No public review API
- Leads API available for CRM systems

**Contractor Sentiment:** Generally negative
- Leads shared with 4-6 competitors simultaneously
- $15-$100 per lead (paid even if no conversion)
- Same lead sold to both Angi and HomeAdvisor subscribers
- Difficulty responding to bad reviews due to Angi's unbiased posting policy

**Rating System:**
- HomeAdvisor: 1-5 stars
- Angi: A-F letter grades (reward system for contractors)

**Recommendation:** **Do NOT build integration** - controversial value prop, poor contractor ROI, no review API

**Sources:**
- [HomeAdvisor vs Angi Comparison](https://www.housecallpro.com/resources/homeadvisor-vs-angi-full-comparison-which-is-the-better-lead-generation-service/)
- [Angi Reviews on ReviewTrackers](https://www.reviewtrackers.com/blog/angi-home-services/)

---

#### Better Business Bureau (BBB)

**API Availability:** Official API at [developer.bbb.org](https://developer.bbb.org/)

**API Endpoints:**
1. Organization Search - Search for businesses/charities known to BBB
2. Organization Collections - For partners to manage collections
3. Bulk Retrieval - Bulk data transfer
4. Push Notifications - Updates on records
5. Investigation/Application - Submit organizations for BBB investigation

**Review Access:** Available for accredited and non-accredited businesses

**Most Popular Industry:** Home improvement (contractors, plumbers, electricians)

**Third-Party Options:**
- [Zembra BBB Reviews API](https://zembratech.com/supported-platforms/better-business-bureau-reviews-api/) - Real-time review collection
- [Local Data Exchange BBB API](https://www.localdataexchange.com/better-business-bureau-bbb-business-reviews/)

**Sources:**
- [BBB API Developer Portal](https://developer.bbb.org/)
- [BBB Business Profiles](https://www.bbb.org/)

---

#### Nextdoor

**Platform Overview:** Hyper-local social network. Top categories: auto mechanics, roofers, plumbers, HVAC, electricians, general contractors.

**API Status:** No official API. Third-party scraping available.

**Third-Party Options:**
- [Apify Nextdoor Business Scraper](https://apify.com/scraped/nextdoor-business-scraper/api) - Scrape recommendations and neighborhood posts

**Contractor Experience:**
- One contractor reported ~$25k in business from Nextdoor in a year
- Better caliber referrals than Angie's List (actual neighbors recommending)
- Some contractors report "lowest bidder types" and hassle with free quotes

**Recommendation:** Lower priority - recommend users maintain presence manually. Reviews work more like "recommendations" than formal reviews.

**Sources:**
- [Nextdoor Business Reviews](https://www.signpost.com/blog/nextdoor-business-reviews/)
- [Get Recommendations as a Business](https://help.nextdoor.com/s/article/recommendations-faq?language=en_US)

---

## Part 2: Review Management Tool Comparison

### Tool Comparison Matrix

| Tool | Starting Price | Locations | Review Sites | SMS | AI Replies | API | Contract |
|------|---------------|-----------|--------------|-----|------------|-----|----------|
| **NiceJob** | $75/mo | Unlimited | 15+ | Yes | Yes | Yes | Monthly |
| **GatherUp** | $99/mo | 1 | 150+ | Yes | Yes | Yes | Monthly |
| **Podium** | $399/mo | 2 | 50+ | Yes | Yes | Yes | Annual |
| **Birdeye** | $299/mo | 1 | 150+ | Yes | Yes | Yes | Annual |
| **Grade.us** | $110/mo | 1 | Major sites | Yes | No | Yes | Monthly |

### Detailed Tool Analysis

#### NiceJob - **Recommended for MVP**

**Overview:** Purpose-built reputation marketing for home services contractors.

**Pricing:**
- Reviews Plan: $75/month
- Pro Plan: $125/month (adds AI replies, competitor insights, Get Repeats campaigns)
- NiceJob Sites: $99/month + $199 setup fee

**Key Features:**
- Automated review requests via email and SMS
- Intelligent review funnel (filters negative reviews)
- Social proof widgets for websites
- Automated social media sharing
- AI-generated review replies (Pro plan)
- 1,000+ app integrations via Zapier
- NPS scoring

**Integrations:** QuickBooks, HubSpot, Clio, Housecall Pro, Jobber

**Pros:**
- Lowest cost entry point for contractors
- 14-day free trial, no contracts
- Purpose-built for home services
- Simple 2-click review request automation

**Cons:**
- Limited template customization
- Basic analytics (no advanced reporting)
- Automation lacks conditional logic

**Sources:**
- [NiceJob Pricing](https://get.nicejob.com/pricing)
- [NiceJob Review 2026](https://research.com/software/reviews/nicejob)
- [NiceJob G2 Reviews](https://www.g2.com/products/nicejob/reviews)

---

#### GatherUp - **Recommended for Growth Stage**

**Overview:** Cloud-based customer feedback management with strong multi-location support.

**Pricing:**
| Locations | Monthly per Location | Total |
|-----------|---------------------|-------|
| 1 | $99 | $99 |
| 5 | $60 | $300 |
| 11+ | $45 | $495+ |

SMS marketing add-on: $10/month per location

**Key Features:**
- API access for custom integrations
- Review response templates
- Visual feedback widgets (embeddable)
- Survey logic and branching
- Multi-channel feedback (email, SMS, web forms)
- Net Promoter Score (NPS) tracking
- White-label available for agencies
- AI-generated review responses

**Integrations:** Zapier, Constant Contact, Mailchimp, Trustpilot, Toast POS, QuickBooks

**Pros:**
- Strong API for custom integrations
- 150+ review site monitoring
- White-label options
- 14-day free trial, no credit card required

**Cons:**
- Outdated UI according to some users
- Limited template customization
- Basic reporting tools
- Price has increased steadily
- Support quality has decreased per some reviews

**Sources:**
- [GatherUp Pricing](https://gatherup.com/pricing/)
- [GatherUp Review 2026](https://research.com/software/reviews/gatherup)
- [GatherUp Features](https://gatherup.com/solutions/)

---

#### Podium

**Overview:** SMS-first customer communication and review platform.

**Pricing:**
| Plan | Price | Locations | Features |
|------|-------|-----------|----------|
| Core | $399/mo | Up to 2 | Messaging, basic reviews, 250 bulk messages/mo |
| Pro | $599/mo | Up to 5 | AI features, advanced automation, analytics |
| Signature | Custom | Unlimited | Enterprise features |

**Key Features:**
- Unified inbox (SMS, Facebook, Google My Business)
- 2-click Google review process
- Video chat via SMS links (no customer download needed)
- Payment collection via text
- AI-drafted review responses
- 200+ custom-built integrations by industry
- Webchat with AI Concierge

**Industry Breakdown:** Automotive (23% of users), Healthcare, Home Services, Retail

**Use Cases:** Review management (41% of reviewers cite this as primary use)

**Pros:**
- Industry-leading SMS platform
- Video chat without app downloads
- Strong integration ecosystem
- AI-powered lead conversion

**Cons:**
- High price point ($399+ starting)
- Annual contracts required
- Many features are expensive add-ons (AI responses, high-volume messaging)
- Bugs and mobile app issues reported
- Limited bulk messages on lower tiers

**Sources:**
- [Podium Pricing 2026](https://www.socialpilot.co/reviews/blogs/podium-pricing)
- [Podium Reviews G2](https://www.g2.com/products/podium/reviews)
- [Podium Features](https://www.capterra.com/p/164285/Podium/)

---

#### Birdeye

**Overview:** Enterprise-grade reputation management with AI-powered tools.

**Pricing:**
- Standard: $349/month ($299/mo annual)
- Professional: $449/month (adds chatbot feature)
- ~$3,600/year for single brand review management

**Key Features:**
- Review aggregation from 150+ platforms
- Real-time reputation monitoring
- AI-powered review response automation
- Unified inbox (text, social, web chat, email)
- Webchat and chatbots
- 3,000+ integrations (Salesforce, HubSpot)
- Digital payment collection
- Social media management (Birdeye Social)
- Multi-location bulk publishing

**Ratings:** 4.7/5 stars on Software Advice (FrontRunners list)

**Pros:**
- Most comprehensive feature set
- 30-day free trial, no credit card
- Strong customer support
- 150+ review sites monitored
- AI automation reduces staff workload

**Cons:**
- High cost, especially for small businesses
- Advanced features require higher tiers
- Aggressive contract terms, auto-renewals
- Complex for small teams
- Difficult cancellations reported

**Sources:**
- [Birdeye Pricing](https://birdeye.com/pricing/)
- [Birdeye Review 2026](https://research.com/software/reviews/birdeye-review)
- [How Much Does Birdeye Cost](https://www.reviewflowz.com/blog/how-much-does-birdeye-really-cost)

---

#### Grade.us

**Overview:** White-label review management platform for agencies and marketers.

**Pricing:**
| Plan | Price | Seats/Profiles | Target |
|------|-------|----------------|--------|
| Solo | $110/mo | 1 seat | Single location owners |
| Professional | $180/mo ($162 annual) | 3 profiles | Marketers, consultants |
| Agency | $400/mo ($360 annual) | 10 seats | Local agencies, SEOs |
| Partner | $2,500/mo ($2,250 annual) | 100 seats | Large agencies, franchises |

White Label Basic: Free on all plans (except dashboard)
White Label Premium: Agency plan and higher ($440/year or free at 100 seats)

**Key Features:**
- Automated review acquisition via email/SMS
- Drip campaigns for review requests
- Review publishing to social media
- WordPress integration
- Campaign performance tracking (CTR, conversion)
- Fully white-labeled (including domain)
- Integrations: Mailchimp, Salesforce, ActiveCampaign, HubSpot, QuickBooks

**Ratings:** 4.6/5 value for money, 4.7/5 ease of use

**Pros:**
- Strong white-label capabilities
- 14-day free trial, no credit card
- Monthly contracts (no long-term lock-in)
- Unique referral domain option

**Cons:**
- Higher entry price than NiceJob
- No AI-powered replies
- Less contractor-specific features

**Sources:**
- [Grade.us Pricing](https://www.grade.us/home/plans/)
- [Grade.us Homepage](https://www.grade.us/home/)
- [Grade.us G2 Reviews](https://www.g2.com/products/grade-us/reviews)

---

### Integration Recommendation Matrix

| ContractorOS Tier | Recommended Tool | Integration Method | Rationale |
|-------------------|------------------|-------------------|-----------|
| **Free/Starter** | In-house basic | Build simple review request | Keep costs low |
| **Pro** | NiceJob | API integration | Best value, contractor-focused |
| **Business** | GatherUp | Full API integration | Multi-location, white-label |
| **Enterprise** | Birdeye/Custom | Direct API or custom | Full feature set |

---

## Part 3: Review Solicitation Best Practices

### Optimal Timing

| Timing Window | Response Rate | Best Practice |
|---------------|---------------|---------------|
| **Immediately** (same day) | Highest | In-person ask at final walkthrough |
| **24-48 hours** | Very High | Automated SMS/email follow-up |
| **3-7 days** | Medium | Reminder if no response |
| **14+ days** | Low | Memory fades, stop sequence |

**Key Insight:** Send review requests **within 24-48 hours** of service completion when the experience is still fresh. The "golden window" is when the client says "Wow, this looks amazing!"

**Industry-Specific Timing:**
- **Service Providers (plumbers, electricians, contractors):** Immediately after job completion and customer satisfaction confirmation. Post-visit follow-up via SMS or personal email from technician is highly effective.
- **Retail/eCommerce:** 1-3 days after delivery confirmation

**Optimal Times of Day:**
- Mid-mornings: 10-11 AM
- Early evenings: 5-6 PM
- **Avoid:** Late night or busy mornings
- **Compliance:** Send between 8 AM - 9 PM in customer's timezone

### Channel Comparison

| Channel | Open Rate | Response Rate | Best Use Case |
|---------|-----------|---------------|---------------|
| **In-person** | 100% | 50-70% | Final walkthrough |
| **SMS** | 98% | 45% | Immediate follow-up |
| **Email** | 20-28% | 6% | Detailed request |
| **Combined SMS+Email** | N/A | 429% higher conversion | Multi-touch sequence |

**Key Stats:**
- 90% of text messages are read within 3 minutes
- SMS sees higher open and response rates than email
- Multi-channel approach maximizes reach and results

### Response Rate Optimization Strategies

| Technique | Impact |
|-----------|--------|
| Include direct link (not homepage) | +40% completion |
| Personalize with project details | +25% response |
| Keep request under 50 words (SMS) | +30% completion |
| Use question mark in subject line | +15.7% open rate |
| Follow up (don't spam) | 3-4x responses vs single send |
| One-click ratings (no login required) | 6% to 40% increase |
| Structured review questions | Higher quality, more detailed reviews |

**Critical:** Businesses using automated post-purchase review requests see **30% higher response rate** than manual follow-ups.

### Recommended Sequence

```
Day 0 (Completion): In-person verbal request
Day 1: SMS with direct link to Google
Day 3: Email reminder (if no response)
Day 7: Final SMS reminder
Day 14: Stop sequence (respect customer)
```

**Follow-up Best Practice:** A single, polite reminder is acceptable (3-5 days after initial). Any more than that can feel like harassment.

### Message Templates

#### SMS Template (Day 1)
```
Hi [First Name]! We loved working on your [project type].
Would you take 60 seconds to share your experience?
[Short Google Review Link]

Thanks! - [Contractor Name]
```

#### Email Template (Day 3)
```
Subject: How did we do on your [project type]?

Hi [First Name],

We hope you're enjoying your [project type]! Your feedback
helps other homeowners find quality contractors.

Would you mind leaving us a quick Google review?

[Button: Leave a Review]

Thanks for choosing [Company Name]!

[Signature]
```

### Sources
- [Best Practices for Timing Review Requests](https://expertreputation.com/best-practices-for-timing-your-review-requests-email-sms-and-in-app/)
- [SMS vs Email Review Requests 2025](https://birdeye.com/blog/sms-vs-email-review-requests-2025/)
- [How to Request Reviews via SMS and Email](https://www.synup.com/en/learn/how-to-request-reviews-via-sms-and-email)
- [SMS Review Requests Best Practices](https://www.apptoto.com/best-practices/sms-review-requests)

---

## Part 4: FTC Compliance & Legal Considerations

### FTC Consumer Review Rule (Effective October 2024)

**Enforcement Status:** As of December 2025, FTC sent warning letters to 10 companies, signaling move from education to **active enforcement**.

### Prohibited Practices

| Practice | Status | Penalty |
|----------|--------|---------|
| Conditioning incentives on positive sentiment | **PROHIBITED** | $53,088/violation |
| Fake reviews (misrepresenting reviewer experience) | **PROHIBITED** | $53,088/violation |
| Buying/selling fake reviews | **PROHIBITED** | $53,088/violation |
| Employee reviews without disclosure | **PROHIBITED** | $53,088/violation |
| Incentivizing reviews (sentiment-neutral) | **ALLOWED** | Disclosure may be required |

### What IS Allowed

**Incentivized Reviews Are Legal** when:
- Not tied to positive feedback
- Honestly reflect experience
- Clearly disclosed to readers when "material"

**Cautious Approach:** Disclose incentivized reviews as a general rule.

### Compliance Recommendations

1. **Never condition rewards on positive reviews** - Even implied pressure is prohibited
2. **Require employee disclosures** - "I work for [Company]" in all employee reviews
3. **Family member disclosures** - Immediate relatives must disclose relationship
4. **Periodic audits** - Review marketing materials and testimonials regularly
5. **Document consent** - Keep records of who agreed to receive review requests

### High-Risk Industries
Industries relying heavily on reviews are particularly exposed:
- E-commerce
- Home services/contractors
- Health and wellness
- Hospitality
- Technology

### Sources
- [FTC Consumer Review Rule Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)
- [FTC Warning Letters December 2025](https://www.ftc.gov/news-events/news/press-releases/2025/12/ftc-warns-10-companies-about-possible-violations-agencys-new-consumer-review-rule)
- [FTC's Final Rule on Incentivized Reviews](https://www.bclplaw.com/en-US/events-insights-news/part-3-what-the-ftcs-final-rule-means-for-incentivized-reviews.html)
- [Understanding Incentivized Reviews](https://www.nector.io/blog/incentivized-reviews-ftc-guidelines)

---

## Part 5: Marketing Features for Contractors

### Email Marketing

#### Job Completion Updates
- Automated "Project Complete" email with photos
- 30/60/90 day follow-up sequences
- Seasonal maintenance reminders
- Anniversary of project emails

#### Campaign Types
| Campaign | Trigger | Goal |
|----------|---------|------|
| Welcome Series | New lead capture | Nurture to sale |
| Project Updates | Milestone completion | Keep client engaged |
| Completion | Final walkthrough | Get review + referral |
| Maintenance | 6-12 months post | Repeat business |
| Referral | Happy customer identified | Generate leads |

**Key Stat:** Research shows simply asking every client for referrals can increase revenue by **40-60%**.

### Referral Programs

#### Structure Options
| Type | Example | Conversion |
|------|---------|------------|
| **Cash Back** | $100 for successful referral | Highest |
| **Service Credit** | $150 off next project | Medium |
| **Gift Card** | $50 Amazon card | Medium |
| **Donation** | $25 to charity of choice | Lower but feel-good |
| **Double-sided** | Both referrer and friend get reward | Most effective |

#### Implementation Best Practices
- Unique referral codes per customer
- Automated tracking and payout
- Referral dashboard for customers
- Email/SMS referral request after 5-star review
- Use NPS to identify "promoters" (scored 9-10) for referral campaigns
- Simplified referral forms (name, email, lead contact info only)

#### Timing
- Automate check-ins every 30, 60, or 90 days after project completion
- Ask for referrals when customers are at peak satisfaction

### Before/After Photo Galleries

#### Why Critical
- 69% of homeowners want to renovate (Houzz survey)
- Photos are primary decision factor for residential work
- Reviews visible above the fold can increase conversions by **34%**
- Differentiator from competitors with poor portfolios

#### Best Practices
| Element | Recommendation |
|---------|----------------|
| **Angles** | Same angle for before and after |
| **Lighting** | Consistent lighting conditions |
| **Orientation** | Both vertical (Instagram) and horizontal (website) |
| **Progress shots** | 1-3 mid-project photos |
| **Staging** | Clean, decluttered final photos |
| **Privacy** | Get written photo release from homeowner |

#### Portfolio Website Features
- Before/after slider component
- Project categorization (kitchen, bath, addition, etc.)
- Filterable by project type, service, location
- Location tagging (city/neighborhood, not address)
- Automatic watermarking
- Social sharing integration
- Embed code for contractor websites
- Schema markup for SEO

#### Platform Recommendations
- **CompanyCam**: Industry-leading before/after tool with portfolio features
- **Squarespace**: Beautiful templates, easy image galleries
- **Wix**: Drag-and-drop, construction-tailored templates

### Social Media Auto-Posting

#### Tools for Contractors
| Tool | Key Feature | Best For |
|------|-------------|----------|
| **Hootsuite** | AI scheduling, brand monitoring | Multi-platform management |
| **SocialPilot** | AI Scheduler, optimal timing | Engagement optimization |
| **Hookle** | Easy automation | Small businesses |
| **Lately.ai** | AI content repurposing | Blog to social conversion |
| **Iconosquare** | Instagram/TikTok/Pinterest | Visual platforms |
| **Loomly** | Zapier automation | Workflow integration |

**Industry Stats:**
- 100% of construction marketers use social media (CMA survey)
- 78% of social media experts use AI for brainstorming
- 45% are cautious about AI quality concerns

#### Best Practices
- Create posting schedule and stick to it
- Use scheduling apps for consistency
- Inconsistent posting causes audience to lose interest
- Construction is visually driven - leverage Instagram, TikTok, Pinterest

### Sources
- [Email Marketing for Contractors](https://blog.beehiiv.com/p/email-marketing-for-contractors)
- [Contractor Referral Programs Guide](https://referralrock.com/blog/contractor-referral-programs/)
- [How to Build Contractor Portfolio](https://companycam.com/resources/blog/how-to-build-contractor-portfolio-3-easy-steps)
- [Social Media for Contractors Blueprint](https://www.socialpilot.co/blog/social-media-for-contractors)
- [AI-Powered Social Media Tools](https://123worx.com/blog/ai-powered-social-media-tools/)

---

## Part 6: Competitor Analysis

### Construction Software Marketing Features

| Software | Review Features | Marketing Features | Client Portal | Pricing |
|----------|----------------|-------------------|---------------|---------|
| **Buildertrend** | Basic review requests | Email campaigns, lead management, automated proposals | Full client portal with messaging, photos, daily logs | $499/mo+ |
| **Procore** | None (enterprise focus) | CRM, lead management | Owner portal, conversation channels | Custom |
| **JobTread** | None | CRM, sales pipeline | Client communication | $159/mo |
| **ServiceTitan** | Multiple integrations | Marketing Pro (comprehensive campaigns, lead tracking, ROI analytics) | Customer portal | Custom |
| **Housecall Pro** | Review requests | Basic marketing tools | Client communication | $59/mo+ |
| **Houzz Pro** | Native Houzz reviews | Full marketing suite with portfolio | Client collaboration | $129/mo+ |

### Detailed Competitor Analysis

#### Buildertrend
- **Client Communication:** Customer Portal with direct messaging, daily logs, photos, videos, documents
- **Marketing:** Lead management, customized proposals, automated email campaigns
- **Strengths:** User-friendly, seamless client communication, easy to use
- **Weaknesses:** Steep learning curve, expensive ($499/mo+), clunky estimating tools
- **Target Market:** Small to mid-sized residential contractors with $500k+ volume

**Quote:** "Client communication has become nearly seamless."

#### Procore
- **Client Communication:** Conversations feature (1:1, group, project-based chat), role-based permissions
- **Owner Portal:** Real-time project updates, document sharing
- **Strengths:** Enterprise-grade, 16,000+ customers, 2M+ users globally, comprehensive document management
- **Weaknesses:** Prohibitively expensive, steep learning curve, overkill for small contractors
- **Target Market:** Large commercial firms, public agencies

**Note:** Procore was originally built for an owner (CEO built it for his custom home project visibility).

#### ServiceTitan
- **Marketing Pro:** Lead management, campaign tracking, customizable reports, detailed analytics
- **CRM:** Customer lifetime value tracking, service history, personalized campaigns
- **Review Management:** Multiple integration options
- **Strengths:** Comprehensive marketing suite, employee scorecards, ROI tracking
- **Results:** One plumbing company increased repeat business by 34% in 6 months

#### Housecall Pro
- **Marketing:** Functional but limited compared to ServiceTitan
- **Integrations:** Zapier connections, accounting software, payment processors
- **Ratings:** 4.7/5 on Capterra (2,800+ reviews)
- **Strengths:** Easy to use, powerful mobile app, responsive support
- **Pricing:** $59/mo (annual) for solo, $149/mo for 5 users

### ContractorOS Differentiation Opportunities

1. **Unified review inbox** for all platforms (Google, Facebook, Yelp)
2. **AI-powered reply suggestions** (match/exceed NiceJob Pro)
3. **Automatic project matching** - link reviews to specific projects
4. **Before/after automation** - suggest photos to add to gallery based on project completion
5. **Built-in referral program** - not a third-party add-on
6. **FTC compliance guardrails** - automated disclosure requirements
7. **SMS + Email dual-channel** - integrated, not separate systems

### Sources
- [Buildertrend Communication Features](https://buildertrend.com/communication/)
- [Buildertrend vs Procore Comparison](https://www.getonecrew.com/post/buildertrend-vs-procore)
- [Housecall Pro vs ServiceTitan](https://www.servicetitan.com/comparison/servicetitan-vs-housecall-pro)
- [JobTread Reviews](https://www.jobtread.com/blog/construction-management-software-reviews-and-how-jobtread-compares)

---

## Part 7: MVP Scope for Reviews Module

### Phase 1: Foundation (Sprint 41-42) - 3-4 weeks

#### Review Request Automation
- [ ] Manual "Request Review" button on completed projects
- [ ] Email template with personalized project details
- [ ] SMS template (via Twilio integration)
- [ ] Google Business Profile direct link generation
- [ ] Tracking: sent/opened/completed status
- [ ] Opt-out handling (TCPA compliance)
- [ ] FTC disclosure for any incentives

#### Basic Review Dashboard
- [ ] Google Business Profile OAuth connection
- [ ] Display incoming reviews in ContractorOS
- [ ] Reply to reviews from dashboard
- [ ] Review notification (email/in-app)
- [ ] Basic metrics (count, average rating, trend)

### Phase 2: Enhancement (Sprint 43-44) - 4-5 weeks

#### Multi-Platform Aggregation
- [ ] Facebook Reviews integration (Graph API)
- [ ] Yelp read-only integration (Fusion API)
- [ ] Unified review inbox
- [ ] Cross-platform reply (where supported)

#### Automation Sequences
- [ ] Multi-step follow-up sequences
- [ ] Conditional logic (skip if reviewed)
- [ ] A/B testing for templates
- [ ] Optimal timing automation
- [ ] Response rate analytics

#### Review Widget
- [ ] Embeddable website widget
- [ ] Customizable design
- [ ] Schema markup for SEO
- [ ] Social sharing buttons

### Phase 3: Marketing Expansion (Sprint 45-46) - 5-6 weeks

#### Referral Program
- [ ] Unique referral codes per customer
- [ ] Referral tracking dashboard
- [ ] Automated payout/credit notifications
- [ ] Referral leaderboard
- [ ] Double-sided rewards configuration

#### Portfolio Enhancement
- [ ] Before/after slider component
- [ ] Public project gallery
- [ ] Automatic watermarking
- [ ] Social media auto-post integration
- [ ] Photo release consent tracking

#### Email Marketing Integration
- [ ] Mailgun/SendGrid integration (existing)
- [ ] Campaign templates library
- [ ] Drip sequence builder
- [ ] Analytics dashboard
- [ ] Unsubscribe management

### Phase 4: Integration Partners (Future)

#### NiceJob Integration
- [ ] OAuth connection
- [ ] Sync review data bidirectionally
- [ ] Trigger campaigns from ContractorOS
- [ ] Unified dashboard

#### GatherUp Integration (Business Tier)
- [ ] Full API integration
- [ ] White-label options
- [ ] Multi-location support

---

## Part 8: Technical Requirements

### API Integrations

| Platform | Authentication | Endpoints Needed | Complexity | Rate Limits |
|----------|---------------|------------------|------------|-------------|
| **Google Business** | OAuth 2.0 | reviews.list, reviews.reply | Medium | 300/min |
| **Facebook Graph** | OAuth 2.0 | /ratings, /reviews | Medium | Varies |
| **Yelp Fusion** | API Key | business, reviews | Low | Per plan |
| **Twilio** | API Key | messages.create | Low | None practical |
| **Mailgun** | API Key | messages.send | Low | Plan-based |

### Data Models

```typescript
interface ReviewRequest {
  id: string;
  projectId: string;
  clientId: string;
  orgId: string;
  channel: 'email' | 'sms' | 'both';
  status: 'pending' | 'sent' | 'opened' | 'completed' | 'opted_out';
  sentAt?: Timestamp;
  openedAt?: Timestamp;
  completedAt?: Timestamp;
  platformCompleted?: 'google' | 'facebook' | 'yelp' | 'other';
  incentiveOffered?: boolean;
  incentiveDisclosed?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Review {
  id: string;
  orgId: string;
  platform: 'google' | 'facebook' | 'yelp' | 'internal';
  externalId: string;
  rating: number; // 1-5 or recommendation boolean for FB
  text?: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  reviewedAt: Timestamp;
  repliedAt?: Timestamp;
  replyText?: string;
  projectId?: string;
  clientId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  isEmployeeReview?: boolean;
  employeeDisclosed?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ReferralCode {
  id: string;
  orgId: string;
  clientId: string;
  code: string;
  type: 'cash' | 'credit' | 'gift_card' | 'donation';
  value: number;
  status: 'active' | 'used' | 'expired';
  usedBy?: string[];
  totalEarned: number;
  ftcCompliant: boolean; // Tracks disclosure requirements
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

interface ProjectGallery {
  id: string;
  orgId: string;
  projectId: string;
  isPublic: boolean;
  title: string;
  description?: string;
  category: string;
  location?: {
    city: string;
    state: string;
    neighborhood?: string;
  };
  beforePhotos: PhotoRef[];
  afterPhotos: PhotoRef[];
  progressPhotos?: PhotoRef[];
  featured: boolean;
  viewCount: number;
  photoReleaseConsent: boolean;
  consentDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Firestore Rules (Addition)

```javascript
// Reviews collection
match /organizations/{orgId}/reviews/{reviewId} {
  allow read: if isSameOrg(orgId);
  allow write: if isSameOrg(orgId) && isAdmin();
}

// Review requests
match /organizations/{orgId}/reviewRequests/{requestId} {
  allow read, write: if isSameOrg(orgId);
}

// Referral codes
match /organizations/{orgId}/referralCodes/{codeId} {
  allow read: if isSameOrg(orgId);
  allow write: if isSameOrg(orgId) && isAdmin();
}

// Public galleries (read-only for public)
match /organizations/{orgId}/galleries/{galleryId} {
  allow read: if resource.data.isPublic == true || isSameOrg(orgId);
  allow write: if isSameOrg(orgId);
}
```

### External Service Dependencies

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| **Twilio** | SMS sending | $0.0079/message |
| **Mailgun** | Email sending | Existing integration |
| **Google Cloud** | OAuth, API calls | Minimal (free tier) |
| **Facebook Graph** | OAuth, API calls | Free |

---

## Part 9: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API rate limits | Medium | High | Implement caching, batch operations |
| Platform ToS changes | Medium | High | Abstract integrations, monitor announcements |
| Low adoption | Medium | Medium | Start with simple features, measure usage |
| SMS compliance (TCPA) | Medium | High | Opt-in tracking, clear consent, time windows |
| FTC review rule violations | Medium | Very High | Built-in compliance guardrails, disclosure tracking |
| Review platform backlash | Low | Medium | Follow platform guidelines strictly |
| Third-party tool pricing changes | Medium | Medium | Build core features in-house, partner integrations optional |

---

## Appendix A: Sources

### Review Platforms
- [Google Business Profile API](https://developers.google.com/my-business/content/review-data)
- [Yelp Fusion API](https://docs.developer.yelp.com/docs/places-intro)
- [Facebook Graph API](https://elfsight.com/blog/how-to-get-and-use-facebook-api/)
- [BBB API Developer Portal](https://developer.bbb.org/)
- [Nextdoor Business Recommendations](https://help.nextdoor.com/s/article/recommendations-faq)

### Review Management Tools
- [NiceJob Pricing](https://get.nicejob.com/pricing)
- [GatherUp Features](https://gatherup.com/solutions/)
- [Podium Reviews](https://www.g2.com/products/podium/reviews)
- [Birdeye Pricing](https://birdeye.com/pricing/)
- [Grade.us Plans](https://www.grade.us/home/plans/)

### Best Practices
- [Best Practices for Timing Review Requests](https://expertreputation.com/best-practices-for-timing-your-review-requests-email-sms-and-in-app/)
- [SMS vs Email Review Requests](https://birdeye.com/blog/sms-vs-email-review-requests-2025/)
- [Review Response Rate Optimization](https://business.feefo.com/en-us/resources/customer-experience/how-improve-your-response-rate)

### FTC Compliance
- [FTC Consumer Review Rule](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)
- [FTC Warning Letters 2025](https://www.ftc.gov/news-events/news/press-releases/2025/12/ftc-warns-10-companies-about-possible-violations-agencys-new-consumer-review-rule)
- [Incentivized Reviews Guidelines](https://www.nector.io/blog/incentivized-reviews-ftc-guidelines)

### Marketing & Portfolios
- [Contractor Referral Programs](https://referralrock.com/blog/contractor-referral-programs/)
- [Email Marketing for Contractors](https://blog.beehiiv.com/p/email-marketing-for-contractors)
- [Social Media for Contractors](https://www.socialpilot.co/blog/social-media-for-contractors)
- [Before/After Photo Tools](https://companycam.com/resources/blog/best-before-after-photo-tool-for-contractors)

### Competitor Analysis
- [Buildertrend vs Procore](https://www.getonecrew.com/post/buildertrend-vs-procore)
- [ServiceTitan vs Housecall Pro](https://www.servicetitan.com/comparison/servicetitan-vs-housecall-pro)
- [JobTread Reviews](https://www.jobtread.com/blog/construction-management-software-reviews-and-how-jobtread-compares)

---

## Appendix B: Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Prioritize Google Business Profile | 70%+ of contractor reviews, highest SEO impact, free API | 2026-02-03 |
| Recommend NiceJob for MVP partner | Lowest cost, contractor-focused, simple integration | 2026-02-03 |
| Skip Angi/HomeAdvisor integration | Poor contractor sentiment, controversial ROI, no review API | 2026-02-03 |
| SMS+Email dual-channel approach | 429% higher conversion than single channel | 2026-02-03 |
| Build in-house portfolio/gallery | Aligns with existing photo features, CompanyCam validates market | 2026-02-03 |
| Add FTC compliance tracking | Active enforcement since Dec 2025, $53k/violation penalties | 2026-02-03 |
| Phase referral program to Phase 3 | Core review features first, referrals require established review flow | 2026-02-03 |

---

*Document generated by Claude Code Research Agent for ContractorOS Sprint 40 planning.*
*Last Updated: 2026-02-03*
