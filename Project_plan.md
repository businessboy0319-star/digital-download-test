
# Digital Asset Delivery Platform – Complete Step-by-Step Project Plan

## Project Title

Shopify-Integrated Digital Asset Delivery Platform for The Digital Design Dock

---

# 1. Project Goal

Build a custom digital asset delivery platform that works **alongside Shopify**.

Shopify will continue handling:

- Storefront
- Product pages
- SEO
- Checkout
- Customer-facing public catalog

The custom platform will handle:

- Secure ZIP download delivery
- Membership download access and limits
- CSV-based product import
- Product and asset mapping by DDD ID
- Customer authentication for download access
- Admin dashboard
- Download logs
- Order-based entitlements
- Storage and delivery of protected digital assets

The **DDD ID** must be the main identifier across the entire system.

---

# 2. Core Business Rule

## 2.1 Canonical Product Identity

The platform must treat **DDD ID** as the source of truth.

Use:

- `DDD ID` = internal master product identifier
- Shopify product ID = external sales channel reference only
- SKU = secondary business identifier
- ZIP file path = linked to DDD ID
- Preview images = linked to DDD ID
- Entitlements = linked to DDD ID
- Imports = update products by DDD ID

Do **not** make Shopify product IDs the main system identity.

---

# 3. High-Level System Summary

The project is a **hybrid commerce architecture**.

## 3.1 Shopify handles

- Product listing pages
- Theme and public storefront
- SEO
- Checkout
- Order creation
- Public catalog browsing

## 3.2 Custom platform handles

- Internal product records
- Asset records
- Customer access rights
- Membership plans and limits
- Download permissions
- Temporary secure file links
- Importing product data from CSV
- Admin management tools
- Logging and monitoring

## 3.3 Storage handles

- Protected ZIP downloads
- Optionally preview images, if moved later

## 3.4 Database handles

- Products
- Assets
- Shopify mappings
- Users
- Orders
- Memberships
- Entitlements
- Download logs
- Import jobs

---

# 4. Main System Flow

## 4.1 Product creation and import flow

1. Client pipeline generates products and assets.
2. Pipeline outputs CSV files and structured product folders.
3. CSV file contains DDD ID, SKU, titles, metadata, and references.
4. Backend imports CSV.
5. Backend creates or updates product records by DDD ID.
6. Backend creates or updates product asset records.
7. Backend maps Shopify product references to the internal product.

## 4.2 Purchase and access flow

1. Customer buys product on Shopify.
2. Shopify sends webhook to backend.
3. Backend verifies webhook authenticity.
4. Backend reads the purchased items.
5. Backend maps Shopify product or variant to internal product record.
6. Backend identifies the correct DDD ID.
7. Backend creates internal order records.
8. Backend creates entitlements for the customer.
9. Customer logs into download portal.
10. Customer requests download.
11. Backend verifies user access.
12. Backend generates signed temporary file link.
13. Customer downloads ZIP from secure storage.

## 4.3 Membership flow

1. User has an active membership plan.
2. Membership plan has monthly usage rules.
3. User requests product download.
4. Backend checks plan validity.
5. Backend checks current billing-period usage.
6. Backend allows or blocks the request.
7. If allowed, backend generates secure signed link.
8. Download is logged.

---

# 5. Final Scope

## 5.1 In Scope

The project must include:

1. Shopify integration for purchase-triggered access
2. Product database built around DDD ID
3. CSV import engine
4. Asset mapping
5. Cloud storage integration
6. Customer login and access
7. Order entitlement creation
8. Membership plans and usage limits
9. Admin dashboard
10. Customer portal
11. Logging and monitoring
12. Staging deployment
13. Production deployment
14. Basic documentation for future developers

## 5.2 Out of Scope for Main Build

These should not be included in the main build flow:

- Replacing Shopify storefront entirely
- Building a full custom public storefront
- Advanced search engine infrastructure
- AI features
- Google Drive auto-sync
- Background queue systems
- Mobile app
- Multi-store architecture
- Advanced analytics platform
- Multi-tenant architecture

These can be suggested later, but do not belong in the main plan.

---

# 6. Technology Stack

## 6.1 Frontend

Use **Next.js**.

Use it for:

- Admin dashboard
- Customer portal

## 6.2 Backend API

Use **Node.js** with **Express.js**.

Use it for:

