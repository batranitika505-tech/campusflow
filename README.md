# CampusFlow

> A modern student assignment and deadline management platform built with Express 5, `express-api-toolkit`, and vanilla web technologies.

---

## Table of Contents

1. [Project Overview & Problem Statement](#project-overview--problem-statement)
2. [Key Features & Screenshots](#key-features--screenshots)
3. [Technology Stack & Architecture](#technology-stack--architecture)
4. [Installation & Local Setup](#installation--local-setup)
5. [Configuration & Environment](#configuration--environment)
6. [API Endpoint Documentation](#api-endpoint-documentation)
7. [`express-api-toolkit` Integration](#express-api-toolkit-integration)
8. [Testing & Verification](#testing--verification)
9. [Project Structure](#project-structure)
10. [Future Improvements](#future-improvements)

---

## Project Overview & Problem Statement

### The Problem
University students balance multiple courses simultaneously, each with distinct deliverables, submission systems, evaluation weights, and deadlines. Traditional calendar tools lack academic context (such as subject associations, priority flags, and completion states), while enterprise task managers are overly complex. As a consequence, students often miss submission windows, misjudge urgency, or lack visibility into their overall academic workload.

### The Solution
**CampusFlow** provides a purpose-built, accessible student assignment and deadline management system. Designed as a full-stack application, CampusFlow combines a resilient Node.js / Express REST API with an intuitive, responsive frontend. It centralizes academic assignments, tracks overdue and upcoming submission dates, provides real-time workload statistics, and enforces rigorous calendar-date validation.

---

## Key Features & Screenshots

- **Workload Dashboard**: Real-time summary cards displaying total, pending, in-progress, completed, and overdue coursework, alongside a visual progress bar and completion rate.
- **Dedicated Deadline Management**: Visual classification separating imminent deliverables (due within 7 days) from overdue tasks, complete with direct edit workflows.
- **Multi-Facet Search & Filtering**: Debounced full-text search across titles and descriptions, dynamic subject filters populated directly from existing coursework, and priority/status dropdowns.
- **Assignment CRUD Modals**: Accessible modal dialogs for creating, editing, and deleting assignments with client-side validation, server error feedback, and loading button states.
- **Strict Gregorian Date Validation**: Algorithmic calendar validation enforcing true leap years (including century leap-year exceptions) and month boundaries without timezone-shifting quirks.
- **Responsive App Shell**: Fluid layout adapting seamlessly across desktop (sidebar), tablet (single-column collapsing), mobile (drawer navigation), and ultra-compact viewports (320px).

### Interface Previews

```text
+---------------------------------------------------------------------------------------+
|  [Logo] CampusFlow  Academic Planner                     [ Status: Connected (●) ]    |
+-------------------+-------------------------------------------------------------------+
|  Navigation       |  Dashboard                                          [ Refresh ]   |
|  ──────────────── |  ---------------------------------------------------------------  |
|  [●] Dashboard    |  [ Total: 4 ] [ Pending: 2 ] [ In-Progress: 1 ] [ Completed: 1 ]  |
|  [ ] Assignments  |                                                                   |
|  [ ] Deadlines    |  Overall Completion: 25% [====---------------------------------]  |
|  [ ] Subjects     |                                                                   |
|                   |  Upcoming Deadlines (Next 7 Days)                                 |
|                   |  • Normalization Exercises — DBMS (Due: Tomorrow) [High]          |
|                   |  • React Component Tree — Frontend (Due: 3 Days) [Medium]         |
+-------------------+-------------------------------------------------------------------+
```

*(Screenshots can be added here once visual assets are captured: `docs/screenshots/dashboard.png`, `docs/screenshots/assignments.png`, `docs/screenshots/deadlines.png`)*

---

## Technology Stack & Architecture

### Stack
- **Backend Runtime**: Node.js (v18+)
- **Web Framework**: Express 5 (`^5.3.0`)
- **API Toolkit**: `express-api-toolkit` (`^1.0.0`)
- **Frontend**: Semantic HTML5, Vanilla CSS3 (custom design system tokens), Vanilla JavaScript (ES6+ async/await, DOM event delegation, URL hash routing)
- **Data Persistence**: JSON filesystem persistence (`fs/promises`)
- **Test Runner**: Node.js native test runner (`node:test`, `node:assert`)

### Architecture
CampusFlow follows a clean layered MVC/Service architecture:

```text
[ Client: Browser UI ]
         │  HTTP / JSON
         ▼
[ Express Router ] ────► [ Middleware: requestId, requestLogger, validateRequest ]
                                  │
                                  ▼
                         [ Controllers ] ◄────► [ express-api-toolkit Helpers ]
                                  │             (successResponse, paginateResponse,
                                  ▼              asyncHandler, getPagination)
                         [ Services ] ◄───────► [ Error Handling: ApiError ]
                                  │
                                  ▼
                         [ File Storage Utility ]
                                  │
                                  ▼
                     [ Data: assignments.json ]
```

---

## Installation & Local Setup

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Step-by-Step Setup

1. **Navigate to the project directory**:
   ```bash
   cd campusflow
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   node src/server.js
   ```

4. **Access the application**:
   Open your browser and navigate to:
   ```text
   http://localhost:5050
   ```

---

## Configuration & Environment

The application runs with sensible defaults and requires zero mandatory `.env` files. The following runtime environment variable is supported:

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | `number` | `5050` | Port on which the HTTP server listens (`src/server.js`). |

### Application Constants (`src/config/constants.js`)

- **Assignment Statuses**: `pending`, `in-progress`, `completed`
- **Assignment Priorities**: `low`, `medium`, `high`
- **Pagination Defaults**:
  - `DEFAULT_PAGE`: `1`
  - `DEFAULT_LIMIT`: `5`
  - `MAX_LIMIT`: `50`

---

## API Endpoint Documentation

All endpoints return a standardized JSON response envelope. Successful responses include `success: true` and either `data` or `data` + `pagination`. Error responses include `success: false`, `message`, and optional `errors`.

### Summary of Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint returning status and correlation ID. |
| `GET` | `/api/assignments` | Paginated listing with search and filter capabilities. |
| `POST` | `/api/assignments` | Create a new assignment. |
| `GET` | `/api/assignments/:id` | Retrieve an assignment by its numerical ID. |
| `PATCH` | `/api/assignments/:id` | Partially update an existing assignment. |
| `DELETE` | `/api/assignments/:id` | Remove an assignment. |
| `GET` | `/api/assignments/upcoming` | Retrieve non-completed assignments due in next 7 days. |
| `GET` | `/api/assignments/overdue` | Retrieve non-completed assignments past their due date. |
| `GET` | `/api/assignments/stats` | Aggregated workload counts and completion percentage. |
| `GET` | `/api/subjects` | Alphabetical list of unique assignment subjects. |

---

### Detailed Endpoint Specifications

#### 1. `GET /api/health`
- **Description**: Verifies service availability and returns request correlation identifier.
- **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "CampusFlow API is running",
    "requestId": "req_1731864000000_abc123"
  }
  ```

#### 2. `GET /api/assignments`
- **Description**: Returns paginated assignments sorted by `dueDate` ascending.
- **Query Parameters**:
  - `search` *(string, optional)*: Partial case-insensitive match on title or description.
  - `status` *(string, optional)*: Filter by `pending`, `in-progress`, or `completed`.
  - `priority` *(string, optional)*: Filter by `low`, `medium`, or `high`.
  - `subject` *(string, optional)*: Filter by subject name (case-insensitive).
  - `page` *(integer, optional, default: 1)*: Page number.
  - `limit` *(integer, optional, default: 5, max: 50)*: Items per page.
- **Example Request**:
  ```text
  GET /api/assignments?status=pending&priority=high&page=1&limit=2
  ```
- **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignments retrieved successfully",
    "data": [
      {
        "id": 1,
        "title": "DBMS Normalization Assignment",
        "description": "Complete 3NF exercises",
        "subject": "DBMS",
        "dueDate": "2026-11-20",
        "priority": "high",
        "status": "pending",
        "createdAt": "2026-11-17T12:00:00.000Z",
        "updatedAt": "2026-11-17T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 2,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

#### 3. `POST /api/assignments`
- **Description**: Creates a new assignment.
- **Request Body**:
  ```json
  {
    "title": "Operating Systems Virtual Memory Lab",
    "subject": "Operating Systems",
    "dueDate": "2026-12-05",
    "priority": "high",
    "status": "pending",
    "description": "Implement page replacement algorithms"
  }
  ```
- **Validation Rules**:
  - `title`: Required, non-empty string.
  - `subject`: Required, non-empty string.
  - `dueDate`: Required string in `YYYY-MM-DD` format conforming to real Gregorian calendar dates.
  - `priority`: Optional string (`low`, `medium`, `high`; default: `medium`).
  - `status`: Optional string (`pending`, `in-progress`, `completed`; default: `pending`).
- **Example Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Assignment created successfully",
    "data": {
      "id": 5,
      "title": "Operating Systems Virtual Memory Lab",
      "description": "Implement page replacement algorithms",
      "subject": "Operating Systems",
      "dueDate": "2026-12-05",
      "priority": "high",
      "status": "pending",
      "createdAt": "2026-11-17T14:30:00.000Z",
      "updatedAt": "2026-11-17T14:30:00.000Z"
    }
  }
  ```

#### 4. `PATCH /api/assignments/:id`
- **Description**: Partially updates specified fields of an existing assignment.
- **Request Body**: Any subset of allowed fields (`title`, `subject`, `dueDate`, `priority`, `status`, `description`).
  ```json
  {
    "status": "in-progress",
    "priority": "high"
  }
  ```
- **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment updated successfully",
    "data": {
      "id": 5,
      "title": "Operating Systems Virtual Memory Lab",
      "description": "Implement page replacement algorithms",
      "subject": "Operating Systems",
      "dueDate": "2026-12-05",
      "priority": "high",
      "status": "in-progress",
      "createdAt": "2026-11-17T14:30:00.000Z",
      "updatedAt": "2026-11-17T14:35:00.000Z"
    }
  }
  ```

#### 5. `DELETE /api/assignments/:id`
- **Description**: Permanently deletes the specified assignment.
- **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment deleted successfully",
    "data": {
      "id": 5,
      "title": "Operating Systems Virtual Memory Lab"
    }
  }
  ```

#### 6. `GET /api/assignments/stats`
- **Description**: Returns calculated assignment metrics and completion percentage.
- **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assignment statistics retrieved successfully",
    "data": {
      "total": 4,
      "pending": 2,
      "inProgress": 1,
      "completed": 1,
      "overdue": 1,
      "upcoming": 2,
      "completionPercentage": 25
    }
  }
  ```

#### 7. Error Response Format (400 / 404 / 500)
- **Example Validation Failure (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "body": [
        "title is required",
        "dueDate must be a string"
      ]
    }
  }
  ```

---

## `express-api-toolkit` Integration

The package `express-api-toolkit` (v1.0.0) exports 10 utilities. CampusFlow actively integrates 9 of these utilities across the application layers, while intentionally omitting `errorResponse` in favor of centralized error middleware.

### Actively Used Exports (9)

| Exported Utility | Integration Location | Functional Purpose in CampusFlow |
|---|---|---|
| `requestId` | `src/app.js` | Mounts correlation ID middleware; injects `x-request-id` header on requests/responses and surfaces ID on `/api/health`. |
| `requestLogger` | `src/app.js` | Automatically logs method, path, HTTP status, and duration (ms) for every request. |
| `validateRequest` | `src/routes/assignmentRoutes.js` | Enforces declarative validation on query parameters and mutation request bodies (`title`, `subject`, `dueDate` types and presence). |
| `asyncHandler` | `src/controllers/*.js` | Wraps all asynchronous controller methods, catching unhandled promise rejections and delegating them to `next(err)`. |
| `getPagination` | `src/controllers/assignmentController.js` | Sanitizes query pagination inputs (`page`, `limit`), handles bounds checking, and computes offset `skip`. |
| `paginateResponse` | `src/controllers/assignmentController.js` | Formats standardized paginated JSON response envelopes including `pagination` metadata. |
| `successResponse` | `src/controllers/*.js` | Standardizes successful HTTP 200/201 responses into uniform `{ success: true, message, data }` envelopes. |
| `ApiError` | `src/services/*.js`, `src/middleware/*.js` | Operational error class specifying HTTP status codes (`400`, `404`) and message payloads. |
| `errorHandler` | `src/app.js` | Centralized Express error-handling middleware that catches all `ApiError` instances and formats uniform error JSON envelopes. |

### Intentionally Unused Export: `errorResponse`
The `express-api-toolkit` package exports an `errorResponse` function designed for sending immediate error responses directly from route handlers (e.g., `errorResponse(res, "Forbidden", 403)`).

In CampusFlow, all route controllers and services intentionally adhere to a **centralized error-handling architecture**. Rather than issuing fragmented, direct HTTP error responses inside individual controller functions, services and middleware throw structured `ApiError` instances. Express routes errors to `errorHandler`, which automatically formats identical `{ success: false, message, errors }` payloads. Consequently, direct calls to `errorResponse` are unnecessary in the application pipeline.

---

## Testing & Verification

CampusFlow includes a comprehensive automated test suite built with Node's native test runner (`node:test`). Tests run in clean isolation with automatic database backup and restoration.

### Running Tests

```bash
npm test
```

### Test Coverage Summary (23 Tests)

1. **Title & Description Search**: Partial matching, case-insensitivity, and description matching.
2. **Search Edge Cases**: Empty query rejection, whitespace rejection, and regex special character safety (`C++`, `.*`, `norm[`).
3. **Filtering**: Individual status, priority, and subject filtering (with case-insensitive matching).
4. **Combined Filtering**: Logical `AND` across multiple filters and empty-result handling.
5. **Invalid Filters**: HTTP 400 rejection on invalid status or priority values.
6. **Pagination Mechanics**: Default page limits, custom page limits, and ascending due-date sorting.
7. **Filtered Pagination**: Pagination calculation applied after filter criteria.
8. **Pagination Boundaries**: Rejection of negative, non-numeric, zero, or excessive limit queries (> 50).
9. **Upcoming Deliverables**: Accurate inclusion of tasks due today and Day 7 boundary; exclusion of Day 8+ tasks.
10. **Completed Task Exclusion**: Strict exclusion of completed tasks from upcoming views.
11. **Overdue Deliverables**: Inclusion of past-due deliverables (`< today`) and exclusion of completed tasks.
12. **Workload Statistics**: Mathematical verification that `total === pending + inProgress + completed` and accurate completion percentage.
13. **Empty Dataset Handling**: Safe handling when zero assignments exist (no division-by-zero errors).
14. **Subject Discovery**: Alphabetically sorted, unique subject listing from `GET /api/subjects`.
15. **Full CRUD Regression**: End-to-end verification of creation, retrieval, partial update, and deletion.
16. **Health Check & Unknown Routes**: Route fallback handling (HTTP 404) and correlation ID verification.
17. **Schema Body Validation**: HTTP 400 rejection on invalid body types or missing required creation fields.
18. **Malformed JSON Handling**: HTTP 400 Bad Request handling when receiving malformed JSON payloads.
19. **Route Parameter Sanitization**: HTTP 404 handling on non-numeric or invalid IDs (`abc`, `null`, `undefined`, `-5`).
20. **Whitespace String Boundaries**: HTTP 400 rejection for whitespace-only titles or subjects.
21. **Search Punctuation & Regex Safety**: Verification that queries with regex tokens do not crash server processes.
22. **Out-of-Range Pagination**: Safe handling when requesting pages beyond the total available records.
23. **Filesystem Persistence**: Direct verification that changes are committed to `src/data/assignments.json` on disk.

---

## Project Structure

```text
campusflow/
├── public/                       # Frontend client assets
│   ├── app.js                    # Vanilla JS client (state, API client, event handlers)
│   ├── index.html                # Semantic HTML5 application shell & modal structures
│   └── style.css                 # Custom CSS design system, components, and media queries
├── src/                          # Backend application source
│   ├── config/
│   │   └── constants.js          # Status, priority, and pagination constants
│   ├── controllers/
│   │   ├── assignmentController.js # Assignment HTTP request/response handlers
│   │   └── subjectController.js    # Subject discovery controller
│   ├── data/
│   │   ├── assignments.json      # Persistent JSON data store
│   │   └── tasks.js              # Reference seed task data
│   ├── middleware/
│   │   └── notFound.js           # 404 Route Not Found middleware
│   ├── routes/
│   │   ├── assignmentRoutes.js   # Assignment route definitions & validation schemas
│   │   ├── subjectRoutes.js      # Subject route definitions
│   │   └── taskRoutes.js         # Reserved task routes
│   ├── services/
│   │   ├── assignmentService.js  # Assignment domain logic, date math, & storage orchestration
│   │   └── subjectService.js     # Subject aggregation logic
│   ├── utils/
│   │   └── fileStorage.js        # File I/O helpers for assignments.json
│   ├── app.js                    # Express app configuration & middleware pipeline
│   └── server.js                 # HTTP server listener entry point
├── tests/
│   └── assignments.test.js       # Complete integration test suite (23 tests)
├── package.json                  # Project manifest, dependencies, and npm scripts
└── README.md                     # Comprehensive project documentation
```

---

## Future Improvements

1. **User Authentication & Multi-Tenancy**: Introduce JWT authentication or session-based cookies to support individual student accounts and course sections.
2. **Database Engine Migration**: Transition the storage layer from `assignments.json` to an ACID-compliant database (such as PostgreSQL or SQLite via Knex/Prisma) for high concurrency and transactions.
3. **Calendar Protocol Export**: Provide an endpoint generating standard iCalendar (`.ics`) feeds so students can subscribe to deadlines in Google Calendar or Apple Calendar.
4. **Automated Notification Webhooks**: Integrate scheduled deadline notifications (email or Discord/Slack webhooks) alerting students 24 hours prior to due dates.
5. **Course Syllabus Attachment**: Add file upload capabilities (PDF/DOCX) for assignment rubrics and submission guidelines.
