# Stage 1

## Objective

Design a notification platform for a campus application where students receive real-time updates about:

- Placements
- Events
- Results

The API should let the frontend:

- Fetch a user's notification feed
- View a single notification
- Mark notifications as read
- Receive real-time updates

The platform should also support internal creation and publishing of notifications from backend services.

## Assumptions

- Users are already pre-authorized as per the assignment.
- No login or registration flow is required.
- The frontend sends the active user identity in headers.
- Different internal systems such as placement, events, and results modules can publish notifications.
- All backend implementations using these APIs must use the provided logging middleware instead of `console.log`.

## Core Actions Supported

1. Publish a notification to one or more users
2. Fetch notification feed for a user
3. Fetch notification details by ID
4. Mark a notification as read
5. Mark all notifications as read
6. Subscribe to real-time notification delivery

## API Conventions

### Base URL

```text
/api/v1
```

### Standard Headers

#### Request Headers

```http
Content-Type: application/json
Accept: application/json
X-User-Id: user_12345
X-Request-Id: 1f3f9d06-4d1b-4e2c-a4d8-c72bfbc0d111
X-Correlation-Id: placement-drive-2026-08
```

### Header Meanings

- `X-User-Id`: identifies the pre-authorized user consuming notifications
- `X-Request-Id`: unique request identifier for traceability
- `X-Correlation-Id`: links related requests/events across services

### Standard Response Envelope

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {},
  "meta": {}
}
```

### Standard Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "category",
        "issue": "category must be one of PLACEMENT, EVENT, RESULT"
      }
    ]
  }
}
```

## Notification Resource Structure

```json
{
  "id": "ntf_01JZZ6MYA0YQ5T7B0M4V7VKP8F",
  "title": "Placement drive scheduled for ABC Corp",
  "message": "ABC Corp drive starts on 2026-08-14 at 10:00 AM in Seminar Hall A.",
  "category": "PLACEMENT",
  "priority": "HIGH",
  "audienceType": "TARGETED",
  "status": "PUBLISHED",
  "createdBy": "svc_placement_module",
  "createdAt": "2026-08-10T08:30:00Z",
  "publishedAt": "2026-08-10T08:31:00Z",
  "expiresAt": "2026-08-14T12:00:00Z",
  "actionUrl": "/placements/drives/abc-corp",
  "metadata": {
    "placementId": "pl_1001",
    "companyName": "ABC Corp",
    "venue": "Seminar Hall A"
  }
}
```

### Field Notes

- `category`: `PLACEMENT | EVENT | RESULT`
- `priority`: `LOW | MEDIUM | HIGH | URGENT`
- `audienceType`: `ALL | COURSE | DEPARTMENT | TARGETED`
- `status`: `DRAFT | PUBLISHED | EXPIRED`
- `metadata`: flexible extra information for the frontend

## Endpoints

### 1. Publish Notification

Used by internal backend systems to create and publish a notification.

```http
POST /api/v1/notifications
```

#### Request

```json
{
  "title": "Mid semester results published",
  "message": "Your semester 5 results are now available.",
  "category": "RESULT",
  "priority": "HIGH",
  "audience": {
    "type": "TARGETED",
    "userIds": ["stu_101", "stu_102", "stu_103"]
  },
  "actionUrl": "/results/semester-5",
  "expiresAt": "2026-09-01T00:00:00Z",
  "metadata": {
    "semester": 5,
    "resultBatchId": "rb_2026_s5"
  }
}
```

#### Success Response

```json
{
  "success": true,
  "message": "Notification published successfully",
  "data": {
    "notificationId": "ntf_01JZZ6MYA0YQ5T7B0M4V7VKP8F",
    "deliveredUserCount": 3,
    "status": "PUBLISHED"
  }
}
```

#### Important Validations

- `title` required, max 150 chars
- `message` required, max 1000 chars
- `category` must be valid
- `audience.type` required
- `userIds` required when `audience.type = TARGETED`

### 2. List Notifications for Logged-In User

Returns the user's notification feed with filtering and pagination.

```http
GET /api/v1/notifications?status=unread&category=PLACEMENT&limit=20&cursor=eyJpZCI6...
```

#### Request Headers

```http
X-User-Id: stu_101
Accept: application/json
```

#### Query Parameters

- `status`: `all | unread | read`
- `category`: `PLACEMENT | EVENT | RESULT`
- `limit`: default 20, max 100
- `cursor`: opaque cursor for pagination

#### Success Response

```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": [
    {
      "notificationId": "ntf_01JZZ6MYA0YQ5T7B0M4V7VKP8F",
      "title": "Placement drive scheduled for ABC Corp",
      "message": "ABC Corp drive starts on 2026-08-14 at 10:00 AM in Seminar Hall A.",
      "category": "PLACEMENT",
      "priority": "HIGH",
      "isRead": false,
      "publishedAt": "2026-08-10T08:31:00Z",
      "actionUrl": "/placements/drives/abc-corp"
    }
  ],
  "meta": {
    "nextCursor": "eyJpZCI6ICJudGZfMDEifQ==",
    "limit": 20,
    "unreadCount": 12
  }
}
```