- Shopify webhook endpoints
- CSV import endpoints
- Download permission endpoints
- Membership and entitlement logic
- Admin APIs

## 6.3 Database

Use **Supabase Postgres**.

Use it for:

- Products
- Assets
- Users
- Orders
- Memberships
- Entitlements
- Logs
- Imports

## 6.4 Authentication

Use **Supabase Auth**.

Use it for:

- Customer login
- Admin login
- Password reset
- Session handling

## 6.5 File Storage

Use **Cloudflare R2**.

Use it for:

- Protected ZIP files

## 6.6 Deployment

Use:

- **Vercel** for frontend
- **Railway** or **Render** for backend
- **Supabase** for database
- **Cloudflare R2** for storage
- **Cloudflare DNS** or domain configuration for subdomains

---

# 7. Project Folder Structure

Use this structure:

```txt
project-root/
  admin/
    src/
      app/
      components/
      lib/
      services/
      hooks/
      types/
  backend/
    src/
      config/
      controllers/
      middlewares/
      repositories/
      routes/
      services/
      types/
      utils/
    scripts/
  docs/
  sql/
  .env.example
  README.md
````

## 7.1 Folder Purpose

### `admin/`

Next.js frontend for:

* Admin dashboard
* Customer portal

### `backend/`

Express backend for:

* Webhooks
* CSV import
* Order processing
* Entitlement processing
* Signed download generation

### `docs/`

Documentation for:

* Setup
* Data model
* Architecture
* Recovery plan
* Admin usage

### `sql/`

Contains:

* Schema scripts
* Seed scripts
* Migration notes

---

# 8. Data Discovery Phase

## 8.1 Goal

Understand the client’s current publishing pipeline before writing real system logic.

## 8.2 Study Existing Assets

You must inspect:

* Sample batch ZIP structures
* Product folders
* `_audit` folders
* `Shopify_Upload.csv`
* `shopify_files_manifest.json`
* `shopify_upload_map.json`
* `Drive_Zip_Download_Links.csv`

## 8.3 What to Extract

For each product, identify:

* DDD ID
* Product title
* SKU
* Product folder name
* Preview image list
* ZIP file location
* Shopify product mapping if available
* Any category, tags, or metadata

## 8.4 Write Internal Data Notes

Create:

`docs/data-model-notes.md`

Document:

* All CSV columns
* Folder structure conventions
* File naming patterns
* DDD ID format
* ZIP location patterns
* Preview image source patterns
* Shopify mapping patterns
* Known inconsistencies

## 8.5 Deliverable

You fully understand how the client’s current data pipeline works.

---

# 9. Canonical Rules Phase

## 9.1 Goal

Lock the system identity rules before creating tables or APIs.

## 9.2 Rules

### Rule 1 — Internal Product Identity

The internal system uses `ddd_id` as the main product identity.

### Rule 2 — Channel Mapping

Shopify objects are channel references only.

### Rule 3 — Asset Mapping

A protected ZIP file must map to a product by DDD ID.

### Rule 4 — Preview Mapping

Preview assets must map to the same product by DDD ID.

### Rule 5 — Imports

CSV import must create or update product records by DDD ID.

### Rule 6 — Entitlements

Download access is granted to internal product records, not only Shopify IDs.

### Rule 7 — Customer Identity

Customer purchase email is the main identity link for access.

## 9.3 Output

Create:

`docs/canonical-rules.md`

---

# 10. Database Design Phase

## 10.1 Goal

Create a relational data model for the platform.

## 10.2 Required Tables

### `products`

Stores the main internal product.

Fields:

* `id` UUID primary key
* `ddd_id` text unique not null
* `sku` text nullable
* `title` text not null
* `description` text nullable
* `category` text nullable
* `status` text default `'draft'`
* `created_at` timestamp
* `updated_at` timestamp

### `product_assets`

Stores file references.

Fields:

* `id` UUID primary key
* `product_id` UUID foreign key references products(id)
* `asset_type` text not null
* `file_name` text
* `file_path` text
* `provider` text
* `mime_type` text nullable
* `is_public` boolean default false
* `sort_order` integer default 0
* `created_at` timestamp

Asset types:

* `preview_image`
* `zip_download`

Providers:

* `shopify_cdn`
* `cloudflare_r2`
* `google_drive` only as temporary migration reference if needed

### `shopify_products`

Stores Shopify mappings.

Fields:

* `id` UUID primary key
* `product_id` UUID foreign key references products(id)
* `shopify_product_id` text
* `shopify_variant_id` text nullable
* `shopify_handle` text nullable
* `shopify_status` text nullable
* `created_at` timestamp
* `updated_at` timestamp

### `users`

Stores customer and admin users.

Fields:

* `id` UUID primary key
* `email` text unique not null
* `full_name` text nullable
* `role` text default `'customer'`
* `shopify_customer_id` text nullable
* `created_at` timestamp
* `updated_at` timestamp

Roles:

* `customer`
* `admin`

### `orders`

Stores internal order headers.

Fields:

* `id` UUID primary key
* `user_id` UUID foreign key references users(id)
* `shopify_order_id` text unique
* `order_status` text
* `currency` text nullable
* `total_amount` numeric nullable
* `purchased_at` timestamp nullable
* `created_at` timestamp

### `order_items`

Stores purchased products.

Fields:

* `id` UUID primary key
* `order_id` UUID foreign key references orders(id)
* `product_id` UUID foreign key references products(id)
* `quantity` integer default 1
* `unit_price` numeric nullable
* `created_at` timestamp

### `membership_plans`

Stores plan definitions.

Fields:

* `id` UUID primary key
* `name` text not null
* `monthly_download_limit` integer not null
* `is_active` boolean default true
* `created_at` timestamp
* `updated_at` timestamp

### `memberships`

Stores active membership assignments.

Fields:

* `id` UUID primary key
* `user_id` UUID foreign key references users(id)
* `membership_plan_id` UUID foreign key references membership_plans(id)
* `status` text not null
* `start_date` timestamp not null
* `end_date` timestamp nullable
* `created_at` timestamp

Statuses:

* `active`
* `expired`
* `cancelled`

### `download_entitlements`

Stores allowed access.

Fields:

* `id` UUID primary key
* `user_id` UUID foreign key references users(id)
* `product_id` UUID foreign key references products(id)
* `source_type` text not null
* `source_id` text nullable
* `expires_at` timestamp nullable
* `created_at` timestamp

Source types:

* `one_off_purchase`
* `membership`

### `download_logs`

Stores every download attempt.

Fields:

* `id` UUID primary key
* `user_id` UUID foreign key references users(id)
* `product_id` UUID foreign key references products(id)
* `status` text not null
* `ip_address` text nullable
* `user_agent` text nullable
* `downloaded_at` timestamp not null

Statuses:

* `success`
* `blocked`
* `expired`
* `limit_exceeded`
* `missing_asset`

### `import_jobs`

Stores CSV import runs.

Fields:

* `id` UUID primary key
* `file_name` text not null
* `status` text not null
* `total_rows` integer default 0
* `success_rows` integer default 0
* `failed_rows` integer default 0
* `error_message` text nullable
* `created_at` timestamp not null

Statuses:

* `running`
* `completed`
* `failed`

## 10.3 Required Constraints

Add constraints:

* `products.ddd_id` unique
* `users.email` unique
* `orders.shopify_order_id` unique

## 10.4 Required Indexes

Create indexes on:

* `products.ddd_id`
* `products.sku`
* `users.email`
* `users.shopify_customer_id`
* `shopify_products.shopify_product_id`
* `shopify_products.shopify_variant_id`
* `orders.shopify_order_id`
* `download_entitlements.user_id`
* `download_entitlements.product_id`
* `download_logs.user_id`
* `download_logs.product_id`

## 10.5 SQL File

Create:

`sql/001_schema.sql`

---

# 11. Supabase Setup Phase

## 11.1 Goal

Create the database environment.

## 11.2 Steps

1. Create Supabase account.
2. Create a new project.
3. Save database connection details.
4. Open SQL editor.
5. Run `sql/001_schema.sql`.
6. Verify all tables exist.
7. Create initial admin record if needed.

## 11.3 Deliverable

Live database with all required core tables.

---

# 12. Backend Initialization Phase

## 12.1 Goal

Create the Express backend application.

## 12.2 Initialize Backend

Inside `backend/`:

1. Initialize Node project.
2. Add TypeScript support.
3. Install dependencies.
4. Create Express app.
5. Create environment config loader.
6. Add health endpoint.

## 12.3 Install Dependencies

Install:

* `express`
* `typescript`
* `ts-node`
* `dotenv`
* `@supabase/supabase-js`
* `csv-parser`
* `zod`
* `winston`
* `cors`
* `body-parser`
* AWS S3-compatible SDK for R2

## 12.4 Create Backend Structure

Use:

```txt
backend/src/
  app.ts
  server.ts
  config/
  controllers/
  routes/
  services/
  repositories/
  middlewares/
  types/
  utils/
