# EPR System - Architecture Review & SaaS Transformation Guide

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current System Overview](#current-system-overview)
3. [Critical Weaknesses Identified](#critical-weaknesses-identified)
4. [Recommended System Architecture](#recommended-system-architecture)
5. [Optimized Database Schema](#optimized-database-schema)
6. [API Structure Improvements](#api-structure-improvements)
7. [Frontend Architecture](#frontend-architecture)
8. [SaaS Transformation Strategy](#saas-transformation-strategy)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

This EPR (Extended Producer Responsibility) ERP system manages beverage production, inventory distribution from owners → franchises → shops, with sales tracking and bottle return management. The current implementation is functional but has significant limitations preventing production-scale deployment.

**Current Tech Stack:**
- **Frontend:** React 18, TailwindCSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Authentication:** JWT with 2-hour expiry, bcryptjs
- **Security:** express-rate-limit, CORS

---

## Current System Overview

### Architecture Flow
```
Owner (Producer) → Franchises → Shops → Sales/Bottle Returns
     ↓                 ↓         ↓
Production      Stock Alloc   Stock Alloc
     ↓                 ↓         ↓
Inventory       Inventory    Inventory
```

### Current Entities
| Entity | Purpose |
|--------|---------|
| User | Authentication (owner/franchise roles) |
| Franchise | Regional distributors receiving stock from owner |
| Shop | Retail outlets receiving stock from franchises |
| Distributor | (Partially implemented - appears unused in main flow) |
| Production | Owner's production records per flavor |
| OwnerInventory | Aggregated production/allocated/available tracking |
| Transaction | Sales, stock allocations, bottle returns |

---

## Critical Weaknesses Identified

### 1. Database Schema Issues

#### 1.1 Denormalized Flavor Storage (Critical)
```javascript
// CURRENT (Problematic) - @/server/models/Franchise.js:34-41
stock: {
  orange: { type: Number, default: 0 },
  blueberry: { type: Number, default: 0 },
  jira: { type: Number, default: 0 },
  lemon: { type: Number, default: 0 },
  mint: { type: Number, default: 0 },
  guava: { type: Number, default: 0 }
}
```
**Problems:**
- Hardcoded flavors require schema changes to add new products
- Cannot support dynamic product catalogs
- Aggregation queries are complex and inefficient
- Wasted storage for unused flavors

**Impact:** High - Prevents product expansion, complicates reporting

#### 1.2 No Data Integrity Constraints
- No foreign key enforcement at database level
- Missing unique constraints on critical fields
- No transaction support for multi-step operations

#### 1.3 Missing Audit Trail
- No versioning on inventory changes
- No user attribution on stock movements
- Cannot track who made what change when

### 2. Performance Issues

#### 2.1 N+1 Query Problem (Critical)
```javascript
// @/server/controllers/franchiseController.js:13-26
const franchisesWithStatus = await Promise.all(
  franchises.map(async (franchise) => {
    const user = await User.findOne({ franchiseId: franchise._id }); // N queries!
    return { ...franchise.toObject(), userId: user ? {...} : null };
  })
);
```

**Impact:** With 100 franchises, this executes 101 queries instead of 1.

#### 2.2 Missing Database Indexes
- No indexes on frequently queried fields: `franchiseId`, `shopId`, `type`, `createdAt`
- Full collection scans on transaction history
- Slow inventory lookups

#### 2.3 Synchronous Inventory Calculations
```javascript
// @/server/models/ProducerInventory.js:42-48
ownerInventorySchema.pre('save', function(next) {
  flavors.forEach(flavor => {
    this.available[flavor] = this.totalProduced[flavor] - this.totalAllocated[flavor];
  });
  next();
});
```
**Problem:** Computed fields risk inconsistency under concurrent updates (race conditions).

### 3. Security Vulnerabilities

#### 3.1 Insufficient Authentication
```javascript
// @/server/middleware/auth.js:6
const token = req.header('Authorization')?.replace('Bearer ', '');
```
**Issues:**
- No refresh token mechanism (2-hour expiry causes UX issues)
- Tokens stored in localStorage (XSS vulnerable)
- No token blacklisting on logout
- Missing RBAC granularity (only owner/franchise)

#### 3.2 Missing Security Controls
- No input validation/sanitization (only basic Mongoose validation)
- No CSRF protection
- No request payload size limits
- No security headers (Helmet.js not implemented)
- CORS allows all origins

#### 3.3 No Rate Limiting Per User
Current rate limiting is IP-based only, not user-based. A single user can exhaust limits.

### 4. Scalability Limitations

#### 4.1 Single Tenant Architecture
- No organization/tenant isolation
- Cannot support multiple companies
- All data in single MongoDB database

#### 4.2 Monolithic Codebase
- No microservices boundary
- Business logic tightly coupled to controllers
- No event-driven architecture for inventory updates

#### 4.3 No Caching Strategy
- No Redis for session management
- No query result caching
- Repeated expensive aggregations

#### 4.4 Connection Management
```javascript
// @/server/server.js:44-48
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
})
```
**Issue:** Pool size of 10 insufficient for production load; no connection retry logic.

### 5. Data Consistency Issues

#### 5.1 Inventory Update Race Conditions
Stock allocation logic performs read-modify-write without locking:
```javascript
// From stockController.js - no atomic operations
franchise.stock[flavorKey] -= stock[flavor];  // Race condition risk!
await franchise.save();
```

#### 5.2 No Transaction Support
Multi-step operations (allocate stock → create transaction → update inventory) aren't atomic. Partial failures leave data inconsistent.

### 6. User Experience Deficiencies

#### 6.1 Frontend State Management
- AuthContext mixes concerns (auth + user state + loading)
- No global state management for inventory/shops data
- Prop drilling likely in components (large file sizes suggest this)

#### 6.2 No Optimistic Updates
All operations wait for server response before UI update.

#### 6.3 Missing Features
- No offline capability
- No real-time updates (WebSockets)
- No batch operations for stock entry
- No data export/reporting

---

## Recommended System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CDN / CloudFront                               │
│                         (Static Assets, Caching)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            React SPA (Frontend)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Auth Module│  │Inventory    │  │  Analytics  │  │  Admin Panel     │   │
│  │  (RBAC)     │  │  Module     │  │   Module    │  │                  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                              API Gateway (Kong/AWS)
                         (Rate Limiting, Auth, Routing)
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Microservices (Backend)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   Auth      │  │  Inventory  │  │ Transaction │  │  Notification    │   │
│  │  Service    │  │  Service    │  │   Service   │  │    Service       │   │
│  │  (Node.js)  │  │  (Node.js)  │  │  (Node.js)  │  │   (Serverless)   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
         │                  │                  │                    │
         └──────────────────┴──────────────────┴────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Data Layer                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  MongoDB    │  │    Redis    │  │ Elasticsearch│  │  Message Queue   │   │
│  │ (Primary)   │  │  (Cache/    │  │  (Search/    │  │  (RabbitMQ/     │   │
│  │             │  │  Sessions)  │  │   Analytics) │  │   SQS)           │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Improvements

1. **Multi-Tenancy:** Add tenant isolation for SaaS
2. **Event-Driven:** Use message queues for async inventory updates
3. **CQRS:** Separate read/write models for complex queries
4. **Caching Layer:** Redis for hot data
5. **API Gateway:** Centralized auth, rate limiting, routing

---

## Optimized Database Schema

### Schema Design Principles
1. **Reference-based product model** instead of hardcoded flavors
2. **Audit logging** for all inventory changes
3. **Proper indexing** strategy
4. **Atomic operations** with transactions

### Proposed Collections

#### 1. Organizations (Multi-tenancy)
```javascript
const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  plan: { 
    type: String, 
    enum: ['starter', 'growth', 'enterprise'], 
    default: 'starter' 
  },
  settings: {
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    features: [String] // Feature flags
  },
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'cancelled'], 
    default: 'active',
    index: true
  },
  billing: {
    customerId: String, // Stripe/External billing ID
    subscriptionId: String,
    currentPeriodEnd: Date
  }
}, { timestamps: true });
```

#### 2. Users (RBAC Enhanced)
```javascript
const userSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: true,
    index: true 
  },
  email: { type: String, required: true, lowercase: true },
  password: { type: String, required: true, select: false },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },
  roles: [{ 
    type: String, 
    enum: ['owner', 'admin', 'manager', 'operator', 'viewer'],
    index: true 
  }],
  permissions: [String], // Granular permissions
  franchiseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' }],
  shopIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending', 'suspended'], 
    default: 'pending',
    index: true 
  },
  lastLoginAt: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, select: false }
}, { timestamps: true });

// Compound unique index for email per organization
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });
```

#### 3. Products (Dynamic Catalog)
```javascript
const productSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: true,
    index: true 
  },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  category: { type: String, index: true },
  unit: { type: String, default: 'bottle' }, // bottle, crate, liter
  capacity: { type: Number, default: 1 }, // e.g., 250ml, 500ml
  flavor: String, // orange, blueberry, etc.
  barcode: String,
  pricing: {
    costPrice: Number,
    sellingPrice: Number,
    currency: { type: String, default: 'USD' }
  },
  metadata: mongoose.Schema.Types.Mixed,
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'discontinued'], 
    default: 'active',
    index: true 
  }
}, { timestamps: true });

// Compound index
productSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
productSchema.index({ organizationId: 1, status: 1 });
```

#### 4. Locations (Unified Hierarchy)
```javascript
const locationSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: ['warehouse', 'franchise', 'shop', 'distributor'],
    required: true,
    index: true 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location',
    index: true 
  }, // For hierarchy
  name: { type: String, required: true },
  code: { type: String, unique: true, sparse: true },
  contact: {
    email: String,
    phone: String,
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: { lat: Number, lng: Number }
  },
  settings: {
    operatingHours: mongoose.Schema.Types.Mixed,
    deliveryDays: [String],
    minStockAlert: { type: Number, default: 10 }
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active',
    index: true 
  }
}, { timestamps: true });

locationSchema.index({ organizationId: 1, type: 1, status: 1 });
```

#### 5. Inventory (Dynamic Product Support)
```javascript
const inventorySchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    index: true 
  },
  locationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location',
    required: true,
    index: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true,
    index: true 
  },
  quantities: {
    onHand: { type: Number, default: 0 }, // Physical stock
    allocated: { type: Number, default: 0 }, // Reserved
    available: { type: Number, default: 0 } // onHand - allocated
  },
  metrics: {
    totalReceived: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    totalReturned: { type: Number, default: 0 },
    totalAdjusted: { type: Number, default: 0 }
  },
  lastMovementAt: Date,
  version: { type: Number, default: 0 } // Optimistic locking
}, { timestamps: true });

// Critical compound indexes for inventory lookups
inventorySchema.index({ organizationId: 1, locationId: 1, productId: 1 }, { unique: true });
inventorySchema.index({ organizationId: 1, locationId: 1, 'quantities.available': 1 });
inventorySchema.index({ organizationId: 1, productId: 1 });

// Compute available on save
inventorySchema.pre('save', function(next) {
  this.quantities.available = this.quantities.onHand - this.quantities.allocated;
  this.version += 1;
  next();
});
```

#### 6. Stock Movements (Audit Trail)
```javascript
const stockMovementSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  type: { 
    type: String, 
    enum: ['production', 'allocation', 'sale', 'return', 'adjustment', 'transfer'],
    required: true,
    index: true 
  },
  referenceId: String, // External reference number
  
  // Source (null for production)
  fromLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', index: true },
  
  // Destination (null for sales)
  toLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', index: true },
  
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unitCost: Number,
    unitPrice: Number,
    batchNumber: String,
    expiryDate: Date
  }],
  
  totals: {
    itemCount: Number,
    quantity: Number,
    value: Number
  },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  notes: String,
  
  // For soft deletes / corrections
  status: { 
    type: String, 
    enum: ['confirmed', 'pending', 'cancelled', 'corrected'], 
    default: 'confirmed',
    index: true 
  },
  correctionOf: { type: mongoose.Schema.Types.ObjectId, ref: 'StockMovement' }
}, { timestamps: true });

stockMovementSchema.index({ organizationId: 1, createdAt: -1 });
stockMovementSchema.index({ organizationId: 1, type: 1, createdAt: -1 });
stockMovementSchema.index({ organizationId: 1, fromLocationId: 1, createdAt: -1 });
stockMovementSchema.index({ organizationId: 1, toLocationId: 1, createdAt: -1 });
```

#### 7. Empty Bottle Tracking
```javascript
const bottleReturnSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
  franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
  
  bottles: [{
    type: { type: String, required: true }, // crate type, size
    quantity: { type: Number, required: true },
    condition: { type: String, enum: ['good', 'damaged', 'missing'] }
  }],
  
  totalBottles: Number,
  totalCrates: Number,
  depositAmount: Number, // If applicable
  
  status: { 
    type: String, 
    enum: ['pending', 'received', 'verified', 'rejected'], 
    default: 'pending',
    index: true 
  },
  
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  collectedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
```

#### 8. Sessions & Tokens (Security)
```javascript
const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  token: { type: String, required: true, index: true },
  refreshToken: String,
  deviceInfo: {
    type: String,
    os: String,
    browser: String,
    ip: String
  },
  expiresAt: { type: Date, required: true, index: true },
  lastActiveAt: { type: Date, default: Date.now },
  isRevoked: { type: Boolean, default: false }
});

// TTL index for automatic cleanup
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## API Structure Improvements

### RESTful + Async Endpoints

#### API Versioning Strategy
```
/api/v1/auth/*
/api/v1/inventory/*
/api/v1/locations/*
/api/v1/movements/*
/api/v1/analytics/*
/api/v1/admin/*
```

#### Standard Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "links": {
    "self": "/api/v1/inventory?page=1",
    "next": "/api/v1/inventory?page=2",
    "prev": null
  }
}
```

#### Key Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/auth/login | Login with MFA support | Public |
| POST | /api/v1/auth/refresh | Refresh access token | Public |
| POST | /api/v1/auth/logout | Revoke session | Private |
| GET | /api/v1/auth/sessions | List active sessions | Private |
| GET | /api/v1/inventory | List inventory (filtered) | inventory:read |
| POST | /api/v1/inventory/adjust | Adjust stock | inventory:write |
| GET | /api/v1/locations | List locations | locations:read |
| POST | /api/v1/movements/transfer | Transfer stock | movements:write |
| POST | /api/v1/movements/production | Record production | production:write |
| POST | /api/v1/movements/sale | Record sale | sales:write |
| GET | /api/v1/analytics/dashboard | Dashboard metrics | analytics:read |
| GET | /api/v1/analytics/reports/inventory | Inventory report | reports:read |
| GET | /api/v1/admin/organizations | List orgs (superadmin) | admin:read |
| POST | /api/v1/admin/organizations | Create org (superadmin) | admin:write |

### GraphQL Alternative (Optional)
For complex analytics and flexible queries:
```graphql
type Query {
  inventory(filter: InventoryFilter, pagination: Pagination): InventoryConnection
  movements(filter: MovementFilter): [StockMovement]
  analytics(timeRange: TimeRange!): Analytics
}

mutation {
  recordProduction(input: ProductionInput!): StockMovement
  transferStock(input: TransferInput!): StockMovement
  recordSale(input: SaleInput!): StockMovement
}
```

---

## Frontend Architecture

### Recommended Stack
- **State Management:** Redux Toolkit / Zustand
- **Data Fetching:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod validation
- **UI Library:** TailwindCSS + HeadlessUI / RadixUI
- **Charts:** Recharts / Tremor
- **Build:** Vite (faster than CRA)

### Project Structure
```
src/
├── app/                    # App-level setup
│   ├── store.ts           # Redux/Zustand store
│   ├── api.ts             # RTK Query / Axios setup
│   └── providers.tsx      # Context providers
├── features/              # Feature-based modules
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── inventory/
│   ├── locations/
│   ├── movements/
│   └── analytics/
├── components/            # Shared UI components
│   ├── ui/               # Primitive components (Button, Input, Modal)
│   ├── layout/           # Layout components
│   └── data/             # Data display (Tables, Charts)
├── hooks/                # Shared hooks
├── utils/                # Utilities
├── types/                # TypeScript types
└── config/               # App configuration
```

### Key Patterns

#### 1. React Query for Server State
```typescript
// features/inventory/api/useInventory.ts
export const useInventory = (filters: InventoryFilters) => {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => inventoryAPI.getAll(filters),
    staleTime: 30000, // 30s
    cacheTime: 60000, // 1m
  });
};

export const useTransferStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: movementsAPI.transfer,
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['movements']);
    },
  });
};
```

#### 2. Optimistic Updates
```typescript
const { mutate } = useMutation({
  mutationFn: recordSale,
  onMutate: async (newSale) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['inventory']);
    
    // Snapshot previous value
    const previousInventory = queryClient.getQueryData(['inventory']);
    
    // Optimistically update
    queryClient.setQueryData(['inventory'], (old) => ({
      ...old,
      quantities: {
        ...old.quantities,
        onHand: old.quantities.onHand - newSale.quantity
      }
    }));
    
    return { previousInventory };
  },
  onError: (err, newSale, context) => {
    // Rollback on error
    queryClient.setQueryData(['inventory'], context.previousInventory);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries(['inventory']);
  },
});
```

#### 3. RBAC Component Guard
```typescript
// components/PermissionGuard.tsx
export const PermissionGuard: React.FC<{
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permissions, children, fallback = null }) => {
  const { user } = useAuth();
  const hasPermission = permissions.every(p => user.permissions.includes(p));
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

// Usage
<PermissionGuard permissions={['sales:write']}>
  <RecordSaleButton />
</PermissionGuard>
```

---

## SaaS Transformation Strategy

### Multi-Tenancy Models

Choose one based on scale requirements:

#### Option A: Single Database, Tenant Isolation (Recommended for MVP)
- All tenants in one MongoDB database
- Every collection has `organizationId` field
- Compound indexes on `organizationId + field`
- Query filtering by organizationId on all reads

**Pros:** Simple, cost-effective, easy backup
**Cons:** Noisy neighbor risk, harder to scale horizontally

#### Option B: Database Per Tenant (Enterprise)
- Separate MongoDB database per organization
- Connection pooling managed by tenant
- Higher isolation, easier compliance

**Pros:** Maximum isolation, easy per-tenant backup/restore
**Cons:** Complex connection management, higher infrastructure cost

### Feature Flags & Tiers
```javascript
// Organization settings
const plans = {
  starter: {
    maxLocations: 5,
    maxUsers: 10,
    features: ['inventory', 'sales', 'basic_reports'],
    support: 'email'
  },
  growth: {
    maxLocations: 25,
    maxUsers: 50,
    features: ['inventory', 'sales', 'advanced_reports', 'analytics', 'api_access'],
    support: 'priority'
  },
  enterprise: {
    maxLocations: Infinity,
    maxUsers: Infinity,
    features: ['*'], // All features
    support: 'dedicated'
  }
};
```

### Role-Based Access Control (RBAC)

#### Permission Structure
```
resource:action

inventory:read      - View inventory
inventory:write     - Adjust stock
movements:read      - View stock movements
movements:write     - Create transfers/productions/sales
sales:write         - Record sales
reports:read        - View reports
admin:read          - View admin settings
admin:write         - Modify organization settings
users:read          - View users
users:write         - Create/edit users
```

#### Role Definitions
| Role | Permissions |
|------|-------------|
| owner | * (all) |
| admin | inventory:*, movements:*, sales:*, reports:*, users:* |
| manager | inventory:read, movements:*, sales:*, reports:read |
| operator | inventory:read, sales:write |
| viewer | inventory:read, reports:read |

### White-Labeling Support
```typescript
// Organization branding
interface OrganizationBranding {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  favicon: string;
  customDomain?: string;
  emailTemplates: {
    header: string;
    footer: string;
  };
}
```

### Billing Integration
```typescript
// Stripe integration example
interface Subscription {
  organizationId: ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'past_due' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  usage: {
    locations: number;
    users: number;
    apiCalls: number;
  };
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
1. **Database Migration**
   - Create new normalized schema
   - Migration scripts from old to new schema
   - Add proper indexes

2. **Security Hardening**
   - Implement refresh token mechanism
   - Add input validation (Zod/Joi)
   - Add security headers (Helmet)
   - Implement proper RBAC

3. **Performance Fixes**
   - Fix N+1 queries with proper population
   - Add Redis caching layer
   - Implement connection pooling

### Phase 2: Multi-Tenancy (Weeks 5-8)
1. Add Organization model
2. Migrate all entities to include organizationId
3. Implement tenant isolation middleware
4. Add subscription/billing foundation

### Phase 3: Architecture Evolution (Weeks 9-12)
1. Extract inventory service
2. Implement event-driven updates (message queue)
3. Add Elasticsearch for analytics
4. Implement async processing for reports

### Phase 4: Frontend Modernization (Weeks 13-16)
1. Migrate to Vite
2. Implement React Query
3. Add optimistic updates
4. Implement proper state management
5. Add offline capability (PWA)

### Phase 5: SaaS Features (Weeks 17-20)
1. Implement feature flags
2. Add white-labeling
3. Implement usage tracking
4. Add admin dashboard
5. Stripe billing integration

---

## Quick Wins (Immediate Actions)

1. **Add Database Indexes** (1 hour)
   ```javascript
   // Add to existing schemas
   franchiseSchema.index({ status: 1 });
   shopSchema.index({ franchiseId: 1, status: 1 });
   transactionSchema.index({ franchiseId: 1, createdAt: -1 });
   transactionSchema.index({ type: 1, createdAt: -1 });
   ```

2. **Fix N+1 Query** (30 minutes)
   ```javascript
   // Instead of Promise.all(map), use populate
   const franchises = await Franchise.find()
     .populate({
       path: 'userId',
       model: 'User',
       select: 'username onlineStatus lastActive'
     });
   ```

3. **Add Basic Validation** (1 hour)
   ```javascript
   // Use express-validator
   const { body, validationResult } = require('express-validator');
   
   router.post('/allocate', [
     body('franchiseId').isMongoId(),
     body('stock').isObject(),
     body('stock.*').isInt({ min: 0 })
   ], controller);
   ```

4. **Implement Atomic Inventory Updates** (2 hours)
   ```javascript
   // Use findOneAndUpdate with operators
   await Franchise.findOneAndUpdate(
     { _id: franchiseId, [`stock.${flavor}`]: { $gte: quantity } },
     { $inc: { [`stock.${flavor}`]: -quantity } },
     { new: true }
   );
   ```

---

## Summary

The current EPR system is functional for a single-tenant, small-scale deployment. To transform it into a production-ready SaaS product:

**Critical (Do First):**
1. Fix N+1 queries and add indexes
2. Implement atomic inventory operations
3. Add proper RBAC
4. Security hardening (tokens, validation, headers)

**Important (Next):**
5. Normalize database schema (dynamic products)
6. Add audit logging (stock movements)
7. Implement proper error handling
8. Add caching layer

**Strategic (For SaaS):**
9. Multi-tenancy with organization isolation
10. Microservices extraction
11. Event-driven architecture
12. White-labeling & billing

The recommended approach is iterative: secure and optimize the current architecture first, then gradually introduce SaaS capabilities while maintaining backward compatibility.