### 3. Get Notification Details

```http
GET /api/v1/notifications/{notificationId}
```

#### Success Response

```json
{
  "success": true,
  "message": "Notification details fetched successfully",
  "data": {
    "notificationId": "ntf_01JZZ6MYA0YQ5T7B0M4V7VKP8F",
    "title": "Placement drive scheduled for ABC Corp",
    "message": "ABC Corp drive starts on 2026-08-14 at 10:00 AM in Seminar Hall A.",
    "category": "PLACEMENT",
    "priority": "HIGH",
    "isRead": false,
    "readAt": null,
    "publishedAt": "2026-08-10T08:31:00Z",
    "expiresAt": "2026-08-14T12:00:00Z",
    "actionUrl": "/placements/drives/abc-corp",
    "metadata": {
      "placementId": "pl_1001",
      "companyName": "ABC Corp",
      "venue": "Seminar Hall A"
    }
  }
}
```

### 4. Mark One Notification as Read

```http
PATCH /api/v1/notifications/{notificationId}/read
```

#### Request

```json
{
  "readAt": "2026-08-10T09:00:00Z"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notificationId": "ntf_01JZZ6MYA0YQ5T7B0M4V7VKP8F",
    "isRead": true,
    "readAt": "2026-08-10T09:00:00Z"
  }
}
```

### 5. Mark All Notifications as Read

```http
PATCH /api/v1/notifications/read-all
```

#### Request

```json
{
  "category": "EVENT"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "Notifications marked as read",
  "data": {
    "updatedCount": 14
  }
}
```

## Real-Time Notification Mechanism

### Recommended Option

Use WebSocket for real-time notification delivery.

### Why WebSocket

- Supports instant server-to-client push
- Efficient for frequent campus updates
- Allows future bidirectional features such as acknowledgements or live counters
- Better fit than repeated polling for active users

### Real-Time Connection Contract

```http
GET /api/v1/notifications/stream
Upgrade: websocket
X-User-Id: stu_101
X-Request-Id: 6d8f7b2a-76a7-48f7-b283-cdd8c4c03c9f
```

### Sample Event Payload

```json
{
  "event": "notification.created",
  "timestamp": "2026-08-10T08:31:00Z",
  "data": {
    "notificationId": "ntf_01JZZ6MYA0YQ5T7B0M4V7VKP8F",
    "title": "Placement drive scheduled for ABC Corp",
    "message": "ABC Corp drive starts on 2026-08-14 at 10:00 AM in Seminar Hall A.",
    "category": "PLACEMENT",
    "priority": "HIGH",
    "publishedAt": "2026-08-10T08:31:00Z",
    "actionUrl": "/placements/drives/abc-corp",
    "isRead": false
  }
}
```

### Connection Behavior

- Client connects after app load
- Server validates `X-User-Id`
- Server sends only notifications applicable to that user
- Client updates unread badge and feed immediately
- On disconnect, client reconnects with exponential backoff

### Fallback Option

If WebSocket is unavailable, use Server-Sent Events or short polling with:

```http
GET /api/v1/notifications?status=unread&limit=20
```

## Suggested Backend Workflow

1. Internal service calls `POST /notifications`
2. Notification is validated and stored
3. Audience is resolved into recipient user IDs
4. Per-user delivery records are created
5. Real-time event is pushed through WebSocket
6. Frontend feed is updated without page refresh

## Logging Middleware Usage Expectation

Wherever these APIs are implemented, the service should use the provided logging middleware for:

- incoming API request logging
- notification creation success/failure
- database operation tracing
- real-time delivery success/failure
- validation and exception logging

Example logging intent:

- `Log("backend", "info", "route", "GET /api/v1/notifications requested")`
- `Log("backend", "info", "service", "notification published successfully")`
- `Log("backend", "error", "db", "failed to insert notification record")`

# Stage 2

## Recommended Database

Use PostgreSQL as the primary persistent store.

## Why PostgreSQL

- Strong relational modeling for notifications and per-user delivery state
- ACID transactions for reliable publish and delivery record creation
- Efficient indexing for unread/read queries
- Good support for JSON metadata through `JSONB`
- Easy to scale with partitioning, read replicas, and archival strategies

PostgreSQL is a good fit because this system has:

- structured entities
- predictable query patterns
- per-user read state
- transactional writes that should not partially fail

## Schema Design

### Table: `notifications`

Stores the master notification content.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('PLACEMENT', 'EVENT', 'RESULT')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    audience_type VARCHAR(20) NOT NULL CHECK (audience_type IN ('ALL', 'COURSE', 'DEPARTMENT', 'TARGETED')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'EXPIRED')),
    action_url VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);
