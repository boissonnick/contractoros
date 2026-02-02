# Suite 09: Documents - RFIs, Submittals, Change Orders

## Overview
Tests for document management including RFIs (Requests for Information), submittals, change orders, and general document workflows.

**Priority:** HIGH
**Roles to Test:** owner, project_manager, client, contractor
**Estimated Duration:** 30 minutes

---

## Preconditions
- App running at localhost:3000
- Logged in as OWNER role
- At least 1 active project exists
- Document management module is enabled

---

## RFI Tests

### TEST: 09-001 View RFI List
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to /dashboard/projects
2. Click on an active project
3. Navigate to "RFIs" or "Documents" tab
4. Observe RFI list

#### Expected Results
- [ ] RFI list/table is visible
- [ ] Shows: RFI number, subject, status, date, assigned to
- [ ] Status badges are color-coded
- [ ] Sorting and filtering options available
- [ ] "New RFI" button is visible

---

### TEST: 09-002 Create New RFI
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to project RFIs
2. Click "New RFI" button
3. Fill in:
   - Subject: "Clarification on foundation specs"
   - Description: "Need clarification on section 3.2.1"
   - Priority: High
   - Assigned to: Select team member
4. Attach a file (optional)
5. Submit RFI

#### Expected Results
- [ ] RFI creation form opens
- [ ] Required fields are marked
- [ ] File upload works
- [ ] RFI number auto-generates
- [ ] Success message appears
- [ ] RFI appears in list with "Open" status

---

### TEST: 09-003 View RFI Details
**Priority:** P1
**Roles:** owner, project_manager, contractor
**Viewports:** desktop

#### Steps
1. Navigate to project RFIs
2. Click on an RFI row
3. Observe detail view

#### Expected Results
- [ ] Full RFI details displayed
- [ ] Shows: number, subject, description, attachments
- [ ] Shows: created by, created date, due date
- [ ] Response section visible
- [ ] Activity/comment history shown
- [ ] Status clearly indicated

---

### TEST: 09-004 Respond to RFI
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Preconditions
- An open RFI exists

#### Steps
1. Open an RFI detail view
2. Click "Add Response" or enter response text
3. Type response: "Per specification section 3.2.1, use Type II concrete"
4. Attach clarifying document (optional)
5. Submit response

#### Expected Results
- [ ] Response form accepts text
- [ ] File attachment works
- [ ] Response is saved and displayed
- [ ] Timestamp and author shown on response
- [ ] RFI status can be updated

---

### TEST: 09-005 Close RFI
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

#### Preconditions
- An RFI with response exists

#### Steps
1. Open RFI detail view
2. Click "Close RFI" or change status to "Closed"
3. Confirm closure

#### Expected Results
- [ ] Status changes to "Closed"
- [ ] Close date is recorded
- [ ] RFI is no longer editable (or shows warning)
- [ ] Appears in closed RFIs filter

---

### TEST: 09-006 Contractor RFI Access
**Priority:** P1
**Roles:** contractor
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating CONTRACTOR role
- Contractor is assigned to the project

#### Steps
1. Navigate to assigned project
2. Look for RFIs section
3. Attempt to view and create RFIs

#### Expected Results
- [ ] Can view RFIs for assigned project
- [ ] Can create new RFIs (submit questions)
- [ ] Cannot see RFIs for unassigned projects
- [ ] Cannot close RFIs (only PM/Owner can close)

---

## Submittal Tests

### TEST: 09-007 View Submittals List
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to project
2. Click "Submittals" tab
3. Observe submittal list

#### Expected Results
- [ ] Submittal list displays
- [ ] Shows: number, description, status, spec section
- [ ] Status shows: pending, approved, rejected, revised
- [ ] Due dates visible
- [ ] Filter by status works

---

### TEST: 09-008 Create Submittal
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to project submittals
2. Click "New Submittal"
3. Fill in:
   - Description: "Kitchen cabinet shop drawings"
   - Spec Section: "06 41 00"
   - Contractor: Select from dropdown
4. Upload submittal document
5. Submit

#### Expected Results
- [ ] Submittal form opens
- [ ] File upload is required
- [ ] Submittal number auto-generates
- [ ] Contractor selection works
- [ ] Success message appears
- [ ] Shows as "Pending Review"

---

### TEST: 09-009 Review and Approve Submittal
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Preconditions
- A pending submittal exists

#### Steps
1. Open submittal detail
2. Review attached documents
3. Click "Approve" or select "Approved" status
4. Add comment: "Approved as submitted"
5. Save

#### Expected Results
- [ ] Review options clearly visible
- [ ] Can mark as: Approved, Approved as Noted, Rejected, Revise & Resubmit
- [ ] Comment is saved with decision
- [ ] Status updates immediately
- [ ] Notification sent to submitter (if implemented)

---

### TEST: 09-010 Reject Submittal
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

#### Preconditions
- A pending submittal exists

#### Steps
1. Open submittal detail
2. Click "Reject" or select "Revise & Resubmit"
3. Add comment explaining rejection
4. Save

#### Expected Results
- [ ] Rejection reason is required
- [ ] Status changes to rejected/revise
- [ ] Submittal remains in active list for resubmission
- [ ] History shows rejection with reason

---

### TEST: 09-011 Client Submittal View
**Priority:** P1
**Roles:** client
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating CLIENT role
- Client is associated with the project

#### Steps
1. Navigate to client portal or project view
2. Look for submittals section
3. Attempt to view submittals

