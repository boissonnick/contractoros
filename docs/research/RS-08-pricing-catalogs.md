# Pricing Data & Supplier Catalog Integration Research

**Author:** Research Agent
**Date:** 2026-02-03
**Status:** Complete
**Sprint:** 40
**Reference:** RS-08

---

## Executive Summary

This document evaluates pricing data sources and supplier catalog integration options for ContractorOS. Contractors rely on a mix of **supplier-specific pricing**, **industry cost databases**, and **custom price books** for estimating and purchasing.

### Key Findings

1. **ABC Supply** offers the most comprehensive free API with real-time pricing, catalog data, and order management - ideal for roofing/exterior contractors
2. **RSMeans (Gordian)** remains the gold standard for industry cost data, with API access starting at ~$300/year
3. **Home Depot Pro Xtra** integration is available through partners like JobTread and Buildertrend for real-time member pricing
4. **SRS Distribution (Roof Hub)** offers robust SIPS API for roofing contractors with real-time pricing
5. **User-uploaded pricing** via CSV/Excel is table stakes - all competitors support this
6. **MasterFormat (CSI codes)** is the industry standard for organizing materials by trade/division

### Recommended Approach

**Phase 1 (MVP):** Custom price book with CSV/Excel import + MasterFormat categorization
**Phase 2:** ABC Supply API integration (free) for roofing/exterior contractors
**Phase 3:** SRS Distribution/Beacon (QXO) integrations for expanded roofing coverage
**Phase 4:** RSMeans data licensing for labor/material cost estimates
**Phase 5:** Home Depot/Lowe's integrations via partner APIs or eProcurement

---

## Table of Contents