```

### Table: `notification_recipients`

Stores per-user delivery and read status.

```sql
CREATE TABLE notification_recipients (
    id BIGSERIAL PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (notification_id, user_id)
);
```

### Optional Table: `notification_audience_rules`

Useful when targeting departments or courses dynamically.

```sql
CREATE TABLE notification_audience_rules (
    id BIGSERIAL PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('COURSE', 'DEPARTMENT')),
    rule_value VARCHAR(100) NOT NULL
);
```

## Recommended Indexes

```sql
CREATE INDEX idx_notifications_published_at
ON notifications (published_at DESC);

CREATE INDEX idx_notifications_category
ON notifications (category);

CREATE INDEX idx_notifications_status_expires
ON notifications (status, expires_at);

CREATE INDEX idx_recipients_user_delivery
ON notification_recipients (user_id, delivered_at DESC);

CREATE INDEX idx_recipients_user_read
ON notification_recipients (user_id, is_read, delivered_at DESC);

CREATE INDEX idx_notifications_metadata_gin
ON notifications USING GIN (metadata);
```

## Mapping Between API and Schema

- `POST /notifications` writes to `notifications` and `notification_recipients`
- `GET /notifications` reads from a join between `notifications` and `notification_recipients`
- `GET /notifications/{id}` reads one joined record for the specific user
- `PATCH /notifications/{id}/read` updates `notification_recipients`
- `PATCH /notifications/read-all` bulk-updates `notification_recipients`

## SQL Queries Based on Stage 1 APIs

### 1. Create Notification

```sql
INSERT INTO notifications (
    id,
    title,
    message,
    category,
    priority,
    audience_type,
    status,
    action_url,
    metadata,
    created_by,
    published_at,
    expires_at
) VALUES (
    :id,
    :title,
    :message,
    :category,
    :priority,
    :audience_type,
    'PUBLISHED',
    :action_url,
    CAST(:metadata AS JSONB),
    :created_by,
    NOW(),
    :expires_at
);
```

### 2. Insert Recipients for a Targeted Notification

```sql
INSERT INTO notification_recipients (notification_id, user_id)
VALUES
    (:notification_id, :user_id_1),
    (:notification_id, :user_id_2),
    (:notification_id, :user_id_3);
```

### 3. Fetch Notification Feed for a User

```sql
SELECT
    n.id AS notification_id,
    n.title,
    n.message,
    n.category,
    n.priority,
    n.action_url,
    n.published_at,
    nr.is_read,
    nr.read_at
FROM notification_recipients nr
JOIN notifications n
    ON n.id = nr.notification_id
WHERE nr.user_id = :user_id
  AND n.status = 'PUBLISHED'
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
  AND (:category IS NULL OR n.category = :category)
  AND (
        :status = 'all'
        OR (:status = 'unread' AND nr.is_read = FALSE)
        OR (:status = 'read' AND nr.is_read = TRUE)
      )
ORDER BY n.published_at DESC
LIMIT :limit;
```

### 4. Fetch Notification Details by ID

```sql
SELECT
    n.id AS notification_id,
    n.title,
    n.message,
    n.category,
    n.priority,
    n.action_url,
    n.metadata,
    n.published_at,
    n.expires_at,
    nr.is_read,
    nr.read_at
FROM notification_recipients nr
JOIN notifications n
    ON n.id = nr.notification_id
WHERE nr.user_id = :user_id
  AND n.id = :notification_id;
```

### 5. Mark One Notification as Read

```sql
UPDATE notification_recipients
SET
    is_read = TRUE,
    read_at = COALESCE(:read_at, NOW())
WHERE user_id = :user_id
  AND notification_id = :notification_id
  AND is_read = FALSE;
```

### 6. Mark All Notifications as Read

```sql
UPDATE notification_recipients nr
SET
    is_read = TRUE,
    read_at = NOW()
FROM notifications n
WHERE nr.notification_id = n.id
  AND nr.user_id = :user_id
  AND nr.is_read = FALSE
  AND (:category IS NULL OR n.category = :category);
```

### 7. Get Unread Count

```sql
SELECT COUNT(*) AS unread_count
FROM notification_recipients nr
JOIN notifications n
    ON n.id = nr.notification_id
WHERE nr.user_id = :user_id
  AND nr.is_read = FALSE
  AND n.status = 'PUBLISHED'
  AND (n.expires_at IS NULL OR n.expires_at > NOW());