#### Expected Results
- [ ] Client can see approved submittals (design selections)
- [ ] Cannot see internal submittal review process
- [ ] Cannot approve or reject submittals
- [ ] Can download approved submittal documents

---

## Change Order Tests

### TEST: 09-012 View Change Orders List
**Priority:** P0
**Roles:** owner, project_manager, client
**Viewports:** desktop

#### Steps
1. Navigate to project
2. Click "Change Orders" tab
3. Observe change order list

#### Expected Results
- [ ] Change order list displays
- [ ] Shows: CO number, description, amount, status
- [ ] Amounts clearly show positive/negative impact
- [ ] Status: draft, pending, approved, rejected
- [ ] Running total of approved COs visible

---

### TEST: 09-013 Create Change Order
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to project change orders
2. Click "New Change Order"
3. Fill in:
   - Description: "Add recessed lighting in kitchen"
   - Reason: "Client request"
   - Amount: 2500.00
   - Days impact: 2
4. Add line items (if applicable)
5. Save as draft

#### Expected Results
- [ ] Change order form opens
- [ ] Can add multiple line items
- [ ] Amount auto-calculates from line items
- [ ] Schedule impact field available
- [ ] Saves as "Draft" status
- [ ] CO number auto-generates

---

### TEST: 09-014 Submit Change Order for Approval
**Priority:** P0
**Roles:** owner, project_manager
**Viewports:** desktop

#### Preconditions
- A draft change order exists

#### Steps
1. Open draft change order
2. Review details
3. Click "Submit for Approval" or "Send to Client"
4. Confirm submission

#### Expected Results
- [ ] Status changes to "Pending Approval"
- [ ] Client notification sent (if implemented)
- [ ] CO becomes read-only (pending approval)
- [ ] Approval/reject options available

---

### TEST: 09-015 Client Approve Change Order
**Priority:** P0
**Roles:** client
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating CLIENT role
- A pending change order exists

#### Steps
1. Navigate to client portal/project
2. Find pending change order
3. Review change order details
4. Click "Approve" and sign
5. Confirm

#### Expected Results
- [ ] Client can see CO description and amount
- [ ] Signature pad or approval button available
- [ ] Approval is recorded with timestamp
- [ ] Status changes to "Approved"
- [ ] CO amount adds to contract value

---

### TEST: 09-016 Client Reject Change Order
**Priority:** P1
**Roles:** client
**Viewports:** desktop

#### Preconditions
- Logged in as OWNER, impersonating CLIENT role
- A pending change order exists

#### Steps
1. Navigate to pending change order
2. Click "Reject" or "Decline"
3. Add reason (optional)
4. Confirm rejection

#### Expected Results
- [ ] Rejection recorded with timestamp
- [ ] Status changes to "Rejected"
- [ ] PM/Owner notified of rejection
- [ ] CO does not affect contract value

---

### TEST: 09-017 Change Order Impact on Budget
**Priority:** P1
**Roles:** owner
**Viewports:** desktop

#### Preconditions
- Approved change orders exist on project

#### Steps
1. Navigate to project dashboard or finances
2. View budget summary
3. Check contract value and CO totals

#### Expected Results
- [ ] Original contract value shown
- [ ] Total approved COs shown
- [ ] Current contract value = original + COs
- [ ] Individual CO amounts listed
- [ ] Budget reflects CO impacts

---

## General Document Tests

### TEST: 09-018 Upload Project Document
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to project
2. Click "Documents" or "Files" tab
3. Click "Upload" button
4. Select a file (PDF, image, or doc)
5. Add description/tags (optional)
6. Upload

#### Expected Results
- [ ] File upload dialog opens
- [ ] Drag-and-drop supported
- [ ] Upload progress shown
- [ ] File appears in document list
- [ ] Thumbnail generated for images/PDFs

---

### TEST: 09-019 Document Folders/Organization
**Priority:** P2
**Roles:** owner, project_manager
**Viewports:** desktop

#### Steps
1. Navigate to project documents
2. Create a new folder: "Permits"
3. Upload document to folder
4. Navigate folder structure

#### Expected Results
- [ ] Can create folders
- [ ] Can move documents between folders
- [ ] Folder navigation works
- [ ] Breadcrumb trail shows current location
- [ ] Search works across folders

---

### TEST: 09-020 Documents Mobile View
**Priority:** P1
**Roles:** owner, project_manager
**Viewports:** mobile (375x812)

#### Steps
1. Resize browser to 375x812
2. Navigate to project documents
3. View and interact with documents

#### Expected Results
- [ ] Document list is scrollable
- [ ] Document names are readable
- [ ] Upload button is accessible
- [ ] Document preview works
- [ ] Actions (download, delete) are accessible

---

## Test Data Requirements

```json
{
  "rfis": [
    {
      "subject": "E2E Test RFI",
      "description": "Test RFI for automated testing",
      "status": "open",
      "priority": "normal"
    }
  ],
  "submittals": [
    {
      "description": "E2E Test Submittal",
      "specSection": "01 00 00",
      "status": "pending"
    }
  ],
  "changeOrders": [
    {
      "description": "E2E Test Change Order",
      "amount": 1000,
      "status": "draft"
    }
  ]
}
```

---

## Cleanup Actions
1. Delete any test RFIs created
2. Delete any test submittals created
3. Delete any test change orders created
4. Delete any uploaded test documents
5. Return to OWNER role if impersonating