```

## 12.5 Environment Variables

Create `backend/.env.example` with:

```env
PORT=4000
NODE_ENV=development

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

SHOPIFY_STORE_DOMAIN=
SHOPIFY_ADMIN_ACCESS_TOKEN=
SHOPIFY_WEBHOOK_SECRET=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_BUCKET_DOWNLOADS=ddd-downloads-private
R2_BUCKET_PREVIEWS=ddd-previews-public

APP_BASE_URL=
```

## 12.6 Health Endpoint

Create:

`GET /health`

Response should include:

* status
* environment
* timestamp

## 12.7 Deliverable

Backend starts successfully and responds to health checks.

---

# 13. Repository Layer Phase

## 13.1 Goal

Separate database access from business logic.

## 13.2 Repositories to Create

* `productRepository`
* `assetRepository`
* `shopifyProductRepository`
* `userRepository`
* `orderRepository`
* `orderItemRepository`
* `membershipPlanRepository`
* `membershipRepository`
* `entitlementRepository`
* `downloadLogRepository`
* `importJobRepository`

## 13.3 Rules

Repositories must:

* handle only DB queries
* not contain business logic
* return clean results
* throw clear errors on failure

## 13.4 Deliverable

Reusable DB layer for all major entities.

---

# 14. CSV Import Phase

## 14.1 Goal

Allow admin to upload a CSV and create or update products.

## 14.2 Endpoint

Create:

`POST /admin/import/csv`

## 14.3 CSV Import Logic

For every row:

1. Parse row.
2. Normalize values.
3. Validate required fields.
4. Confirm DDD ID exists.
5. Check whether product already exists by DDD ID.
6. If it exists, update it.
7. If it does not exist, create it.
8. Create or update related asset records.
9. Count success and failure results.
10. Save import stats.

## 14.4 Validation Rules

Each row should reject if required fields are missing, especially:

* DDD ID
* title if required in current schema
* valid ZIP or asset reference fields if part of the import

## 14.5 Import Job Tracking

Before processing file:

* create `import_jobs` record with status `running`

After processing:

* update `status`
* update `total_rows`
* update `success_rows`
* update `failed_rows`
* update `error_message` if needed

## 14.6 Deliverable

Products can be created or updated from CSV reliably.

---

# 15. Asset Mapping Phase

## 15.1 Goal

Map preview files and protected ZIP files to each product.

## 15.2 Asset Path Standard

Use a strict path structure:

```txt
downloads/DDD000123/main.zip
previews/DDD000123/1.jpg
previews/DDD000123/2.jpg
```

## 15.3 Asset Mapping Logic

Every product should be able to answer:

* what is my DDD ID
* what preview images belong to me
* what ZIP file belongs to me
* where is my ZIP file stored

## 15.4 Provider Rules

Use:

* `shopify_cdn` for existing public preview images
* `cloudflare_r2` for protected ZIP assets

## 15.5 Deliverable

Every internal product has correct preview and ZIP mapping records.

---

# 16. Cloudflare R2 Setup Phase

## 16.1 Goal

Create protected file storage.

## 16.2 Create Buckets

Create:

* one private downloads bucket
* optionally one public previews bucket if needed later

Recommended:

* `ddd-downloads-private`
* `ddd-previews-public`

## 16.3 Store Credentials

Save:

* account ID
* access key
* secret key
* endpoint
* bucket names

## 16.4 Upload Sample Files

Upload a few sample ZIP files first.

Use 2 to 5 sample DDD products to validate the full process.

## 16.5 Deliverable

Protected ZIP files exist in R2 and can be referenced in DB.

---

# 17. Asset Upload Script Phase

## 17.1 Goal

Automate ZIP upload to R2.

## 17.2 Script File

Create:

`backend/scripts/upload-assets.ts`

## 17.3 Script Flow

1. Read source folder or list.
2. Detect DDD product folder.
3. Find ZIP file.
4. Build R2 key path.
5. Upload ZIP file.
6. Update `product_assets` record.
7. Log missing files and invalid entries.
8. Print summary.

## 17.4 Rules

* do not overwrite silently
* do not skip failed uploads without logging
* skip invalid folders with clear message

## 17.5 Deliverable

Repeatable script for uploading ZIP assets to Cloudflare R2.

---

# 18. Authentication Phase

## 18.1 Goal

Allow customers and admins to log in.

## 18.2 Use Supabase Auth

Enable:

* email/password login
* password reset
* session handling

## 18.3 Role Strategy

User roles:

* admin
* customer

## 18.4 Customer Identity Rule

When Shopify order is processed:

* use customer email
* create user if missing
* later allow login using the same email

## 18.5 Admin Access Rule

Only admins can access admin dashboard routes.

## 18.6 Deliverable

Customers and admins can authenticate successfully.

---

# 19. Shopify Webhook Integration Phase

## 19.1 Goal

Grant access automatically when Shopify purchases happen.

## 19.2 Endpoint

Create:

`POST /webhooks/shopify/orders-paid`

## 19.3 Webhook Verification Steps

Before processing the webhook:

1. read raw request body
2. verify HMAC signature using Shopify webhook secret
3. reject invalid webhook immediately

## 19.4 Order Processing Steps

After verification:

1. parse Shopify order ID
2. parse customer email
3. parse purchased items
4. map purchased products to internal products
5. find DDD IDs
6. create user if missing
7. create internal `orders` record
8. create internal `order_items` records
9. create `download_entitlements`

## 19.5 Mapping Rule

Use `shopify_products` table to translate:

* Shopify product/variant
* internal product
* DDD ID

## 19.6 Deliverable

A paid Shopify order creates access for the customer automatically.

---

# 20. Order and Entitlement Phase

## 20.1 Goal

Store purchase records and download rights internally.

## 20.2 Order Creation Rules

When purchase occurs:

* one order header should be created
* one order item record per purchased product
* all purchased products must link to internal product records

## 20.3 Entitlement Rules

For one-off purchases:

* create permanent or long-lived entitlement unless business rules require expiration

For memberships:

* access is checked dynamically from membership state and usage limits

## 20.4 Deliverable

Internal system fully understands who owns what.

---

# 21. Download Permission Phase

## 21.1 Goal

Serve files only to authorized users.

## 21.2 Endpoint

Create:

`GET /downloads/:dddId`

or an equivalent secure endpoint.

## 21.3 Request Flow

When user requests a download:

1. authenticate the user
2. locate the product by DDD ID
3. check whether the user has a valid entitlement
4. if not entitled by direct purchase, check membership access
5. if membership exists, check plan activity
6. count current billing-period usage
7. compare against monthly limit
8. if allowed, generate signed R2 URL
9. log download result
10. return signed URL

## 21.4 Security Rule

Never expose permanent direct ZIP file URLs.

Only use short-lived signed URLs.

## 21.5 Deliverable

Authorized users receive temporary links, unauthorized users are blocked.

---

# 22. Membership System Phase

## 22.1 Goal

Support recurring access plans with monthly limits.

## 22.2 Plan Examples

* Tier 1 = 50 downloads per month
* Tier 2 = 200 downloads per month
* Tier 3 = unlimited

## 22.3 Data Model

Use:

* `membership_plans`
* `memberships`
* `download_logs`

## 22.4 Membership Check Flow

1. find active membership for user
2. confirm membership is active
3. confirm plan is active
4. determine current usage during billing period
5. compare usage against limit
6. allow or block request

## 22.5 Usage Counting

Use `download_logs` to count successful downloads within billing period.

## 22.6 Deliverable

Membership-based access works and limits are enforced.

---

# 23. Admin Dashboard Phase

## 23.1 Goal

Provide simple tools for managing the platform.

## 23.2 Required Pages

### Dashboard

Show:

* total products
* total users
* total downloads
* active memberships
* recent import jobs

### Products Page

Show:

* DDD ID
* title
* status
* Shopify mapping status
* ZIP asset status
* preview status

### Import Page

Allow:

* CSV upload
* import execution
* import history
* failed row summary

### Users Page

Show:

* email
* role
* membership status
* order count
* download count

### Membership Plans Page

Allow:

* create plan
* edit limit
* activate/deactivate plan

### Download Logs Page

Show:

* user
* product
* time
* result

## 23.3 UI Rule

Keep the UI simple.

Plain tables and forms are enough.

## 23.4 Deliverable

Admin can manage the system using the dashboard.

---

# 24. Customer Portal Phase

## 24.1 Goal

Allow customers to access their purchases and downloads.

## 24.2 Required Pages

### Login Page

Customer signs in using the same email used for purchase.

### My Downloads Page

Show:

* purchased products
* eligible membership products if included later
* download button per item

### Account Page

Show:

* email
* membership status
* monthly usage
* remaining limit if applicable

## 24.3 Recommended Domain

Use a subdomain like:

`downloads.thedigitaldesigndock.com`

## 24.4 Deliverable

Customer can sign in and access downloads securely.

---

# 25. Shopify Mapping Management Phase

## 25.1 Goal

Ensure every Shopify product maps correctly to internal records.

## 25.2 Mapping Rules

For each Shopify product:

* store Shopify product ID
* store Shopify variant ID if needed
* store Shopify handle
* link to internal product record

## 25.3 Validation Rule

No Shopify product should be treated as downloadable unless it has a valid internal mapping.

## 25.4 Admin Visibility

Products page should show:

* mapped
* unmapped
* missing ZIP
* missing preview

## 25.5 Deliverable

Reliable bridge exists between Shopify and internal DDD-based products.

---

# 26. Logging and Error Handling Phase

## 26.1 Goal

Make the platform traceable and debuggable.

## 26.2 Required Logs

Log:

* imports
* webhook receipts
* webhook verification failures
* order processing
* entitlement creation
* download success
* download denial
* upload failures

## 26.3 Required Safety Checks

Detect and reject:

* missing DDD ID
* duplicate DDD ID
* missing ZIP path
* invalid Shopify mapping
* missing user email
* invalid webhook signature
* expired membership
* limit exceeded
* missing asset record

## 26.4 Rule

No silent failures.

Every major action must either:

* succeed clearly
* or fail clearly with a reason

## 26.5 Deliverable

System behavior is traceable and maintainable.

---

# 27. Backup and Recovery Phase

## 27.1 Goal

Protect the business against data loss.

## 27.2 Database Backup

Ensure:

* Supabase backups are enabled if available
* schema file is stored in repo
* backup strategy is documented

## 27.3 Storage Backup

Ensure:

* original asset archive is retained separately
* bucket structure is documented
* storage paths are documented

## 27.4 Recovery Documentation

Create:

`docs/recovery-plan.md`

Document:

* how to restore database
* how to re-run schema
* how to restore R2 configuration
* how to restore env settings

## 27.5 Deliverable

Recovery basics are documented.

---

# 28. Local Testing Phase

## 28.1 Goal

Validate all core business flows before staging.

## 28.2 Test Cases

### Test 1 — CSV Import

* upload sample CSV
* confirm products created
* confirm DDD IDs unique
* confirm failed rows logged

### Test 2 — Asset Mapping

* confirm preview assets mapped
* confirm ZIP assets mapped
* confirm paths valid

### Test 3 — Shopify Webhook

* simulate paid order
* verify user created
* verify order stored
* verify entitlement created

### Test 4 — Login

* test customer login
* test admin login

### Test 5 — Download Access

* authorized user gets signed URL
* unauthorized user is blocked

### Test 6 — Membership Limits

* active member downloads within limit
* user exceeding limit gets blocked

## 28.3 Deliverable

System works locally end to end.

---

# 29. Staging Deployment Phase

## 29.1 Goal

Deploy a safe test environment for review.

## 29.2 Steps

1. Deploy frontend to Vercel staging environment.
2. Deploy backend to Railway or Render staging.
3. Use staging database.
4. Use staging R2 bucket or folder prefix.
5. Point test Shopify webhooks to staging API.
6. Run smoke tests.

## 29.3 Deliverable

Fully working staging environment.

---

# 30. Staging Review Phase

## 30.1 Goal

Allow the client to test milestone functionality.

## 30.2 Client Review Checklist

Client should verify:

* CSV import works
* product mappings are correct
* Shopify purchase grants access
* customer can log in
* customer can download
* membership rules behave correctly
* admin dashboard works

## 30.3 Deliverable

Client-approved staging build.

---

# 31. Production Deployment Phase

## 31.1 Goal

Release the live production system.

## 31.2 Recommended Domains

* `admin.thedigitaldesigndock.com`
* `api.thedigitaldesigndock.com`
* `downloads.thedigitaldesigndock.com`

## 31.3 Steps

1. Configure production env variables.
2. Deploy frontend production build.
3. Deploy backend production build.
4. Connect production database.
5. Connect production R2 bucket.
6. Connect Shopify production webhook.
7. Perform live smoke tests.

## 31.4 Final Smoke Tests

* login test
* sample download test
* purchase-trigger entitlement test
* admin dashboard load test

## 31.5 Deliverable

Production system is live.

---

# 32. Documentation Phase

## 32.1 Goal

Make the project understandable for future developers.

## 32.2 Required Docs

### `README.md`

Must include:

* project purpose
* how to run locally
* folder structure
* environment setup
* deployment basics

### `docs/architecture.md`

Must explain:

* Shopify flow
* DDD ID rule
* webhook flow
* entitlement flow
* download flow
* storage flow

### `docs/data-model-notes.md`

Must explain:

* CSV structure
* folder layout
* field meaning
* naming rules

### `docs/recovery-plan.md`

Must explain:

* database recovery
* storage recovery
* environment recovery

### `docs/admin-guide.md`

Must explain:

* how to import products
* how to view logs
* how to manage plans
* how to inspect mappings

## 32.3 Deliverable

Another developer can continue the project without confusion.

---

# 33. Strict Build Order

Follow this order exactly:

1. inspect source data
2. write data notes
3. define canonical rules
4. design database schema
5. create Supabase project
6. initialize backend
7. create repository layer
8. build CSV import
9. define asset path rules
10. configure Cloudflare R2
11. upload sample ZIP files
12. build asset upload script
13. implement authentication
14. implement Shopify webhook endpoint
15. implement order creation logic
16. implement entitlement logic
17. implement secure download endpoint
18. implement membership logic
19. build admin dashboard
20. build customer portal
21. add logs and safety checks
22. perform local testing
23. deploy staging
24. perform staging review
25. deploy production
26. finalize documentation

Do not change this order unless there is a strong technical reason.

---

# 34. Milestone Plan

## Milestone 1 — Architecture and Foundation

Includes:

* source data analysis
* canonical rules
* DB schema
* Supabase setup
* backend initialization
* repository layer
* health check endpoint
* environment setup

## Milestone 2 — Product Catalog and Import

Includes:

* CSV import endpoint
* product create/update logic
* asset mapping
* Cloudflare R2 setup
* sample file upload
* upload script

## Milestone 3 — Purchase Access Logic

Includes:

* authentication
* Shopify webhook
* user creation
* order creation
* entitlements
* secure downloads
* membership logic

## Milestone 4 — Admin, Customer Portal, Launch

Includes:

* admin dashboard
* customer portal
* logs
* testing
* staging deploy
* production deploy
* documentation

---

# 35. Definition of Done

The project is complete only when all of the following are true:

1. Shopify remains the storefront and checkout source
2. internal products are keyed by DDD ID
3. CSV import creates or updates products correctly
4. ZIP files are stored in Cloudflare R2
5. preview assets are mapped correctly
6. Shopify purchases create internal orders
7. internal orders create download entitlements
8. customers can log in using purchase-linked email
9. authorized users can receive signed ZIP download links
10. unauthorized users are blocked
11. membership limits are enforced
12. admins can view products, users, imports, and downloads
13. staging environment exists
14. production environment exists
15. documentation is complete

---

# 36. Beginner Implementation Notes

## 36.1 What to build first

Always build the project in this coding order:

1. database tables
2. CSV import
3. product and asset records
4. storage integration
5. auth
6. webhook handling
7. order and entitlements
8. download endpoint
9. admin pages
10. customer pages

## 36.2 What not to do first

Do not start with:

* fancy UI
* advanced search
* full public storefront rewrite
* large automation systems

## 36.3 Why this matters

This project is data-driven.

If you get these three things right, the project becomes much easier:

* DDD ID as the core key
* clean DB schema
* reliable Shopify mapping

---

# 37. Final Summary

This project is a **Shopify-connected digital asset delivery backend**.

The system must:

1. use DDD ID as the internal truth
2. import products from CSV
3. map products to assets
4. process Shopify purchases
5. create entitlements
6. protect ZIP downloads
7. support memberships
8. provide admin and customer interfaces
9. deploy safely to staging and production

This is the complete main build path and should be followed strictly.