```

## Problems That Can Arise as Data Volume Grows

### 1. Large Recipient Table Growth

If each notification fans out to many users, `notification_recipients` will grow very quickly.

### 2. Slower Feed Queries

Unread/read filters and sorting by publish time may become slower without careful indexing.

### 3. Heavy Write Bursts

Campus-wide announcements can trigger very large bulk inserts into recipient records.

### 4. Real-Time Delivery Pressure

A high number of connected users can stress WebSocket infrastructure.

### 5. Old Data Retention Cost

Expired or historical notifications can increase storage and hurt query performance.

## Solutions to Scale Problems

### 1. Partition Large Tables

Partition `notification_recipients` by time or by hashed `user_id`.

Benefits:

- smaller active partitions
- faster scans
- easier archival

### 2. Add Read Replicas

Use PostgreSQL read replicas for feed reads and unread count queries while keeping writes on the primary node.

### 3. Use Asynchronous Fan-Out

For large broadcasts:

- store notification first
- publish a background job
- generate recipient records asynchronously in batches

This reduces API response time for internal publishers.

### 4. Archive Expired Data

Move old notifications and recipient rows to archive tables or cold storage after a retention window.

### 5. Cache Frequent Counters

Unread counts can be cached in Redis and refreshed on read/write events to reduce repeated count queries.

### 6. Cursor Pagination Instead of Offset

Cursor pagination performs better than large offsets for growing feeds and provides more stable pagination.

### 7. Dedicated Real-Time Gateway

Use a separate WebSocket gateway layer backed by Redis pub/sub or a message broker so notification publishing and socket delivery are loosely coupled.

## Final Recommendation

The best practical design for this assignment is:

- REST APIs for feed retrieval and read actions
- WebSocket for real-time updates
- PostgreSQL for reliable persistence
- `notifications` plus `notification_recipients` as the core schema
- indexing, partitioning, async fan-out, and caching as scale strategies

This design is consistent, implementable, and suitable for a campus notification platform where each user has an individual read state but many notifications may be broadcast in real time.

# Stage 3

## Given Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

## Is This Query Accurate?

Not fully.

Based on the schema proposed in Stage 2, this query is inaccurate because:

- `notifications` stores the master notification content
- per-student read state belongs in `notification_recipients`
- a single notification can belong to many students, so `studentID` and `isRead` should not live in the master `notifications` table

If the system stores everything in one denormalized table, the query may technically work, but that design is weaker for scale and causes duplication of notification content for every student.

For the normalized relational design, the unread query should join `notification_recipients` with `notifications`.

## Why This Query Is Slow

At the current scale:

- 50,000 students
- 5,000,000 notifications

this query can be slow for several reasons.

### 1. Likely Full Table Scan

If there is no suitable composite index on `(studentID, isRead, createdAt)`, the database may scan a very large part of the table before filtering.

### 2. `SELECT *` Reads More Data Than Needed

The query fetches all columns, even if the API only needs title, message, type, read state, and timestamp. This increases I/O and memory usage.

### 3. Sorting Adds Extra Cost

`ORDER BY createdAt ASC` forces the database to sort matching rows unless the chosen index already supports that order.

### 4. Oldest-First Is Usually a Poor Product Choice

For a notification feed, users usually want newest notifications first. Sorting ascending means the system may process many older rows before returning the most relevant items.

### 5. Missing Pagination

Fetching all unread notifications for a student in one query is expensive. Even if one student has thousands of unread notifications, the API should usually return only the first page.

## What I Would Change

### Recommended Query for the Normalized Design

```sql
SELECT
    n.id AS notification_id,
    n.title,
    n.message,
    n.category,
    n.priority,
    n.action_url,
    n.published_at,
    nr.is_read,
    nr.read_at
FROM notification_recipients nr
JOIN notifications n
    ON n.id = nr.notification_id
WHERE nr.user_id = '1042'
  AND nr.is_read = FALSE
  AND n.status = 'PUBLISHED'
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.published_at DESC
LIMIT 50;
```

### Why This Is Better

- uses the correct table for per-student read state
- returns only the required columns
- fetches newest notifications first
- limits the result set
- aligns with the Stage 1 API contract

## Recommended Indexes

### On `notification_recipients`

```sql
CREATE INDEX idx_recipients_user_unread_delivery
ON notification_recipients (user_id, is_read, delivered_at DESC);
```

This helps quickly locate unread notifications for one user.

### On `notifications`

```sql
CREATE INDEX idx_notifications_status_published
ON notifications (status, published_at DESC);
```

This helps when filtering active published records and sorting recent notifications.

### Even Better in PostgreSQL: Partial Index

If unread rows are queried much more frequently than read rows:

```sql
CREATE INDEX idx_recipients_unread_only
ON notification_recipients (user_id, delivered_at DESC)
WHERE is_read = FALSE;
```

This index is smaller and faster than indexing all rows for the unread use case.

## Likely Computation Cost

### Without a Good Index

The query can degrade toward:

- time complexity: approximately `O(N)` scan plus sorting cost
- if sorting many matching rows, effectively close to `O(N log N)` for the result preparation

Here `N` is the number of rows the database must inspect, which can be very large in a multi-million-row table.

### With a Good Composite or Partial Index

The database can:

- locate the target student's unread rows using the index
- return rows in index order
- avoid scanning unrelated students

The practical cost becomes much closer to:

- index lookup plus reading matching rows
- roughly `O(log N + K)`

Where:

- `N` = total indexed rows
- `K` = unread notifications returned for that student

This is far more efficient than a full scan.

## Should We Add Indexes on Every Column?

No. That is not effective advice.

## Why Indexing Every Column Is a Bad Idea

### 1. Extra Write Cost

Each insert, update, or delete must also update every index. In a notification system with frequent writes, too many indexes slow down publishing.

### 2. Higher Storage Usage

Indexes consume disk and memory. Indexing every column wastes resources, especially on low-selectivity columns.

### 3. Some Columns Do Not Benefit Much

Columns such as boolean `is_read` by itself are usually not selective enough to justify a standalone index.

### 4. Query Planner Confusion

Too many overlapping indexes can make planning more complex and still not improve the real query path.

### Better Rule

Create indexes based on:

- actual query patterns
- filtering columns
- join columns
- sorting columns
- selectivity

For this workload, targeted composite or partial indexes are much better than indexing every column.

## Query to Find All Students Who Got a Placement Notification in the Last 7 Days

Using the normalized schema:

```sql
SELECT DISTINCT nr.user_id
FROM notification_recipients nr
JOIN notifications n
    ON n.id = nr.notification_id