1. [Supplier API Availability Matrix](#1-supplier-api-availability-matrix)
2. [Pricing Data Source Comparison](#2-pricing-data-source-comparison)
3. [Product Identification Standards](#3-product-identification-standards)
4. [Competitor Integration Analysis](#4-competitor-integration-analysis)
5. [Recommended Data Model](#5-recommended-data-model)
6. [MVP Feature Set](#6-mvp-feature-set)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Sources](#8-sources)

---

## 1. Supplier API Availability Matrix

| Supplier | Official API | Real-Time Pricing | Catalog Access | Order Placement | Cost | Notes |
|----------|--------------|-------------------|----------------|-----------------|------|-------|
| **ABC Supply** | Yes (SIPS) | Yes | Yes | Yes | Free | Best option - full API with documentation |
| **SRS Distribution** | Yes (Roof Hub) | Yes | Yes | Yes | Free | Strong roofing focus, Home Depot subsidiary |
| **Beacon/QXO** | Partner APIs | Yes | Yes | Yes | Via partners | JobNimbus, AccuLynx integrations |
| **Ferguson** | Limited (S2S) | Yes | Yes | Yes | Contact sales | System-to-System integration, complex setup |
| **Home Depot Pro** | Partner only | Yes | Yes | Limited | Via partners | JobTread, Buildertrend integrations |
| **Lowe's Pro** | Yes (8 APIs) | Yes | Yes | Yes | Contact sales | Official API portal + eProcurement |
| **84 Lumber** | EDI only | No | Limited | Yes | Via EDI provider | No direct API, EDI integration required |
| **Graybar Electric** | S2S/EDI | Yes | Yes | Yes | Contact sales | EDI, XML, proprietary formats |
| **Local Distributors** | Rarely | No | Manual | Manual | N/A | Typically PDF price lists only |

### ABC Supply API (Recommended First Integration)

ABC Supply offers the most contractor-friendly API ecosystem with these capabilities:

- **Pricing API**: Real-time pricing by branch and account
- **Product API**: Full catalog with descriptions, images, specs
- **Order API**: Place orders, track deliveries, receive webhooks
- **Account API**: Customer info, addresses, contacts
- **Notification API**: Webhooks for order/shipment status

**Integration Partners (Proven):**
- [Roofr](https://roofr.com/blog/roofr-launches-abc-supply-integration-with-real-time-pricing-direct-material-ordering) - Real-time pricing & direct ordering (March 2025)
- [JobNimbus](https://support.jobnimbus.com/what-brands-are-partnered-with-srs-distribution) - Full visibility to pricing, orders, deliveries
- [Leap CRM](https://www.abcsupply.com/media-center/press-release/abc-supply-and-leap-partner-to-make-roofing-material-ordering-easier-for-contractors/) - Browse catalog, branch-level pricing, verified orders (Sept 2025)
- [ServiceTitan](https://www.servicetitan.com/press/servicetitan-announces-integration-abc-supply) - Branch-specific pricing synced nightly (June 2025)
- [AccuLynx](https://acculynx.com/integrations/abc-supply/) - Order from ABC Supply without leaving AccuLynx
- [RoofIT CRM](https://www.abcsupply.com/news-events/roofit-crm-announces-a-seamless-integration-with-abc-supply-to-streamline-material-ordering-for-roofing-contractors/) - Generate POs, submit material lists, track orders

**Key Benefits:**
- Free API access (no cost for integration)
- Sandbox environment available for development
- Real-time product, pricing, and location data
- Direct order placement and delivery tracking

### SRS Distribution (Roof Hub SIPS API)

SRS Distribution's Integration Partner Services (SIPS) is a robust API platform:

- **API Documentation**: [apidocs.roofhub.pro](https://apidocs.roofhub.pro/)
- **Features**: Real-time pricing, product availability, order management
- **Parent Company**: Home Depot subsidiary (acquired 2024)
- **Coverage**: 800+ locations across 48 states

**Digital Estimator Tool** (Nov 2024):
- Generate detailed project estimates with real-time costs
- Materials, labor, taxes, overhead, profit margins, discounts
- Convert estimates into orders with single click
- Workflow dashboard for project tracking

**Integration Partners:**
- Roofr - Real-time pricing and material ordering (July 2025)
- RoofLink - First direct-to-distribution integration
- Leap CRM - Live pricing and direct ordering
- AccuLynx, JobNimbus, Giddyup, EagleView, GAF QuickMeasure, Hover

### Beacon/QXO (Largest Roofing Distributor)

Beacon (now QXO after $11B acquisition) offers digital integration through Beacon PRO+:

- **Smart Order Feature**: First-to-market digital tool using EagleView aerial imagery
- **Integration Method**: Partner-based (JobNimbus, AccuLynx)
- **Ambition 2025**: 25% of sales digital by end of 2025

**JobNimbus Integration Features:**
- Auto-sync Beacon products with JobNimbus
- Real-time cost updates when creating estimates/material orders
- Live pricing and direct ordering

### Ferguson Enterprises (System-to-System)

Ferguson offers digital S2S solutions but requires direct engagement:

- **Contact**: (888) 222-1785 or technology.solutions@ferguson.com
- **Online Services**: Live pricing and inventory on ferguson.com
- **Mobile App**: Barcode scanning, order tracking, My Lists
- **Integration Complexity**: High (custom implementation required)
- **Community Reports**: Mixed experiences with API access (some report months of effort)

Ferguson also partners with Buildertrend's Group Purchasing program for builders.

### Home Depot Pro Integration

No official public API, but integration available through:

**JobTread Partnership** (August 2025):
- Connect Pro Xtra account for member-specific pricing
- Real-time pricing automatically applies to Global Catalog
- All users in organization benefit from integrated pricing

**Buildertrend Integration:**
- 95,560 catalog items synced from Home Depot
- 25 months of past purchases can be synced
- Check availability, confirm pricing, push to cart, track expenses

**Third-Party Data APIs** (not recommended for production):
- SerpApi, Apify, BigBox API - scraping services starting at $15/month
- Risk of terms of service violations

### Lowe's Pro Options

Lowe's offers multiple integration paths:

**Official APIs for Service Providers (8 APIs available):**
- Receive job details and dates from portal
- Send updates when jobs are completed
- Contact: SpecialtySalesSystemSupport@Lowes.com

**ProjectsForce Integration:**
- Real-time synchronization of customer/site details
- Notes, documents, activities, payment information
- Close partnership for API enhancement testing

**eProcurement Integration:**
- Punchout with Ariba, JAGGAER, Coupa, OpsTechnology
- Custom catalogs, automated invoicing, omnichannel buying
- Dedicated support and compliance controls

**Pro Extended Aisle** (Early 2025):
- Expanded digital catalog
- Real-time inventory and pricing
- Supplier services including job site and rooftop delivery

**MyLowe's Pro Rewards** (Early 2025):
- Enhanced Pro loyalty program
- 5% discount on eligible purchases with associated credit card

### Electrical Supply Distributors

**Graybar Electric:**
- Digital integration through Graybar.com
- Supports EDI, XML, and proprietary data formats
- Direct system-to-system integration available
- Primarily targets larger contractors (55-59% of sales contractor-oriented)
- "Graybar Connect" transformation initiative underway

**WESCO:**
- World leader in electrical, communications, and utility distribution
- B2B distribution and supply chain services

### 84 Lumber (EDI Only)

No direct API - requires EDI integration:

- **EDI Providers**: Cleo Integration Cloud, Logicbroker, Synctify
- **Common EDI Transactions**:
  - 850 (Purchase Order)
  - 810 (Invoice)
  - 856 (ASN - Advanced Shipping Notice)
- **OMNIA Partners**: National cooperative contract available

---

## 2. Pricing Data Source Comparison

### Industry Cost Databases

| Provider | Coverage | Update Frequency | API | Cost | Best For |
|----------|----------|------------------|-----|------|----------|
| **RSMeans (Gordian)** | 92,000+ line items, 970+ locations | Quarterly | Yes | $300-$5,973/yr | Comprehensive estimates |
| **Craftsman Book** | 30,000+ estimates | Quarterly materials | Yes | $19-$117/item | Residential/remodeling |
| **RemodelMAX** | 12,000+ parts, 400+ areas | Quarterly | Via Clear Estimates | Bundled | Remodeling contractors |
| **HomeAdvisor/Angi** | Consumer project costs | Rolling | No | Free guides | Quick cost ranges |

### RSMeans Data (Recommended for Labor/Material Costs)

RSMeans by Gordian is the industry standard for construction cost data:

- **Coverage**: 92,000+ unit line items (labor, materials, equipment)
- **Localization**: 970+ locations across North America
- **Data Types**: Unit costs, crew productivity, equipment rates
- **API**: REST API available ([dataapi-sb.gordian.com](https://dataapi-sb.gordian.com/swagger/ui/index.html))
- **Updates**: Quarterly (April, July, October, January)

**Pricing Tiers (2026):**

| Tier | Annual Cost | Features |
|------|-------------|----------|
| **Core** | Starting at $300/yr | Materials, labor, equipment costs + basic tools |
| **Complete** | $1,019/yr | Historical cost analysis + greater depth |
| **Complete Plus** | $5,973/yr | ML-powered predictive costs (3-year forecast) |

**Key Features:**
- Exclusive quarterly updates for cost accuracy
- 85,000 unit prices, 25,000 building assemblies
- 42,000 facilities repair and remodeling costs
- Free trial available

### Craftsman Book Company

Alternative to RSMeans with affordable licensing:

- **74th Annual Edition** (2026): National Construction Estimator
- **Coverage**: Every common building material with labor costs
- **Data Sources**: Contractors, subcontractors, suppliers, engineering firms

**Products & Pricing:**

| Product | Price | Description |
|---------|-------|-------------|
| National Construction Estimator | $58.75 - $117.50 | Residential, commercial, industrial costs |
| National Building Cost Manual | $49.00+ | Building cost data |
| National Electrical Estimator | $58.88+ | Electrical trade costs |
| National Plumbing & HVAC Estimator | $59.13+ | Mechanical trade costs |
| National Estimator Cloud | Monthly subscription | All 10 costbooks, quarterly material updates |
| National Appraisal Estimator | $19.49/month | Replacement cost for appraisals |

### RemodelMAX (Clear Estimates Data Source)

Clear Estimates uses RemodelMAX as its pricing backbone:

- **Coverage**: 12,000+ parts with localized pricing for 400+ US areas
- **Updates**: Quarterly to reflect real-world inflation and market shifts
- **Templates**: 60+ job templates (garages, bathrooms, kitchens, additions)
- **Credibility**: Same data used by Remodeling Magazine's Cost vs. Value Report

**Clear Estimates Pricing:**
- Pro: $99-119/month (13,000+ line items, 200+ templates)
- Franchise: $199-249/month

### HomeAdvisor/Angi True Cost Guide

Consumer-focused cost data:

- **Data Source**: Real-world projects from HomeAdvisor marketplace
- **Collection Period**: Consumer-reported pricing from January 1998 - present
- **Methodology**: Rolling median of consumer reported pricing
- **Statistical Approach**: Standard deviation divided by mean (1st-3rd quantile)
- **Annual Report**: True Cost Report by Chief Economist

---

## 3. Product Identification Standards

### Construction-Specific Standards

| Standard | Maintained By | Purpose | Use in ContractorOS |
|----------|---------------|---------|---------------------|
| **MasterFormat** | CSI/CSC | Work results classification (50 divisions) | Primary categorization |
| **UniFormat** | CSI | Building elements classification | Element-based estimates |
| **OmniClass** | CSI | Comprehensive BIM classification (15 tables) | BIM integration (future) |
| **MPN** | Manufacturers | Manufacturer Part Numbers | Product identification |

### MasterFormat (Recommended Primary Classification)

MasterFormat is the "Dewey Decimal System" for construction, developed by CSI:

- **Structure**: 50 divisions, 3-part numbering (XX XX XX.XX)
- **Purpose**: Organize specifications and cost data
- **Adoption**: Universal in North American construction
- **History**: Original 16 divisions (1963), expanded to 50 divisions (2004)

**Key Divisions for Contractors:**

| Division | Name | Examples |
|----------|------|----------|
| 03 | Concrete | Footings, slabs, walls |
| 04 | Masonry | Brick, block, stone |
| 06 | Wood, Plastics, Composites | Framing, millwork, cabinets |
| 07 | Thermal and Moisture Protection | Roofing, insulation, waterproofing |
| 08 | Openings | Doors, windows, hardware |
| 09 | Finishes | Drywall, paint, flooring, tile |
| 22 | Plumbing | Fixtures, piping, water heaters |
| 23 | HVAC | Ductwork, equipment, controls |
| 26 | Electrical | Wiring, panels, fixtures |
| 31 | Earthwork | Grading, excavation |
| 32 | Exterior Improvements | Paving, landscaping, fencing |

**Benefits:**
- Standardized framework for bidding and estimating
- Universal terminology reduces miscommunication
- Enables precise cost projections by component
- Essential for commercial and institutional projects

### Universal Product Identifiers

| Type | Format | Use Case | Notes |
|------|--------|----------|-------|
| **UPC** | 12-digit numeric | Big-box retail products | Universal, tracked by GS1 |
| **GTIN** | 8-14 digits | Global trade identification | Umbrella standard for UPC/EAN |
| **SKU** | Alphanumeric (custom) | Retailer-specific inventory | Internal to each company |
| **MPN** | Varies by manufacturer | Manufacturer identification | Cross-supplier matching |

**GS1 Standards:**
- UPC-A (GTIN-12): 12-digit standard for North America
- EAN/UCC-8 (GTIN-8): 8-digit compact format
- GTIN-13: International standard
- GTIN-14: Packaging hierarchy

### Construction Materials Identification

Building codes require product identification:
- Roof-covering materials: Manufacturer marks + testing agency labels
- Bulk shipments: Certificates or bill of lading
- Load-bearing steel: Per AISI S240, Section A5.5
- Third-party certification: Listing agency insignia required

---

## 4. Competitor Integration Analysis

### How Competitors Handle Pricing

| Platform | Supplier Integrations | Cost Data | Price Import | Approach |
|----------|----------------------|-----------|--------------|----------|
| **JobTread** | Home Depot Pro Xtra | RSMeans add-on | CSV/Excel | Partner integrations |
| **Buildertrend** | Home Depot (95K items), Ferguson, Lowe's | None built-in | Excel | Group Purchasing Program |
| **Procore** | Construction Marketplace | Optional RSMeans | Custom import | ERP integration + marketplace |
| **AccuLynx** | ABC Supply, QXO/Beacon | None built-in | Excel | Direct supplier APIs |
| **Roofr** | ABC Supply, SRS Distribution | None built-in | Built-in catalog | Real-time pricing sync |
| **JobNimbus** | ABC Supply, SRS, Beacon, QXO | None built-in | Excel | Multi-supplier integrations |
| **ServiceTitan** | ABC Supply, Ferguson | None built-in | Excel template | Enterprise focus |
| **CoConstruct** | QuickBooks, Xero | User-maintained catalog | Cost Catalog | Manual updates |
| **Clear Estimates** | None | RemodelMAX (12K items) | None needed | Bundled cost data |
| **Contractor+** | ABC Supply | Craftsman | CSV/Excel | Freemium model |

### Procore Cost Catalog

Procore's approach to materials pricing:

**Features:**
- Gallery of predefined materials
- Add and customize parts or assemblies
- Supplier field tracking
- ERP cost code integration
- Import/Export via Microsoft Excel

**Construction Marketplace Integration:**
- Digital catalog of building products
- Find products and suppliers
- AI services for cost/delivery optimization
- Request quotes and track materials

**Materials Price Tracker:**
- Latest U.S. retail prices
- Historical trends for common materials
- Trade-specific pricing (cement, lumber, metal, roofing)

### Buildertrend Integration Strategy

Buildertrend takes a comprehensive approach:

**Home Depot Integration:**
- 95,560 catalog items synced and cost coded
- 25 months of past purchases syncable
- Availability checking, pricing confirmation
- Direct cart management and expense tracking

**Group Purchasing Program:**
- Collective buying power of Buildertrend users
- Exclusive pricing, cashback, and discounts
- Supplier partners: Ferguson, Lowe's, and others
- Future: Builder-supplier marketplace

### JobNimbus Multi-Supplier Strategy

JobNimbus offers the most extensive supplier network:

**Integrated Suppliers:**
- Beacon Pro+ (real-time costs, auto-synced templates)
- ABC Supply (live pricing, direct ordering, delivery updates)
- SRS Distribution (Roof Hub - live pricing, direct ordering)
- QXO (exact pricing, accurate availability)

**User Testimonial:**
> "The recent integration with Beacon has been incredible! We now build Material Orders in JobNimbus which pull from Beacon's online ordering portal. This eliminates the time for suppliers to enter orders into their system and reduces mistakes during re-entry."

### Import Format Standards

All major platforms support similar import formats:

**Required Fields:**
- Item/Material Name
- Category (often maps to MasterFormat)
- Unit of Measure
- Unit Cost
- Vendor/Supplier (optional)
- Description (optional)
- SKU/Part Number (optional)

**Supported Formats:**
- CSV (comma-separated)
- TSV (tab-separated)
- Excel (.xls, .xlsx)
- XML (some platforms)

**Best Practices:**
- Provide downloadable template with correct column structure
- Column mapping wizard for flexible imports
- Validation with error reporting
- LMN limits to 1,000 items per import with rollback feature
- Contractor+ requires Material Name, Vendor Name, Price minimum

### Punchout Catalog Integration

Enterprise-level integration option:

**How It Works:**
1. Buyer logs into eProcurement system
2. Selects supplier's catalog
3. System authenticates and establishes secure session
4. Redirected to supplier's e-commerce site
5. Shopping cart transferred back to eProcurement
6. Cart converted to purchase requisition

**Protocols:**
- cXML: Used by JAGGAER, Coupa
- OCI: SAP platforms

**Benefits:**
- Centralized supplier management
- Reduces manual data entry errors
- Real-time product/pricing information
- Automatic order transmission

**Providers:**
- Greenwing Technology (15+ years experience)
- TradeCentric
- Microsoft Dynamics 365 support

---

## 5. Recommended Data Model

### Core Entities

```typescript
// Price Catalog (user's custom price book)
interface PriceCatalog {
  id: string;
  orgId: string;
  name: string;              // "2026 Standard Rates"
  description?: string;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Price Item (individual material/labor/equipment)
interface PriceItem {
  id: string;
  orgId: string;
  catalogId: string;

  // Identification
  name: string;              // "2x4x8 SPF Stud"
  description?: string;
  sku?: string;              // User's internal SKU
  manufacturerPartNumber?: string;
  upc?: string;              // Universal Product Code

  // Classification
  masterFormatCode?: string; // "06 11 00" (Wood Framing)
  category: string;          // "Lumber"
  subcategory?: string;      // "Dimensional Lumber"

  // Pricing
  unitCost: number;          // Cost to contractor
  unitPrice?: number;        // Price to customer (with markup)
  defaultMarkup?: number;    // Percentage markup
  unit: string;              // "EA", "LF", "SF", "CY", etc.

  // Supplier Info
  preferredVendor?: string;  // "ABC Supply"
  vendorSku?: string;        // Supplier's SKU
  vendorUrl?: string;        // Link to product page

  // Metadata
  isActive: boolean;
  lastPriceUpdate: Timestamp;
  priceSource?: 'manual' | 'import' | 'api' | 'rsmeans';

  // Optional
  imageUrl?: string;
  notes?: string;
  tags?: string[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Price History (track price changes)
interface PriceHistory {
  id: string;
  itemId: string;
  previousCost: number;
  newCost: number;
  changedAt: Timestamp;
  changedBy?: string;
  source?: string;           // "manual", "csv_import", "abc_api"
}

// Supplier Connection (for API integrations)
interface SupplierConnection {
  id: string;
  orgId: string;
  supplier: 'abc_supply' | 'srs_distribution' | 'beacon' | 'ferguson' | 'home_depot' | 'lowes';
  accountNumber?: string;
  branchId?: string;
  credentials: {
    // Encrypted, stored securely
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Timestamp;
  };
  lastSync?: Timestamp;
  status: 'active' | 'inactive' | 'error';
  createdAt: Timestamp;
}

// Import Job (track CSV/Excel imports)
interface ImportJob {
  id: string;
  orgId: string;
  catalogId: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors?: ImportError[];
  startedAt: Timestamp;
  completedAt?: Timestamp;
  createdBy: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}
```

### Unit of Measure Standards

```typescript
const UNITS = {
  // Count
  EA: 'Each',
  PR: 'Pair',
  SET: 'Set',
  BX: 'Box',
  CTN: 'Carton',
  PKG: 'Package',

  // Length
  LF: 'Linear Feet',
  IN: 'Inches',

  // Area
  SF: 'Square Feet',
  SY: 'Square Yards',
  SQ: 'Roofing Square (100 SF)',

  // Volume
  CF: 'Cubic Feet',
  CY: 'Cubic Yards',
  GAL: 'Gallons',

  // Weight
  LB: 'Pounds',
  TON: 'Tons',

  // Time
  HR: 'Hours',
  DAY: 'Days',
  WK: 'Weeks',
  MO: 'Months',

  // Other
  BAG: 'Bag',
  ROLL: 'Roll',
  SHEET: 'Sheet',
  BDL: 'Bundle',
} as const;
```

### MasterFormat Categories (Top Level)

```typescript
const MASTERFORMAT_DIVISIONS = {
  '00': 'Procurement and Contracting Requirements',
  '01': 'General Requirements',
  '02': 'Existing Conditions',
  '03': 'Concrete',
  '04': 'Masonry',
  '05': 'Metals',
  '06': 'Wood, Plastics, and Composites',
  '07': 'Thermal and Moisture Protection',
  '08': 'Openings',
  '09': 'Finishes',
  '10': 'Specialties',
  '11': 'Equipment',
  '12': 'Furnishings',
  '13': 'Special Construction',
  '14': 'Conveying Equipment',
  '21': 'Fire Suppression',
  '22': 'Plumbing',
  '23': 'Heating, Ventilating, and Air Conditioning (HVAC)',
  '25': 'Integrated Automation',
  '26': 'Electrical',
  '27': 'Communications',
  '28': 'Electronic Safety and Security',
  '31': 'Earthwork',
  '32': 'Exterior Improvements',
  '33': 'Utilities',
  '34': 'Transportation',
  '35': 'Waterway and Marine Construction',
  '40': 'Process Integration',
  '41': 'Material Processing and Handling Equipment',
  '42': 'Process Heating, Cooling, and Drying Equipment',
  '43': 'Process Gas and Liquid Handling',
  '44': 'Pollution and Waste Control Equipment',
  '45': 'Industry-Specific Manufacturing Equipment',
  '46': 'Water and Wastewater Equipment',
  '48': 'Electrical Power Generation',
} as const;
```

---

## 6. MVP Feature Set

### Phase 1: Custom Price Book (Sprint 41-42)

**Core Features:**
- [ ] Create/manage multiple price catalogs
- [ ] Add/edit/delete price items manually
- [ ] Organize items by MasterFormat division and category
- [ ] Search and filter items
- [ ] Set default markups per item or category
- [ ] Track price history (last 3 changes)

**Import/Export:**
- [ ] CSV/Excel import with column mapping wizard
- [ ] Downloadable import template
- [ ] Import validation with error reporting (limit 1,000 rows per import)
- [ ] CSV export for backup/sharing
- [ ] Bulk update via re-import
- [ ] Rollback feature for import mistakes

**Integration with Estimates:**
- [ ] Pull items from price book into estimates
- [ ] Auto-calculate pricing with markup
- [ ] Link estimate line items to catalog items

### Phase 2: ABC Supply Integration (Sprint 43-44)

**Connection:**
- [ ] OAuth flow to connect ABC Supply account
- [ ] Branch selection
- [ ] Account/pricing tier detection

**Real-Time Data:**
- [ ] Product search within ContractorOS
- [ ] Real-time pricing lookup by branch
- [ ] Inventory availability check
- [ ] Add ABC products to price catalog

**Order Management (Future):**
- [ ] Create purchase orders from estimates
- [ ] Send orders to ABC Supply
- [ ] Track order status via webhooks
- [ ] Sync delivery updates

### Phase 3: SRS Distribution Integration (Sprint 44-45)

**Connection:**
- [ ] SIPS API integration
- [ ] Roof Hub account connection
- [ ] Branch selection

**Features:**
- [ ] Product search
- [ ] Real-time pricing
- [ ] Availability checking
- [ ] Direct material ordering

### Phase 4: RSMeans Data (Sprint 46+)

**Cost Database Access:**
- [ ] RSMeans API integration (requires licensing)
- [ ] Search RSMeans line items
- [ ] Import RSMeans items to price catalog
- [ ] Location-based cost adjustment
- [ ] Labor productivity data

**Estimating Enhancement:**
- [ ] Assembly/system-based estimating
- [ ] Labor + material + equipment breakdown
- [ ] Historical cost comparison

### Phase 5: Additional Suppliers (Sprint 47+)

- [ ] Beacon/QXO via partner model
- [ ] Home Depot Pro via JobTread partnership or direct
- [ ] Lowe's Pro API integration
- [ ] Ferguson S2S integration
- [ ] Local supplier EDI (84 Lumber, etc.)

---

## 7. Implementation Roadmap

### Sprint 41-42: Price Book MVP

**Week 1-2: Data Model & Basic UI**
```
- Add Firestore collections: priceCatalogs, priceItems, priceHistory
- Add Firestore rules for org-scoped access
- Create PriceCatalogList component
- Create PriceItemTable with search/filter
- Create AddEditPriceItemModal
```

**Week 3-4: Import/Export**
```
- Build CSV parser with Papa Parse
- Create column mapping wizard UI
- Add import validation and error display
- Implement batch insert for large imports (max 1,000 rows)
- Add CSV export functionality
- Implement rollback for failed imports
```

**Week 5: Integration with Estimates**
```
- Add "Add from Price Book" to estimate line items
- Auto-populate cost/price from catalog
- Track catalog item reference on estimate items
```

### Sprint 43-44: ABC Supply Integration

**Week 1: OAuth & Connection**
```
- Register for ABC Supply API access
- Implement OAuth 2.0 flow
- Store encrypted credentials in Firestore
- Create SupplierConnectionsPage
```

**Week 2-3: Product Search & Pricing**
```
- Build ABC Supply product search component
- Display real-time pricing by branch
- Add "Import to Catalog" functionality
- Handle API rate limits and caching
```

**Week 4: Webhooks & Sync**
```
- Set up webhook endpoint for ABC notifications
- Implement periodic price sync (optional)
- Add supplier connection status monitoring
```

### Sprint 44-45: SRS Distribution Integration

**Week 1: SIPS API Setup**
```
- Register for SRS SIPS API access
- Review apidocs.roofhub.pro documentation
- Implement authentication flow
```

**Week 2-3: Integration Features**
```
- Product catalog search
- Real-time pricing by branch
- Order placement workflow
- Delivery tracking
```

### Sprint 46+: RSMeans & Additional Suppliers

**RSMeans Integration:**
```
- License RSMeans API access ($300+/year)
- Build RSMeans search interface
- Implement location-based cost adjustment
- Create assembly estimating workflow
```

**Additional Suppliers:**
```
- Evaluate JobTread partnership for Home Depot
- Contact Lowe's for API access (SpecialtySalesSystemSupport@Lowes.com)
- Assess Ferguson S2S requirements (technology.solutions@ferguson.com)
- Research EDI providers for 84 Lumber (Cleo, Logicbroker)
```

---

## 8. Sources

### Supplier APIs & Integration

**ABC Supply:**
- [ABC Supply - Roofr Integration Press Release](https://www.abcsupply.com/media-center/press-release/roofr-launches-abc-supply-integration-with-real-time-pricing-direct-material-ordering/)
- [ABC Supply - JobNimbus Partnership](https://www.abcsupply.com/media-center/press-release/abc-supply-and-jobnimbus-join-forces-to-enhance-solutions-for-roofing-contractors/)
- [ABC Supply - Leap CRM Integration](https://www.abcsupply.com/media-center/press-release/abc-supply-and-leap-partner-to-make-roofing-material-ordering-easier-for-contractors/)
- [ServiceTitan - ABC Supply Integration](https://www.servicetitan.com/press/servicetitan-announces-integration-abc-supply)
- [AccuLynx - ABC Supply Integration](https://acculynx.com/integrations/abc-supply/)

**SRS Distribution:**
- [SRS Integration Partner Services (SIPS) Documentation](https://apidocs.roofhub.pro/)
- [Roofr - SRS Distribution Partnership](https://roofr.com/blog/roofr-and-srs-distribution-partner-to-streamline-material-ordering-with-real-time-pricing-integration)
- [SRS Distribution Digital Estimator Tool](https://www.digitalcommerce360.com/2024/11/21/srs-distribution-unveils-advanced-digital-tool-for-roofing-contractors/)

**Beacon/QXO:**
- [QXO (Formerly Beacon Building Products)](https://www.becn.com/beacon-pro-plus)
- [JobNimbus - Beacon Integration](https://support.jobnimbus.com/how-do-i-enable-the-jobnimbus-integration-with-beacon)
- [AccuLynx - QXO Integration](https://acculynx.com/integrations/qxo/)

**Ferguson:**
- [Ferguson Online Solutions](https://www.ferguson.com/content/online-solutions)
- [Ferguson ServiceTitan Community Discussion](https://community.servicetitan.com/t5/Inventory/Ferguson-Enterprises-Intergration/td-p/19026)

**Home Depot Pro:**
- [Home Depot Pro Integrations](https://www.homedepot.com/c/pro-integrations)
- [JobTread - Home Depot Pro Xtra Integration](https://www.jobtread.com/product-updates/2025-08-19-home-depot-pro-xtra-integration)
- [Buildertrend - Home Depot Integration Data](https://buildertrend.com/blog/construction-supply-management-data/)

**Lowe's Pro:**
- [Lowe's eProcurement](https://www.lowes.com/l/Pro/epro)
- [ProjectsForce - Lowe's API Integration](https://www.projectsforce.com/lowe-s-api-integration)
- [Lowe's Pro Extended Aisle](https://www.digitalcommerce360.com/2024/12/13/lowes-pro-contractors-ai-integration/)
- [Cleo - Lowe's EDI Integration](https://www.cleo.com/trading-partner-network/lowes)

**Other Suppliers:**
- [84 Lumber OMNIA Partners](https://www.omniapartners.com/suppliers/84-lumber/public-sector)
- [Graybar Services](https://www.graybar.com/services)

### Cost Data Providers

- [RSMeans Data by Gordian](https://www.rsmeans.com/)
- [RSMeans API Explorer](https://dataapi-sb.gordian.com/swagger/ui/index.html)
- [RSMeans Pricing Tiers](https://www.rsmeans.com/products/online/tiers)
- [Craftsman Book Company](https://craftsman-book.com/)
- [National Construction Estimator 2026](https://craftsman-book.com/national-construction-estimator)
- [National Estimator Cloud](https://www.craftsmansitelicense.com/)
- [Clear Estimates](https://www.clearestimates.com/)
- [Angi - How We Get Our Cost Data](https://www.angi.com/standards/about-our-cost-data-page.htm)

### Classification Standards

- [MasterFormat - CSI](https://www.csiresources.org/standards/masterformat)
- [MasterFormat Guide - Procore](https://www.procore.com/library/csi-masterformat)
- [Understanding CSI MasterFormat - RSMeans](https://www.rsmeans.com/resources/csi-masterformat)
- [GS1 US - UPC Codes](https://www.gs1us.org/upcs-barcodes-prefixes/guide-to-upcs)
- [Product Identifiers Guide - Commport](https://www.commport.com/decoding-product-identifiers/)

### Competitor Implementations

- [Procore Cost Catalog](https://support.procore.com/products/online/user-guide/company-level/cost-catalog)
- [Procore Construction Marketplace](https://www.procore.com/whats-new/en/construction-marketplace)
- [Buildertrend Material Management](https://buildertrend.com/material-management/)
- [Buildertrend Group Purchasing](https://buildertrend.com/blog/buildertrend-group-purchasing/)
- [JobNimbus Integrations](https://www.jobnimbus.com/integrations)
- [CoConstruct Estimating](https://www.coconstruct.com/features/construction-estimating-software)

### Price Book Import Patterns

- [Contractor+ - Material Import](https://support.contractorplus.app/en/articles/9868729-how-to-import-materials-in-contractor)
- [JobTread Cost Catalog](https://www.jobtread.com/features/cost-catalog)
- [Buildern Cost Catalog Software](https://buildern.com/features/construction-cost-catalog)
- [BrickControl Price Database](https://www.brickcontrol.com/product/costs-databases/)
- [LMN Price List FAQ](https://support.golmn.com/hc/en-us/articles/11936053695515-Price-List-FAQ)

### EDI & Integration Standards

- [EDI for Construction - First B2B](https://www.firstb2b.com/industry/construction-supplies-and-merchants)
- [EDI for Lumber Industry - Commport](https://www.commport.com/edi-for-lumber-and-building-supplies-industry/)
- [Punchout Catalogs - TradeCentric](https://tradecentric.com/blog/punchout-catalog/)
- [Punchout Catalog Guide - Procurify](https://www.procurify.com/blog/punchout-catalog/)

---

## Appendix A: Import Template Schema

### CSV Template Columns

| Column | Required | Type | Example |
|--------|----------|------|---------|
| name | Yes | String | "2x4x8 SPF Stud" |
| category | Yes | String | "Lumber" |
| subcategory | No | String | "Dimensional Lumber" |
| masterformat_code | No | String | "06 11 00" |
| unit | Yes | String | "EA" |
| unit_cost | Yes | Number | 3.49 |
| unit_price | No | Number | 4.89 |
| markup_percent | No | Number | 40 |
| sku | No | String | "LUM-2x4-8" |
| manufacturer | No | String | "Generic" |
| mpn | No | String | "" |
| vendor | No | String | "ABC Supply" |
| vendor_sku | No | String | "12345678" |
| description | No | String | "Kiln-dried..." |
| notes | No | String | "Check stock" |
| tags | No | String | "framing,rough" |

### Sample CSV Content

```csv
name,category,subcategory,unit,unit_cost,unit_price,markup_percent,vendor
"2x4x8 SPF Stud",Lumber,Dimensional Lumber,EA,3.49,4.89,40,ABC Supply
"2x6x12 SPF",Lumber,Dimensional Lumber,EA,7.99,11.19,40,ABC Supply
"1/2 in. x 4 ft. x 8 ft. Drywall",Drywall,Gypsum Board,SHEET,12.50,17.50,40,Home Depot
"R-13 Faced Insulation 15 in. x 40 ft.",Insulation,Fiberglass,ROLL,22.00,30.80,40,Lowe's
```

---

## Appendix B: API Examples

### ABC Supply OAuth 2.0

```typescript
// OAuth flow for ABC Supply
const ABC_AUTH_URL = 'https://auth.abcsupply.com/oauth/authorize';
const ABC_TOKEN_URL = 'https://auth.abcsupply.com/oauth/token';

// Redirect user to ABC Supply login
const getAuthUrl = (clientId: string, redirectUri: string) => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'products pricing orders',
  });
  return `${ABC_AUTH_URL}?${params}`;
};
```

### Product Search

```typescript
// GET /products/search?q=lumber&branch=12345
interface ABCProductSearchResult {
  products: {
    productId: string;
    name: string;
    description: string;
    categoryCode: string;
    upc?: string;
    imageUrl?: string;
    unitOfMeasure: string;
  }[];
  totalResults: number;
  page: number;
  pageSize: number;
}
```

### Real-Time Pricing

```typescript
// GET /pricing?productId=ABC123&branchId=12345&accountId=67890
interface ABCPricingResult {
  productId: string;
  branchId: string;
  pricing: {
    unitPrice: number;
    currency: 'USD';
    priceBreaks?: {
      minQuantity: number;
      unitPrice: number;
    }[];
  };
  availability: {
    inStock: boolean;
    quantityOnHand: number;
    leadTimeDays?: number;
  };
  lastUpdated: string; // ISO 8601
}
```

### RSMeans API Example

```typescript
// RSMeans REST API (dataapi-sb.gordian.com)
interface RSMeansLineItem {
  lineNumber: string;       // "03 11 13.40 0100"
  description: string;      // "Formwork, structural..."
  unit: string;             // "SFCA"
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  totalCost: number;
  laborHours: number;
  crewCode: string;
  location: {
    city: string;
    state: string;
    localFactor: number;    // Location adjustment multiplier
  };
}
```

---

## Appendix C: Cost-Benefit Analysis

### Build vs. Buy Decision Matrix

| Approach | Cost | Time to Market | Maintenance | Flexibility |
|----------|------|----------------|-------------|-------------|
| Build custom price book only | Low | 4-6 weeks | Low | High |
| Integrate ABC Supply API | Low (free API) | 6-8 weeks | Medium | Medium |
| Add SRS Distribution | Low (free API) | 4-6 weeks | Medium | Medium |
| License RSMeans data | $300-6k/yr | 8-12 weeks | Medium | Medium |
| Full EDI integration | $10k+ setup | 12-16 weeks | High | Low |

### ROI Considerations

**ABC Supply + SRS Integration:**
- Free API access reduces material cost research time
- Real-time pricing improves estimate accuracy by 10-15%
- Order placement reduces procurement cycle by 2-3 days
- Target users: Roofing, siding, exterior contractors
- Combined coverage: 800+ SRS locations + ABC Supply network

**RSMeans Integration:**
- Industry-standard cost data increases bid credibility
- Labor productivity data improves project scheduling
- Location adjustment ensures regional accuracy (970+ locations)
- Target users: General contractors, commercial builders
- Differentiator: Complete Plus tier offers 3-year cost forecasting

**Custom Price Book:**
- Immediate value for all contractor types
- No external dependencies
- Full control over data
- Foundation for future integrations
- Universal feature (all competitors offer this)

### Competitive Positioning

| Feature | ContractorOS | JobNimbus | Buildertrend | Procore |
|---------|-------------|-----------|--------------|---------|
| Custom Price Book | Phase 1 | Yes | Yes | Yes |
| CSV/Excel Import | Phase 1 | Yes | Yes | Yes |
| ABC Supply | Phase 2 | Yes | No | No |
| SRS Distribution | Phase 3 | Yes | No | No |
| RSMeans Data | Phase 4 | No | No | Optional |
| Home Depot | Phase 5 | No | Yes | Marketplace |

---

*Last Updated: 2026-02-03*
*Status: Complete*
*Next Review: Sprint 43 Planning*
