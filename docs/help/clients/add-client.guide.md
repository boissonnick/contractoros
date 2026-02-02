---
title: "Add a Client"
description: "Step-by-step guide to adding new clients to ContractorOS"
audience: ["owner", "pm"]
module: "clients"
difficulty: "beginner"
time_to_complete: "3 minutes"
video_url: ""
walkthrough_id: "add-client"
last_updated: "2025-01-30"
status: "draft"
---

<!-- STATUS: DRAFT -->
<!-- NEEDS_VIDEO: Add client walkthrough -->
<!-- NEEDS_WALKTHROUGH: Interactive add client -->

# Add a Client

This guide walks through adding a new client to ContractorOS. A complete client record sets you up for smooth project management, communication, and billing.

---

## Before You Start

Gather this information if available:
- Client name
- Email address
- Phone number
- Property/billing address
- How they found you

---

## Step-by-Step: Add a New Client

### Step 1: Open the Add Client Form

**Option A**: From Clients page
1. Go to **Clients**
2. Click **+ Add Client**

**Option B**: While creating a project
1. In the project form, at the Client field
2. Click **+ Create New Client**

### Step 2: Enter Basic Information

| Field | Description | Required |
|-------|-------------|----------|
| **Client Type** | Individual or Company | Yes |
| **Name** | Full name or company name | Yes |
| **Email** | Primary email address | Recommended |
| **Phone** | Primary phone number | Recommended |

**For individuals**: Enter first and last name

**For companies**: Enter company name, then add contacts separately

### Step 3: Add Address

Enter the primary address. This is used for:
- Default billing address on invoices
- Mapping and directions
- Service area tracking

| Field | Notes |
|-------|-------|
| **Street** | Include unit/suite if applicable |
| **City** | City name |
| **State** | 2-letter state code |
| **ZIP** | 5 or 9-digit ZIP |

> **Tip**: If project address differs from billing address, you'll add that on the project.

### Step 4: Track the Source

Select how this client found you:

| Source | When to Use |
|--------|-------------|
| Referral | Someone recommended you |
| Google | Found via search or Google Maps |
| Social Media | Facebook, Instagram, Nextdoor, etc. |
| Yard Sign | Saw your sign on a job site |
| Vehicle Wrap | Saw your truck |
| Website | Submitted form on your website |
| Repeat | Returning client |
| Other | Anything else (add notes) |

### Step 5: Add Additional Details (Optional)

Expand **Additional Details** for:

| Field | Purpose |
|-------|---------|
| **Notes** | General notes about this client |
| **Tags** | Labels for organization (VIP, referral source) |
| **Secondary Contact** | Additional person (spouse, assistant) |
| **Preferred Contact Method** | How they like to be reached |

### Step 6: Save

Click **Add Client** to save.

You'll see the new client record, ready for projects and communication.

---

## Adding Contacts (for Companies)

When the client is a company, add individual contacts:

1. Open the client record
2. Go to **Contacts** section
3. Click **+ Add Contact**
4. Enter:
   - Name
   - Title/role
   - Email
   - Phone
   - Primary contact? (yes/no)
5. Save

### Contact Roles

| Role Example | Purpose |
|--------------|---------|
| Owner | Decision maker, signs contracts |
| Project Manager | Day-to-day communication |
| Accounts Payable | Invoice questions, payments |
| Site Contact | On-site coordination |

---

## Quick Add vs. Full Add

### Quick Add

Create a minimal client record fast:
1. Click **+ Add Client**
2. Enter just name and email
3. Click **Quick Add**

Use when you need to create a client immediately (e.g., while on a call) and will fill in details later.

### Full Add

Create a complete client record:
1. Click **+ Add Client**
2. Fill in all available fields
3. Click **Add Client**

Use when you have all the information and want a complete record from the start.

---

## Creating Client During Project Creation

When creating a new project, you can add a client inline:

1. In the Project form, at **Client** field
2. Start typing the name
3. If no match, click **+ Create New Client**
4. Mini form appears for quick client creation
5. Enter name, email, phone
6. Click **Create**
7. Client is created and linked to project

This saves time when you have a new lead calling about a specific project.

---

## Duplicate Detection

ContractorOS checks for potential duplicates:

### Matching Criteria
- Same email address
- Similar name spelling
- Same phone number

### When Match Found

You'll see a warning:
> "A client with similar information exists: John Smith (john@email.com)"

Options:
- **Use Existing** - Select the existing client
- **Create Anyway** - This is a different person with similar info
- **Cancel** - Don't create

### Preventing Duplicates

Before adding:
1. Search the client list first
2. Check for common misspellings
3. Look for company vs. individual confusion

→ [Merging duplicate clients](/help/clients/merge-clients.guide.md)

---

## What Happens Next

After creating a client:

### Link to a Project
Most clients get a project:
1. Click **+ Create Project** on client record
2. Client is pre-filled
3. Complete project details

### Enable Portal Access
Give them their own login:
1. Click **Enable Portal Access**
2. They receive an invitation email
3. They can view projects, approve changes, pay invoices

→ [Client portal setup](/help/client-portal/setup.guide.md)

### Log Initial Communication
Document the first contact:
1. Go to **Communication** tab
2. Click **+ Log Communication**
3. Record how and when they reached out
4. Note what they're looking for

---

## Importing Multiple Clients

Adding many clients at once:

1. Go to **Clients → ⋮ → Import**
2. Download the CSV template
3. Fill in your client data
4. Upload the file
5. Map columns to fields
6. Preview and confirm import

→ [Data import guide](/help/settings/import.guide.md)

---

## Common Questions

### Should I add the spouse separately?

For residential clients, add the household as one client:
- Main client: Primary decision maker
- Secondary contact: Spouse/partner

This keeps communication and financials together.

### What if I only have a phone number?

That's fine. You can create a client with:
- Name (required)
- Phone only

Add email later when you get it. Email is important for:
- Portal access
- Invoice delivery
- Automated notifications

### Can I add a client without a project?

Yes. Use for:
- Leads you're nurturing
- Past clients for reference
- Referral sources

Mark them as "Potential" status.

### How do I handle property managers?

Property managers can be:
- **The client** (if they contract with you)
- **A contact** on the property owner's client record

It depends on who signs contracts and pays invoices.

---

## Best Practices

### Get Complete Information

A complete record saves time later:
- Email for invoices and updates
- Phone for quick questions
- Address for service area tracking
- Source for marketing ROI

### Add Notes Immediately

First impressions matter. Right after initial contact:
- What are they looking for?
- Any concerns or priorities mentioned?
- Budget indications?
- Timeline expectations?

### Set the Source Accurately

This data drives marketing decisions:
- Which channels bring the best clients?
- Where should you invest marketing dollars?
- Which referral sources deserve thank-you notes?

---

## Troubleshooting

### "Email already exists" error

This email is already in the system:
1. Search for the existing client
2. If it's them, use the existing record
3. If different person, use a different email or note in record

### Address won't validate

Try:
- Simplify the address format
- Remove unit/suite temporarily
- Use ZIP code lookup
- Enter manually if auto-complete fails

### Form won't save

Check:
- Name field is filled (required)
- Valid email format (if entered)
- Internet connection

---

## Related Topics

- [Clients overview](/help/clients/overview.md)
- [Client portal setup](/help/client-portal/setup.guide.md)
- [Communication logging](/help/clients/communication.guide.md)
- [Create a project](/help/projects/create-project.guide.md)