WHERE n.category = 'PLACEMENT'
  AND n.published_at >= NOW() - INTERVAL '7 days';
```

If the database uses the exact column name `notificationType` instead of `category`, then:

```sql
SELECT DISTINCT nr.user_id
FROM notification_recipients nr
JOIN notifications n
    ON n.id = nr.notification_id
WHERE n.notificationType = 'Placement'
  AND n.createdAt >= NOW() - INTERVAL '7 days';
```

## Stage 3 Conclusion

The original query is not ideal for the normalized relational model and becomes slow because it combines poor table design assumptions, no pagination, possible full scans, and unnecessary sorting. The right fix is:

- keep notification content and per-user read state separate
- query through a join
- fetch only required columns
- sort by newest first
- paginate
- add targeted composite or partial indexes

# Stage 4

## Problem Summary

Notifications are being fetched on every page load for every student, which overloads the database and slows the user experience. This means the system is paying the read cost repeatedly even when the user has no new notifications.

## Suggested Solution

Use a hybrid approach:

- WebSocket for real-time push of new notifications
- Redis cache for unread count and recent notification summaries
- paginated REST API for initial feed load and history
- background refresh or lazy refresh instead of fetching on every page load

This reduces unnecessary database reads while still keeping the UI fresh.

## Recommended Performance Improvements

### 1. Stop Fetching the Entire Feed on Every Page Load

Instead of automatically loading all notifications each time:

- fetch only unread count or first page on app start
- load more notifications only when the user opens the notifications panel

#### Benefit

Massive reduction in redundant database traffic.

#### Tradeoff

The full feed is not instantly available until the user opens the notification view.

### 2. Push New Notifications with WebSocket

Once the student is connected, the server pushes new notifications instead of the client polling repeatedly.

#### Benefit

- lower repeated read load
- near real-time UX
- faster unread badge updates

#### Tradeoff

- more infrastructure complexity
- need connection management, reconnection logic, and socket scaling

### 3. Cache Unread Count in Redis

Unread count is one of the most frequently requested values. Store it in Redis per user.

Example key:

```text
notifications:unread_count:user:1042
```

Update the cache when:

- a notification is delivered
- a notification is marked as read
- mark-all-read is executed

#### Benefit

Badge counts become very fast and avoid repeated `COUNT(*)` queries.

#### Tradeoff

- cache invalidation must be handled carefully
- possible short-lived inconsistency if cache update fails

### 4. Cache the Most Recent Feed Page

Cache a small recent slice, such as the latest 20 notifications per user.

#### Benefit

- reduces repeated reads for common UI views
- speeds up first interaction

#### Tradeoff

- higher cache memory usage
- stale data risk unless invalidation is done correctly

### 5. Use Lazy Loading With Cursor Pagination

Return only the first page, then fetch more when the user scrolls or requests older notifications.

#### Benefit

- lower query time
- lower payload size
- better perceived performance

#### Tradeoff

- slightly more frontend logic
- cursor handling is more complex than offset pagination

### 6. Read Replicas for Heavy Read Traffic

Move feed reads to PostgreSQL read replicas while keeping writes on the primary database.

#### Benefit

- reduces load on the primary node
- improves system capacity

#### Tradeoff

- eventual consistency
- additional operational cost
- replica lag may briefly show outdated read state

### 7. Partition Large Tables

Partition `notification_recipients` by hash of `user_id` or by time.

#### Benefit

- smaller active index ranges
- faster large-table operations
- easier maintenance and archival

#### Tradeoff

- schema and query management become more complex
- wrong partition strategy can reduce the benefit

### 8. Precompute Delivery and Keep Notification Content Separate

Continue using a `notifications` table plus `notification_recipients` table so the feed query reads compact recipient rows and joins only when needed.

#### Benefit

- avoids duplicating full notification payloads
- improves storage efficiency
- keeps per-user state manageable

#### Tradeoff

- joins are still required
- publishing flow is more complex than one-table storage

### 9. Use Background Jobs for Fan-Out

For large announcements:

- save the notification once
- create a job
- fan out recipient rows asynchronously in batches

#### Benefit

- faster publish API response
- smoother DB write bursts

#### Tradeoff

- notification delivery becomes eventually consistent
- requires queue monitoring and retry logic

## Proposed Request Flow

### Initial App Load

1. Client opens WebSocket connection
2. Client fetches unread count from cache-backed API
3. Client does not fetch the full notification feed immediately

### When User Opens Notification Panel

1. Client requests first page of recent notifications
2. API serves from cache if available, otherwise from DB
3. Older notifications are loaded only on demand

### When a New Notification Is Published

1. Notification is stored in DB
2. Recipient rows are created
3. Redis unread counts are updated
4. WebSocket event is pushed to connected users
5. Cached recent feed page is refreshed or invalidated

## Best Overall Recommendation

The best practical solution is not a single optimization but a layered strategy:

- WebSocket for live delivery
- Redis for unread count and recent feed caching
- lazy loading with cursor pagination
- targeted indexes
- read replicas for scale
- background jobs for heavy fan-out

This combination reduces unnecessary page-load queries, protects the database, and gives students a faster and more responsive notification experience.

## Tradeoff Summary

### WebSocket

- Pro: real-time updates with less polling
- Con: connection management complexity

### Redis Cache

- Pro: very fast reads for counters and recent items
- Con: cache invalidation complexity

### Lazy Loading

- Pro: smaller and faster responses
- Con: feed is loaded incrementally, not all at once

### Read Replicas

- Pro: scales read-heavy workloads
- Con: possible replica lag

### Partitioning

- Pro: better performance on very large tables
- Con: higher operational complexity

### Background Fan-Out

- Pro: smoother writes and faster publish path
- Con: eventual consistency and queue complexity

## Stage 4 Conclusion

To improve performance meaningfully, I would move from page-load-based fetching to an event-driven and cache-assisted model. The database should remain the source of truth, but the application should avoid hitting it for every page load when real-time push, caching, pagination, and read replicas can serve the same user need much more efficiently.

# Stage 5

## Given Pseudocode

```text
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

