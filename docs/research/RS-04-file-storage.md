# RS-04: File Storage Architecture Research

**Research Type:** Technical Architecture
**Date:** February 3, 2026 (Updated)
**Status:** Complete
**Priority:** High

---

## Executive Summary

This research examines file storage strategies for construction management platforms, comparing how major competitors (Procore, Buildertrend, Autodesk Build, Bluebeam) handle document management. The analysis covers native storage vs. integration approaches, construction-specific document requirements, cost considerations, and recommends an MVP scope for ContractorOS.

**Key Findings:**
- Major competitors offer **unlimited native storage** as a competitive advantage
- Construction projects generate 1-5 GB of documents per month on average
- **Hybrid approach** is recommended: native storage for photos + integration for large documents
- Estimated storage costs for 1,000 active projects: $150-300/month on Firebase Cloud Storage
- Firebase Storage with Cloud Functions for thumbnails provides best cost/feature balance

**Recommendation:** Implement native photo storage immediately with Google Drive integration for plans/blueprints in Phase 2.

---

## Table of Contents

1. [Competitor Analysis](#1-competitor-analysis)
2. [Construction Document Types](#2-construction-document-types)
3. [Storage Architecture Options](#3-storage-architecture-options)
4. [Cloud Provider Comparison](#4-cloud-provider-comparison)
5. [Integration Options](#5-integration-options)
6. [Technical Considerations](#6-technical-considerations)
7. [Cost Analysis](#7-cost-analysis)
8. [MVP Scope Recommendation](#8-mvp-scope-recommendation)
9. [Technical Architecture Proposal](#9-technical-architecture-proposal)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Sources](#11-sources)

---

## 1. Competitor Analysis

### 1.1 Feature Comparison Table

| Platform | Storage Model | Storage Limit | Version Control | Folder Structure | File Preview | Offline Access | Pricing Model |
|----------|--------------|---------------|-----------------|------------------|--------------|----------------|---------------|
| **Procore** | Native cloud | Unlimited | Yes (automatic) | No folders (metadata views) | Built-in DWG viewer | Yes (mobile) | Volume-based |
| **Buildertrend** | Native cloud | Unlimited | Yes | Job-specific folders | PDF annotation | Yes (mobile) | Per month |
| **Autodesk Build** | Native cloud | 5 TB/file | Yes | Structured folders | 2D/3D model viewer | Yes (ACC app) | Per seat |
| **Bluebeam Revu** | Native + Studio | Unlimited | Yes | Project-based | Full PDF editor | Desktop only | Per seat |
| **PlanRadar** | Native cloud | Unlimited | Yes | BIM-integrated | 3D model support | Yes | Per seat |
| **InEight** | Native cloud | No limits | Yes | Flexible | Document viewer | Yes | Enterprise |

### 1.2 Detailed Platform Analysis

#### Procore Document Management

**Architecture:**
- 15 global data centers for file storage (expanded from 4 in 2024)
- Cloud-native with automatic redundancy across multiple servers
- No traditional folder structure; uses "saved views" based on metadata filtering
- Machine learning auto-captures document metadata during upload

**Key Features:**
- **Unlimited storage** at no extra cost included in subscription
- Built-in viewers for PDFs and DWG files (no external CAD software needed)
- Enterprise-grade security: data encryption-at-rest, managed bug bounty program
- Version field is required and provides un-editable historical record
- Granular document permission groups based on metadata (status, type, originating company)
- Streamlined workflow experiences for document review and approval

**Notable Design Decision:** Folders are not supported because they can increase the chance of a document losing its single source of truth. Instead, users create "saved views" for visual organization.

**Availability:** Document Management tool is available in select countries; not yet available for US accounts.

**Sources:**
- [Procore Document Management](https://www.procore.com/platform/document-management)
- [About Document Management Tool](https://v2.support.procore.com/product-manuals/document-management-project/tutorials/about-the-document-management-tool)

#### Buildertrend Document Management

**Architecture:**
- Cloud-based with unlimited storage for all plans
- Traditional folder structure with job-specific organization
- Real-time sync between office and field teams
- Mobile-first with built-in document scanner

**Key Features:**
- Unlimited cloud storage for documents, photos, and videos
- Folder templates for consistent project structure across jobs
- PDF annotation and markup directly on mobile devices
- Customer Portal for sharing documents with clients
- Permission-based sharing controls for privacy
- Integration with To-Do, Daily Log, and Schedule items

**Best Practice:** Upload files as attachments directly within relevant features (To-Do, Daily Log, Schedule item) to keep documentation organized and provide immediate context.

**Sources:**
- [Buildertrend Document Control Features](https://buildertrend.com/blog/spotlight-on-document-control/)
- [Buildertrend Files on Mobile](https://buildertrend.com/help-article/files-on-mobile/)

#### Autodesk Build (PlanGrid Successor)

**Architecture:**
- Autodesk Docs serves as the centralized Common Data Environment (CDE)
- Deep integration with Autodesk tools (Revit, AutoCAD, Navisworks)
- PlanGrid is now in "maintenance mode" - no new features

**Key Features:**
- Full BIM model viewing with 3D Issue Markups directly on models
- Supports all major formats: RVT, DWG, NWC, IFC, NWD
- AI-assisted automatic tagging for uploaded photos
- File size limit: 5 TB per file; PDFs limited to 500 pages in Plans folder
- New automated document approval system with review workflows
- AutoCAD Markup Import for PDF markups into AutoCAD

**2026 Updates:**
- Centralized admin experience for users, permissions, templates
- Improved document control with structured folders and custom permissions
- Enhanced 3D Issue Markups for commenting on 3D views

**Sources:**
- [Autodesk Docs 2026 Features](https://www.autodesk.com/products/autodesk-docs/features)
- [Moving from PlanGrid to Autodesk Build](https://resources.imaginit.com/building-solutions-blog/moving-from-plangrid-to-autodesk-build-what-to-expect)

#### Bluebeam Revu

**Architecture:**
- Bluebeam Studio provides secure cloud-based document storage
- Studio Projects for centralized document storage; Studio Sessions for real-time collaboration
- Complements desktop version with web and mobile access

**Key Features:**
- 500 users can work on a single PDF simultaneously
- Unlimited cloud storage for all file types
- Robust version tracking with change comparison
- Full-featured PDF markup, measurement, and editing tools
- Used by 3 million+ AEC professionals worldwide

**Coming Early 2026:** Bluebeam Max - premium subscription with AI to accelerate drawing reviews, automate workflows, and bridge 2D/3D.

**Sources:**
- [Bluebeam Document Management](https://www.bluebeam.com/workflows/drawing-and-document-management/)
- [Bluebeam Cloud Guide](https://quantitysurveyingcoach.com/bluebeam/bluebeam-cloud-a-comprehensive-guide/)

---

## 2. Construction Document Types

### 2.1 Document Categories Matrix

| Category | File Types | Typical Size | Access Pattern | Storage Priority |
|----------|-----------|--------------|----------------|------------------|
| **Plans/Blueprints** | PDF, DWG, RVT | 10-500 MB | Frequent read, rare update | High (core workflow) |
| **3D Models** | RVT, IFC, OBJ, GLB, NWD | 50-2000 MB | Weekly access | Medium (specialized) |
| **Specifications** | PDF, DOCX | 1-50 MB | Read-only after upload | Medium |
| **Contracts** | PDF | 1-10 MB | Read + signature | High (legal) |
| **Permits** | PDF, images | 1-5 MB | Read-only reference | High (compliance) |
| **Photos (Job Site)** | JPEG, PNG, HEIC | 2-10 MB each | High volume uploads | Very High |
| **RFI Attachments** | PDF, images | 1-20 MB | Linked to RFI records | High |
| **Submittals** | PDF, various | 5-100 MB | Review workflow | High |
| **Change Orders** | PDF | 1-5 MB | Approval workflow | High |
| **Invoices/Receipts** | PDF, images | 0.5-5 MB | High volume | High (expense tracking) |
| **Daily Logs** | PDF (with photos) | 5-30 MB | Daily creation | High |
| **Videos** | MP4, MOV | 50-2000 MB | Progress documentation | Low (MVP) |

### 2.2 File Format Reference

#### CAD Formats
| Format | Software | Description | Typical Use |
|--------|----------|-------------|-------------|
| **DWG** | AutoCAD | Native AutoCAD format | 2D/3D architectural drawings |
| **DXF** | Various | Open CAD exchange format | Cross-platform sharing |
| **RVT** | Revit | BIM model files | Building Information Modeling |
| **IFC** | Open standard | Industry Foundation Classes | BIM data exchange |
| **NWD/NWC** | Navisworks | Model aggregation | Clash detection, 4D simulation |

#### Document Formats
| Format | Best For | Advantages |
|--------|----------|------------|
| **PDF** | Universal sharing | Preserves layout, widely supported |
| **TIFF** | Archival | Lossless, maintains original detail |
| **DOCX** | Editable specs | Collaborative editing |

#### Image Formats
| Format | Compression | Notes |
|--------|-------------|-------|
| **JPEG** | Lossy | Standard for photos, smaller files |
| **PNG** | Lossless | Screenshots, diagrams |
| **HEIC** | High efficiency | Apple devices (needs conversion for web) |

**Format Selection Best Practice:** Use TIFF for archiving, PDF for sharing, DWG for active design work.

**Sources:**
- [Construction File Formats Guide](https://planexpress.net/blog/choosing-the-right-format-file-types-every-construction-company-should-consider)
- [CAD File Formats in Architecture](https://www.archdaily.com/930660/dwg-ifc-rvt-pln-most-common-file-extensions-in-architecture)

---

## 3. Storage Architecture Options

### 3.1 Option A: Fully Native Storage

Build complete document management within ContractorOS using Firebase/GCS.

```
┌─────────────────────────────────────────────────────────────┐
│                    ContractorOS Web App                      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Firebase Cloud Storage Bucket                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /organizations/{orgId}/                              │   │
│  │    ├── projects/{projectId}/                         │   │
│  │    │     ├── photos/                                 │   │
│  │    │     ├── documents/                              │   │
│  │    │     ├── plans/                                  │   │
│  │    │     └── rfis/{rfiId}/                          │   │
│  │    └── company/                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Full control over file organization and metadata
- Integrated security with Firebase Auth
- Real-time sync capabilities
- Unified billing and monitoring
- No third-party dependencies

**Cons:**
- Storage and egress costs scale with usage
- Must build viewers, version control from scratch
- Requires signed URL management for security
- No built-in DWG/CAD viewer (expensive to license)

**Estimated Development:** 800-1200 hours
**Comparable to:** Building a simplified Dropbox + specialized construction features

### 3.2 Option B: Integration-First Approach

Integrate with existing cloud storage (Google Drive, Dropbox, OneDrive) for all file storage.

```
┌─────────────────────────────────────────────────────────────┐
│                    ContractorOS Web App                      │
└────────────┬─────────────────────────────────────┬──────────┘
             │                                     │
             ▼                                     ▼
┌────────────────────────┐           ┌────────────────────────┐
│   Firebase (Metadata)  │           │  Cloud Storage Partner │
│  ┌──────────────────┐  │           │  ┌──────────────────┐  │
│  │ documents: {     │  │           │  │ Google Drive     │  │
│  │   name,          │  │◄─────────►│  │ Dropbox Business │  │
│  │   url,           │  │   OAuth   │  │ SharePoint       │  │
│  │   provider,      │  │   + API   │  └──────────────────┘  │
│  │   externalId     │  │           │                        │
│  │ }                │  │           └────────────────────────┘
│  └──────────────────┘  │
└────────────────────────┘
```

**Pros:**
- Zero storage costs (users use their own storage)
- Familiar UI for users
- Enterprise-grade features built-in (versioning, sharing, offline)
- Advanced search included
- No file size limits (Drive: 5TB, Dropbox: varies by plan)

**Cons:**
- Dependency on third-party APIs and rate limits
- OAuth complexity and token management
- Limited control over UX
- Data spread across systems
- Support complexity

**Estimated Development:** 200-400 hours
**Comparable to:** Raken's Egnyte integration approach

### 3.3 Option C: Hybrid Approach (Recommended)

Native storage for core construction documents; integration for large/specialized files.

```
┌─────────────────────────────────────────────────────────────┐
│                    ContractorOS Web App                      │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               │
        ┌───────┴───────┐               ┌───────┴───────┐
        ▼               ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐
│ Firebase      │ │ Firebase      │ │ External Storage      │
│ Cloud Storage │ │ Firestore     │ │ (User's Choice)       │
│               │ │               │ │                       │
│ • Photos      │ │ • Metadata    │ │ • Plans/Blueprints   │
│ • Thumbnails  │ │ • References  │ │ • CAD files          │
│ • Receipts    │ │ • Permissions │ │ • Large documents    │
│ • Signatures  │ │ • Audit logs  │ │                       │
└───────────────┘ └───────────────┘ └───────────────────────┘
```

**Strategy:**
1. **Photos & Quick Uploads** -> Firebase Cloud Storage
   - Job site photos (most common upload type)
   - Receipts and invoices
   - Signatures and quick captures
   - RFI/submittal attachments under 50MB

2. **Large Documents & Plans** -> Integration with user's existing storage
   - Google Drive integration
   - Dropbox Business integration
   - OneDrive/SharePoint integration

3. **Metadata & References** -> Firestore
   - Document metadata (name, type, project, uploader)
   - External storage references (URL, provider, externalId)
   - Version history tracking
   - Permission records

**Pros:**
- Best of both worlds
- Photos handled seamlessly (80% of field uploads)
- Leverages existing enterprise storage investments
- Scalable and cost-effective
- Gradual migration path to full native storage

**Cons:**
- More complex implementation
- Need to handle multiple storage providers
- UX consistency challenges

**Estimated Development:** 400-600 hours

---

## 4. Cloud Provider Comparison

### 4.1 Storage Pricing Comparison

| Provider | Storage Cost | Egress Cost | Max File Size | Free Tier | Best For |
|----------|-------------|-------------|---------------|-----------|----------|
| **Firebase Storage** | $0.026/GB/mo | $0.12/GB | Terabytes | 5 GB | App-integrated files |
| **Google Cloud Storage** | $0.020/GB/mo | $0.12/GB | 5 TB | 5 GB | General documents |
| **AWS S3 Standard** | $0.023/GB/mo | $0.09/GB | 5 TB | 5 GB | Enterprise scale |
| **Azure Blob (Hot)** | $0.018/GB/mo | $0.087/GB | 190 TB | 5 GB | Microsoft ecosystem |
| **Backblaze B2** | $0.006/GB/mo | $0.01/GB | 10 GB | 10 GB | Cost-sensitive |

### 4.2 Google Cloud Storage Tiers

| Class | Use Case | Storage Cost | Retrieval Cost | Min Duration |
|-------|----------|--------------|----------------|--------------|
| **Standard** | Active documents | $0.020/GB/mo | Free | None |
| **Nearline** | Monthly access | $0.010/GB/mo | $0.01/GB | 30 days |
| **Coldline** | Quarterly access | $0.004/GB/mo | $0.02/GB | 90 days |
| **Archive** | Annual/legal hold | $0.0012/GB/mo | $0.05/GB | 365 days |

**Recommendation for ContractorOS:**
- **Active Projects:** Standard storage for documents accessed frequently
- **Completed Projects:** Coldline (auto-transition via Object Lifecycle Management)
- **Legal Retention:** Archive for 7+ year document retention requirements

### 4.3 Provider Comparison Summary

| Aspect | AWS S3 | Google Cloud | Azure Blob |
|--------|--------|--------------|------------|
| **Strengths** | Diverse storage classes, strong ecosystem | Global consistency, AI optimizations | Microsoft integration, security features |
| **Weaknesses** | Complex policies, egress costs | Higher egress fees | Latency in some regions |
| **Durability** | 11 nines (99.999999999%) | 11 nines | 11 nines |
| **Consistency** | Strong (since Dec 2020) | Strong (always) | Strong (always) |

**Sources:**
- [Cloud Storage Pricing Comparison](https://www.backblaze.com/cloud-storage/pricing)
- [AWS vs Azure vs GCP Comparison](https://www.techtarget.com/searchstorage/feature/AWS-vs-Azure-vs-Google-pricing-and-features-compared)

---

## 5. Integration Options

### 5.1 Google Drive Integration

**Implementation Pattern:**
```typescript
// OAuth flow for Google Drive access
const scopes = [
  'https://www.googleapis.com/auth/drive.file',    // App-created files
  'https://www.googleapis.com/auth/drive.readonly'  // Read user files
];

// Create application-specific folder
const appFolder = await drive.files.create({
  requestBody: {
    name: 'ContractorOS Documents',
    mimeType: 'application/vnd.google-apps.folder',
    parents: ['root']
  }
});
```

**Capabilities:**
- Full CRUD operations on files
- Application-specific folders
- Event monitoring via webhooks
- 15 GB free per user (100 GB at $1.99/mo)

**Limitations:**
- Requires user OAuth consent
- API rate limits: 12,000 requests/minute
- 750 GB daily upload limit

**Best Practices:**
- Use incremental loading to process only changed files
- Implement caching for frequently accessed files
- Store files in same region as Firestore to avoid egress costs

### 5.2 Dropbox Integration

**Capabilities:**
- Team folder management
- Paper integration for collaboration
- 2 GB free (3 TB Essentials at $16.58/mo)

**Limitations:**
- Smaller free tier
- Enterprise features require Business plan

### 5.3 Microsoft OneDrive/SharePoint

**Best For:**
- Enterprise customers in Microsoft ecosystem
- Teams integration
- 5 GB free (1 TB with Microsoft 365)

**Capabilities:**
- Graph API for unified access
- SharePoint for team collaboration
- Real-time co-authoring

### 5.4 Unified API Approach

Consider unified storage APIs like CloudRail for multi-provider support:

**Benefits:**
- Single integration code for Google Drive, Dropbox, OneDrive, Box
- User chooses their preferred provider
- Reduced maintenance overhead

**Drawbacks:**
- Additional dependency
- May not support all provider features
- Potential latency

**Sources:**
- [Google Drive API Overview](https://developers.google.com/workspace/drive/api/guides/about-sdk)
- [Cloud API Integration Guide](https://hackernoon.com/how-to-implement-cloud-apis-google-drive-api-dropbox-api-and-onedrive-api)

---

## 6. Technical Considerations

### 6.1 Thumbnail Generation

**Recommended Approach:** Firebase Cloud Functions with Sharp

```typescript
// Cloud Function triggered on file upload
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import * as path from 'path';
import * as os from 'os';

export const generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (!object.contentType?.startsWith('image/')) return;
    if (object.name?.includes('thumb_')) return; // Prevent infinite loop

    const bucket = admin.storage().bucket(object.bucket);
    const filePath = object.name!;
    const fileName = path.basename(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);

    // Download, resize, upload
    await bucket.file(filePath).download({ destination: tempFilePath });

    const thumbPath = path.join(path.dirname(filePath), `thumb_${fileName}`);
    await sharp(tempFilePath)
      .resize(200, 200, { fit: 'inside' })
      .toFile(tempFilePath + '_thumb');

    await bucket.upload(tempFilePath + '_thumb', { destination: thumbPath });

    // Clean up temp files
    await fs.unlink(tempFilePath);
    await fs.unlink(tempFilePath + '_thumb');
  });
```

**Alternative: Firebase Resize Images Extension (No-Code)**
- Configure sizes: `200x200,400x400,800x800`
- Automatic processing on upload
- Limitation: Fixed sizes, can't dynamically request

**Performance:** Sharp is approximately 4x faster than ImageMagick for image resizing.

**Sources:**
- [Firebase Image Thumbnail Tutorial](https://fireship.io/lessons/image-thumbnail-resizer-cloud-function/)
- [Firebase Resize Images Extension](https://jsmobiledev.com/article/extension-resize-images/)

### 6.2 CDN for Photos

**Recommendation:** Firebase Storage + Cloud CDN

**Configuration:**
1. Create Cloud Storage bucket in regional location (us-west1)
2. Configure Cloud CDN with Firebase Storage as origin
3. Set cache headers: `max-age: 31536000` for thumbnails (1 year)
4. Use signed URLs for private documents (2-60 minute expiry)

**Alternative Services:**
| Service | Pricing | Features |
|---------|---------|----------|
| **Cloudinary** | Pay-as-you-go | AI features, 15 SDKs, auto-format conversion |
| **ImageKit** | $49/mo starter | 700+ CloudFront PoPs, sub-50ms latency |
| **Bytescale** | ~$0.31/1000 images | External storage support, permanent cache |

### 6.3 Full-Text Document Search

**Phase 2 Feature - Options:**

| Solution | Best For | Pricing | Notes |
|----------|----------|---------|-------|
| **Algolia** | Fast search, typo tolerance | $0.50/1000 records | Requires text extraction first |
| **Elasticsearch** | Large document volumes | Self-hosted or cloud | Ingest attachment plugin for PDFs |
| **Firebase + Tika** | Basic search | Cloud Functions cost | Store extracted text in Firestore |

**PDF Indexing Process:**
1. Extract text from PDFs using Apache Tika
2. Chunk content appropriately (especially for long specs)
3. Index extracted text to Algolia or Elasticsearch
4. Store extracted metadata for document classification

**MVP Recommendation:** Defer full-text search. Implement:
- Filename search
- Metadata search (project, date, type)
- Tag-based filtering

**Sources:**
- [Algolia PDF Indexing](https://support.algolia.com/hc/en-us/articles/4406981931281-Can-I-index-PDFs-Word-and-other-types-of-documents-)
- [Elasticsearch PDF Search](https://blog.expertrec.com/pdf-search-using-elasticsearch/)

### 6.4 Version Control (Simple)

```typescript
interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  fileSize: number;
  checksum: string;
  comment?: string;
}
```

**Storage Pattern:**
```
/organizations/{orgId}/projects/{projectId}/documents/{docId}/
  └── versions/
      ├── v1_filename.pdf
      ├── v2_filename.pdf
      └── v3_filename.pdf
```

---

## 7. Cost Analysis

### 7.1 Scenario: Mid-Size General Contractor

**Assumptions:**
- 50 active projects
- 500 photos/month (5 MB avg = 2.5 GB)
- 200 documents/month (2 MB avg = 0.4 GB)
- 20 plan sets/month (50 MB avg = 1 GB)
- 3-year document retention

### 7.2 Option Comparison

#### Option 1: Fully Native (Firebase Storage)

| Item | Monthly Volume | Cost/Unit | Monthly Cost |
|------|----------------|-----------|--------------|
| Photo Storage | 2.5 GB new + 45 GB existing | $0.026/GB | $1.24 |
| Document Storage | 0.4 GB new + 7.2 GB existing | $0.026/GB | $0.20 |
| Plan Storage | 1 GB new + 18 GB existing | $0.026/GB | $0.49 |
| Bandwidth (downloads) | ~50 GB/month | $0.12/GB | $6.00 |
| Cloud Functions (thumbnails) | 500 invocations | ~$0.01 | $0.01 |
| **Total** | | | **~$8/month** |

**3-Year Projection:** Growing to ~$50/month by year 3 (~200 GB storage)

#### Option 2: Integration Only (Google Drive)

| Item | Monthly Cost |
|------|--------------|
| API Development/Maintenance | ~$500 (amortized) |
| User Storage | $0 (users pay) |
| **Total Platform Cost** | **~$0/month** |

**Hidden Costs:**
- Users need Google Workspace or personal storage
- Lost control over data organization
- Support complexity for multiple providers

#### Option 3: Hybrid (Recommended)

| Item | Monthly Volume | Cost/Unit | Monthly Cost |
|------|----------------|-----------|--------------|
| Photos (Firebase) | 2.5 GB new + 45 GB | $0.026/GB | $1.24 |
| Small docs (Firebase) | 0.4 GB + 7.2 GB | $0.026/GB | $0.20 |
| Thumbnails generation | 500 invocations | ~$0.01 | $0.01 |
| Bandwidth | ~30 GB | $0.12/GB | $3.60 |
| Plans (user's Drive) | - | $0 | $0.00 |
| **Total** | | | **~$5/month** |

**3-Year Projection:** ~$30/month by year 3 (photos only grow in our storage)

### 7.3 Scaling Projections

| Scale | Projects | Est. Storage | Firebase Cost | AWS S3 Cost |
|-------|----------|--------------|---------------|-------------|
| Startup | 100 | 50 GB | $20/month | $15/month |
| Growing | 500 | 250 GB | $75/month | $60/month |
| Established | 1,000 | 500 GB | $150/month | $120/month |
| Scale | 5,000 | 2.5 TB | $700/month | $550/month |
| Enterprise | 10,000 | 5 TB | $1,400/month | $1,100/month |

*Includes estimated egress at 2x storage per month*

---

## 8. MVP Scope Recommendation

### 8.1 Core Question: Should ContractorOS Be a File Storage Platform?

**Answer: No, not primarily.**

ContractorOS should be a **construction project management platform** that handles files as a supporting feature, not a core differentiator. The document management market is mature with well-funded competitors (Procore: unlimited storage, Autodesk: BIM integration).

**Rationale:**
1. Competitors differentiate on storage - but also charge premium prices
2. Construction teams already have storage (Google Drive, Dropbox)
3. Photos are the most critical - 80% of field uploads
4. Building a DWG viewer is expensive - better to integrate
5. Integration reduces friction - connect to existing workflows

### 8.2 MVP Feature Scope

**In Scope (Phase 1 - MVP):**

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Photo uploads (job site) | P0 | Core field workflow |
| Receipt/invoice capture | P0 | Expense tracking requirement |
| RFI attachments | P0 | Linked to existing RFI feature |
| Basic folder structure | P1 | Project organization |
| Thumbnail generation | P1 | Performance for photo grids |
| Download/share | P1 | Basic file access |
| Mobile upload (camera) | P1 | Field usability |
| Permission-based access | P1 | Security requirement |

**Out of Scope (Phase 2+):**

| Feature | Phase | Rationale |
|---------|-------|-----------|
| Google Drive integration | Phase 2 | Plans/blueprints |
| Full-text search | Phase 2 | Complexity, cost |
| CAD file preview (DWG) | Phase 3 | Specialized viewers expensive |
| 3D model support | Phase 3 | BIM is specialized market |
| Video hosting | Phase 3 | Storage/bandwidth costs |
| Real-time collaboration | Phase 3 | Major feature |
| AI document classification | Phase 4 | Emerging technology |

### 8.3 MVP Success Criteria

1. **Photo Capture:** Field workers can capture and upload photos with project/task context in <10 seconds
2. **Document Access:** Users can find and view project documents within 3 clicks
3. **Mobile First:** Full functionality on iOS/Android browsers
4. **Offline Queue:** Photos queue for upload when connectivity returns
5. **Storage Limits:** Graceful handling when approaching quotas (notify admins)

---

## 9. Technical Architecture Proposal

### 9.1 Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ContractorOS Web/Mobile                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Photo Upload │    │ Doc Viewer   │    │ File Browser     │  │
│  │ Component    │    │ Component    │    │ Component        │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
│         │                   │                      │            │
│         ▼                   ▼                      ▼            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    File Service (lib/files/)                │ │
│  │  • uploadFile()  • getFileUrl()  • deleteFile()            │ │
│  │  • listFiles()   • getMetadata() • updateMetadata()        │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Infrastructure                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────────────────┐ │
│  │ Firebase Storage │         │ Firestore (contractoros db)  │ │
│  │                  │         │                              │ │
│  │ /orgs/{orgId}/   │         │ /organizations/{orgId}/      │ │
│  │   /projects/     │◄───────►│   /files/{fileId}            │ │
│  │     /{projectId}/│         │     - name                   │ │
│  │       /photos/   │         │     - storagePath            │ │
│  │       /docs/     │         │     - type                   │ │
│  │       /receipts/ │         │     - size                   │ │
│  │                  │         │     - projectId              │ │
│  └────────┬─────────┘         │     - uploadedBy             │ │
│           │                   │     - uploadedAt             │ │
│           │                   │     - thumbnailPath          │ │
│           ▼                   │     - linkedTo (RFI, Task)   │ │
│  ┌──────────────────┐         └──────────────────────────────┘ │
│  │ Cloud Functions  │                                          │
│  │ (Gen 2)          │                                          │
│  │                  │                                          │
│  │ • onFileUpload   │ <- Generates thumbnails                  │
│  │ • onFileDelete   │ <- Cleans up metadata                    │
│  │ • resizeImage    │ <- On-demand resize                      │
│  └──────────────────┘                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Firestore Schema

```typescript
// File metadata stored in Firestore (for querying)
interface FileDocument {
  id: string;
  name: string;
  originalName: string;
  storagePath: string;           // Firebase Storage path
  thumbnailPath?: string;        // Thumbnail storage path
  mimeType: string;
  size: number;                  // bytes
  type: 'photo' | 'document' | 'receipt' | 'plan' | 'other';

  // Organization
  orgId: string;
  projectId?: string;
  folderId?: string;

  // Context linking
  linkedEntityType?: 'rfi' | 'task' | 'changeOrder' | 'dailyLog' | 'expense';
  linkedEntityId?: string;

  // Metadata
  tags?: string[];
  description?: string;

  // Audit
  uploadedBy: string;
  uploadedAt: Timestamp;
  updatedBy?: string;
  updatedAt?: Timestamp;

  // Version control (simple)
  version: number;
  previousVersionId?: string;
}

// Folder structure
interface FolderDocument {
  id: string;
  name: string;
  parentId?: string;            // null for root folders
  projectId: string;
  orgId: string;
  createdBy: string;
  createdAt: Timestamp;
  fileCount: number;            // Denormalized for display
}
```

### 9.3 Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Organization file storage
    match /orgs/{orgId}/{allPaths=**} {
      allow read: if request.auth != null &&
        firestore.get(/databases/contractoros/documents/users/$(request.auth.uid)).data.orgId == orgId;

      allow write: if request.auth != null &&
        firestore.get(/databases/contractoros/documents/users/$(request.auth.uid)).data.orgId == orgId &&
        request.resource.size < 100 * 1024 * 1024; // 100MB limit

      allow delete: if request.auth != null &&
        firestore.get(/databases/contractoros/documents/users/$(request.auth.uid)).data.orgId == orgId;
    }
  }
}
```

### 9.4 File Service Implementation

```typescript
// lib/files/fileService.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface UploadOptions {
  projectId?: string;
  folderId?: string;
  type: 'photo' | 'document' | 'receipt' | 'plan' | 'other';
  linkedEntityType?: string;
  linkedEntityId?: string;
  tags?: string[];
  description?: string;
}

export async function uploadFile(
  orgId: string,
  userId: string,
  file: File,
  options: UploadOptions
): Promise<string> {
  const fileId = crypto.randomUUID();
  const extension = file.name.split('.').pop();
  const storagePath = buildStoragePath(orgId, options, fileId, extension);

  // Upload to Firebase Storage
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);

  // Create metadata document in Firestore
  const fileDoc = {
    name: file.name,
    originalName: file.name,
    storagePath,
    mimeType: file.type,
    size: file.size,
    type: options.type,
    orgId,
    projectId: options.projectId,
    folderId: options.folderId,
    linkedEntityType: options.linkedEntityType,
    linkedEntityId: options.linkedEntityId,
    tags: options.tags || [],
    description: options.description,
    uploadedBy: userId,
    uploadedAt: Timestamp.now(),
    version: 1,
  };

  const docRef = await addDoc(
    collection(db, 'organizations', orgId, 'files'),
    fileDoc
  );

  return docRef.id;
}

function buildStoragePath(
  orgId: string,
  options: UploadOptions,
  fileId: string,
  extension?: string
): string {
  const parts = ['orgs', orgId];

  if (options.projectId) {
    parts.push('projects', options.projectId);
  }

  parts.push(options.type + 's'); // photos, documents, receipts, etc.
  parts.push(`${fileId}.${extension}`);

  return parts.join('/');
}
```

---

## 10. Implementation Roadmap

### Phase 1: MVP File Storage (Sprint 41-42)

**Sprint 41: Core Infrastructure**
- [ ] Set up Firebase Storage bucket and rules
- [ ] Create file service (upload, download, delete)
- [ ] Create Firestore schema for file metadata
- [ ] Implement thumbnail generation Cloud Function
- [ ] Build FileUpload component (drag-drop, camera)

**Sprint 42: Integration & UI**
- [ ] Build FileBrowser component with folder structure
- [ ] Integrate file attachments with RFIs
- [ ] Integrate file attachments with Tasks
- [ ] Integrate file attachments with Daily Logs
- [ ] Build photo gallery view for projects
- [ ] Mobile-optimized upload experience

### Phase 2: Enhanced Features (Sprint 45-48)

- [ ] Google Drive integration for plans/blueprints
- [ ] OneDrive integration (optional)
- [ ] Basic version history
- [ ] Bulk upload/download
- [ ] File sharing with external users (signed URLs)
- [ ] Metadata search (filename, tags, date)

### Phase 3: Advanced Features (Sprint 50+)

- [ ] Full-text search with Algolia/Elasticsearch
- [ ] CAD file preview (DWG viewer)
- [ ] Document approval workflows
- [ ] Automatic file organization with AI
- [ ] Video upload and streaming
- [ ] Offline-first with background sync

---

## 11. Sources

### Competitor Documentation
- [Procore Document Management](https://www.procore.com/platform/document-management)
- [Buildertrend Document Control](https://buildertrend.com/blog/spotlight-on-document-control/)
- [Autodesk Docs 2026 Features](https://www.autodesk.com/products/autodesk-docs/features)
- [Bluebeam Document Management](https://www.bluebeam.com/workflows/drawing-and-document-management/)
- [Moving from PlanGrid to Autodesk Build](https://resources.imaginit.com/building-solutions-blog/moving-from-plangrid-to-autodesk-build-what-to-expect)

### Cloud Storage
- [Firebase Storage Pricing](https://firebase.google.com/pricing)
- [Google Cloud Storage Pricing](https://cloud.google.com/storage/pricing)
- [Cloud Storage Comparison](https://www.backblaze.com/cloud-storage/pricing)
- [AWS vs Azure vs GCP Comparison](https://www.techtarget.com/searchstorage/feature/AWS-vs-Azure-vs-Google-pricing-and-features-compared)

### Technical Implementation
- [Firebase Image Thumbnail Tutorial](https://fireship.io/lessons/image-thumbnail-resizer-cloud-function/)
- [Google Drive API Overview](https://developers.google.com/workspace/drive/api/guides/about-sdk)
- [Cloud API Integration Guide](https://hackernoon.com/how-to-implement-cloud-apis-google-drive-api-dropbox-api-and-onedrive-api)
- [Algolia PDF Indexing](https://support.algolia.com/hc/en-us/articles/4406981931281-Can-I-index-PDFs-Word-and-other-types-of-documents-)

### Construction Document Standards
- [Construction File Formats Guide](https://planexpress.net/blog/choosing-the-right-format-file-types-every-construction-company-should-consider)
- [CAD File Formats in Architecture](https://www.archdaily.com/930660/dwg-ifc-rvt-pln-most-common-file-extensions-in-architecture)
- [Blueprint File Format Comparison](https://www.erecordsusa.com/tiff-vs-pdf-vs-dwg)

---

## Appendix: Decision Matrix

### Storage Architecture Decision

| Criteria | Weight | Native Only | Integration Only | Hybrid (Rec.) |
|----------|--------|-------------|------------------|---------------|
| Development Speed | 25% | 2 | 4 | 4 |
| User Experience | 20% | 5 | 2 | 4 |
| Cost Efficiency | 20% | 3 | 5 | 4 |
| Feature Completeness | 15% | 4 | 3 | 3 |
| Maintenance Burden | 10% | 2 | 4 | 3 |
| Scalability | 10% | 4 | 4 | 4 |
| **Weighted Score** | 100% | **3.15** | **3.55** | **3.75** |

**Recommendation: Hybrid Approach** - Best balance of speed, cost, and user experience for ContractorOS MVP.