## Shortcomings in the Current Implementation

This implementation has several reliability and performance problems.

### 1. It Is Fully Sequential

The loop processes one student at a time. For 50,000 students, this is too slow because:

- email API calls are network-bound
- DB inserts are repeated one by one
- real-time push is repeated one by one

The total time becomes the sum of all individual operations.

### 2. No Fault Isolation

If `send_email` fails for one student, the flow for that student becomes ambiguous:

- was the DB row saved?
- was the in-app notification pushed?
- should the system retry?

The pseudocode does not define failure handling or recovery behavior.

### 3. No Idempotency Protection

If the process is retried after a partial failure, the same student may receive:

- duplicate emails
- duplicate DB records
- duplicate in-app notifications

### 4. No Batching

The design sends 50,000 independent operations directly. That can overload:

- the email provider
- the application server
- the database
- the real-time delivery layer

### 5. Tight Coupling of Independent Steps

Email sending, DB persistence, and app push are all mixed inside one request flow. These concerns have different reliability and latency profiles and should not block each other unnecessarily.

### 6. No Delivery Status Tracking

There is no persistent status model like:

- queued
- in_app_sent
- email_sent
- partial_failure
- failed

Without status tracking, operators cannot safely resume or retry failed work.

### 7. No Retry Strategy

Temporary failures such as:

- email provider timeout
- transient DB lock
- WebSocket gateway issue

should be retried automatically with backoff. The pseudocode has no retry plan.

### 8. Poor User Experience for the HR Action

If HR clicks "Notify All", the API should acknowledge quickly. A long-running synchronous loop can lead to:

- request timeout
- duplicate button clicks
- unclear success/failure result

## What If `send_email` Failed for 200 Students Midway?

That means the system likely entered a partial success state.

Possible outcomes:

- some students got email, in-app notification, and DB record
- some students got only DB record and in-app notification
- some students got nothing
- some students may get duplicates if the whole job is rerun blindly

So the correct response is:

- do not rerun the whole process blindly
- identify which students failed specifically in the email channel
- persist per-student and per-channel delivery status
- retry only the failed email deliveries

## Reliable and Fast Redesign

The process should be redesigned as an asynchronous fan-out workflow.

## Recommended Design

### Step 1. Save the Notification Once

When HR clicks "Notify All":

- create one notification record in `notifications`
- create recipient rows in `notification_recipients`
- create per-channel delivery task records or publish jobs to a queue

This should happen in a controlled write path.

### Step 2. Return Fast to the HR User

The API should respond as soon as the notification job is accepted, for example:

```json
{
  "success": true,
  "message": "Notification accepted for processing",
  "data": {
    "notificationId": "ntf_01JZZ6MYA0YQ5T7B0M4V7VKP8F",
    "jobId": "job_notify_all_20260814_001",
    "recipientCount": 50000,
    "status": "QUEUED"
  }
}
```

This avoids keeping the HR request open for the full delivery duration.

### Step 3. Use Background Workers

Separate worker processes should consume jobs from a queue:

- one workflow to create recipient batches
- one workflow to send emails
- one workflow to push in-app notifications

### Step 4. Track Status Per Channel

Each student should have delivery status recorded separately, for example:

- `in_app_status`: `QUEUED | SENT | FAILED`
- `email_status`: `QUEUED | SENT | FAILED`
- `retry_count`
- `last_error`

This makes retries safe and observable.

### Step 5. Retry Only Failed Items

If 200 email sends fail midway:

- keep successful deliveries untouched
- retry only those 200 failed email tasks
- use exponential backoff
- send permanently failed jobs to a dead-letter queue for manual review

## Should Saving to DB and Sending Email Happen Together?

Not as one single synchronous action.

## Why They Should Not Happen as One Synchronous Step

### 1. Different Reliability Boundaries

Saving to the DB is an internal transactional operation. Sending email depends on an external provider and can fail for reasons outside the application.

### 2. External APIs Cannot Be Part of a Real DB Transaction

You cannot safely include an external email API call inside a database transaction and expect true atomic rollback across both systems.

### 3. Slow External Work Would Block the Main Flow

If email sending is kept in the critical path, the request becomes slow and fragile.

### 4. Partial Failure Is Normal

It is perfectly possible for:

- DB save to succeed
- email to fail temporarily

The system should model this explicitly instead of pretending both always succeed together.

## What Should Happen Together?

These should happen together in one database transaction:

- create notification master record
- create recipient records
- create outbox or job records representing email and in-app delivery work

That ensures the system never "forgets" to process a notification after it has been accepted.

## Recommended Pattern

Use the transactional outbox pattern.

### How It Works

Inside one DB transaction:

1. insert notification
2. insert recipient records
3. insert outbox events such as `SEND_EMAIL` and `PUSH_IN_APP`

After commit:

- background workers read outbox events
- execute the external work
- update statuses
- retry failures safely

This design is reliable because the database remains the source of truth and external delivery happens asynchronously.

## Revised Pseudocode

### API Layer

```text
function notify_all(student_ids: array, message: string, created_by: string):
    notification_id = generate_id()
    job_id = generate_job_id()

    begin_transaction()

    insert_notification(
        notification_id=notification_id,
        title="Placement Update",
        message=message,
        category="PLACEMENT",
        audience_type="TARGETED",
        status="PUBLISHED",
        created_by=created_by
    )

    for batch in chunk(student_ids, 1000):
        bulk_insert_notification_recipients(notification_id, batch)
        bulk_insert_outbox_events(notification_id, batch, "PUSH_IN_APP")
        bulk_insert_outbox_events(notification_id, batch, "SEND_EMAIL")

    commit_transaction()

    Log("backend", "info", "service", "notify_all accepted and queued")

    return {
        notificationId: notification_id,
        jobId: job_id,
        status: "QUEUED"
    }
```

### Outbox Worker

```text
function process_outbox_event(event):
    try:
        if event.type == "PUSH_IN_APP":
            push_to_app(event.user_id, event.notification_id)
            mark_event_success(event.id)
            mark_recipient_in_app_sent(event.notification_id, event.user_id)

        else if event.type == "SEND_EMAIL":
            send_email(event.user_id, event.notification_id)
            mark_event_success(event.id)
            mark_recipient_email_sent(event.notification_id, event.user_id)

        Log("backend", "info", "service", "delivery event processed successfully")

    catch error:
        increment_retry_count(event.id)
        save_last_error(event.id, error.message)

        if retry_count(event.id) < MAX_RETRIES:
            reschedule_event_with_backoff(event.id)
        else:
            mark_event_failed(event.id)
            move_to_dead_letter_queue(event.id)

        Log("backend", "error", "service", "delivery event processing failed")
```

### Batch Worker for Fan-Out

```text
function process_notify_all_job(notification_id, student_ids):
    for batch in chunk(student_ids, 1000):
        enqueue_batch(batch, notification_id, "PUSH_IN_APP")
        enqueue_batch(batch, notification_id, "SEND_EMAIL")

    Log("backend", "info", "service", "notify_all fan-out batches enqueued")
```

## How the 200 Failed Emails Are Handled in This Design

With the redesigned workflow:

- all 50,000 recipients are already persisted in DB
- in-app notifications can still succeed even if email fails
- the 200 failed email events remain marked as failed or retryable
- retry workers process only those 200 email events
- no need to resend to the other 49,800 students

This is the key reliability improvement.

## How This Design Becomes Fast

### 1. API Returns Quickly

The request only validates, stores, and enqueues work.

### 2. Bulk Inserts Reduce DB Overhead

Recipient creation and outbox creation happen in batches rather than one row at a time.

### 3. Parallel Workers Increase Throughput

Many workers can process delivery jobs concurrently.

### 4. External Systems Are Decoupled

Slow email delivery does not block DB persistence or in-app delivery.

### 5. Retries Are Targeted

Only failed tasks are retried instead of replaying the whole operation.

## Logging Middleware Usage for Stage 5

The assignment requires use of the custom logging middleware. In this flow it should be used for:

- HR notify-all request accepted
- transaction success/failure
- batch enqueue progress
- email delivery success/failure
- in-app push success/failure
- retry attempts
- dead-letter queue placement

Examples:

- `Log("backend", "info", "service", "notify_all request queued for 50000 students")`
- `Log("backend", "warn", "service", "email delivery retry scheduled for notification batch")`
- `Log("backend", "error", "service", "email delivery moved to dead letter queue")`

## Stage 5 Conclusion

The original pseudocode is slow and unreliable because it performs all work sequentially, mixes DB and external calls in one loop, and has no idempotency or retry model. A better design is:

- persist notification intent first
- create recipients and outbox events in one transaction
- process email and in-app delivery asynchronously
- track per-channel delivery status
- retry only failed tasks

This makes the system both fast and reliable at a 50,000-student scale.

# Stage 6

## Objective

Implement a Priority Inbox that fetches notifications from the protected API and returns the top 10 most important notifications based on:

- type weight: `Placement > Result > Event`
- recency: newer notifications rank higher within the same weight

## Code Submission

The working implementation is added in:

- `notification_stage6/src/stage6.ts`

It uses the existing logging middleware for operational logging and fetches data from the protected endpoint:

- `GET http://4.224.186.213/evaluation-service/notifications`

## Logging Middleware Usage

Stage 6 explicitly uses the custom logging middleware because:

- the assignment requires using it instead of built-in console logging
- the notifications endpoint is protected
- fetch start, fetch completion, ranking completion, and failure scenarios should be traceable

The implementation initializes the logger with `BEARER_TOKEN` and logs:

- Stage 6 run started
- notifications fetched successfully
- priority inbox generation completed
- failure cases with error messages

## Priority Logic

The ranking logic uses these weights:

- `Placement = 3`
- `Result = 2`
- `Event = 1`

Comparison rule:

1. higher weight wins
2. if weights are equal, newer timestamp wins

This gives deterministic ordering and matches the requirement that placement notifications should appear ahead of result notifications, which should appear ahead of event notifications.

## Efficient Top 10 Maintenance

Instead of sorting the entire list every time, the implementation uses a min-heap of fixed size `10`.

### Why This Is Efficient

For `m` incoming notifications:

- full sort approach: `O(m log m)`
- bounded heap approach: `O(m log 10)` which is effectively `O(m)`

Since `10` is constant, the heap-based approach is the better choice when new notifications keep arriving.

## How the Heap Works

For each notification:

1. convert it to a comparable ranked record with weight and parsed timestamp
2. if heap size is less than 10, push it
3. if heap is full and the new notification ranks higher than the smallest item, replace the root
4. at the end, sort only the final heap contents in descending priority order

This keeps only the best 10 records in memory at any point.

## Unread Handling Assumption

The sample API response shown in the assignment includes:

- `ID`
- `Type`
- `Message`
- `Timestamp`

but it does not show a read/unread field.

Therefore, the implementation supports these cases:

- if `Read` exists, it filters out read notifications
- if `IsRead` exists, it filters out read notifications
- if neither exists, it treats the fetched records as inbox candidates

This is the safest assumption based on the provided API sample.

## Output Artifacts

When the script runs successfully, it writes:

- `notification_stage6/stage6_output.json`
- `notification_stage6/stage6_output.txt`

These files can be used for:

- verifying the top 10 order
- taking the screenshots requested by the assignment

## How to Run

From `notification_stage6`:

```bash
npm run stage6
```

The script expects:

- `BEARER_TOKEN` to be present in environment
- or `notification_stage6/.env`
- or `logging_middleware/src/.env`

## Design Notes

This solution keeps the implementation simple and aligned with the assignment:

- no database storage
- no hard-coded notifications
- actual API fetch
- actual executable TypeScript code
- logging middleware integrated into the execution path

## Stage 6 Conclusion

The chosen approach satisfies the coding requirement and scales efficiently for continuous notification arrival. A bounded min-heap is the right structure for maintaining the live top 10, while the logging middleware ensures the protected fetch and ranking workflow remains observable.
