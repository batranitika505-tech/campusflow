# CampusFlow

CampusFlow is a student assignment and deadline management application built with Express and vanilla HTML, CSS, and JavaScript. It provides a clean, responsive interface and a standardized REST API to track coursework, manage submission deadlines, filter and search assignments, and visualize progress.

## Technology Stack

- **Backend**: Node.js, Express 5
- **API Toolkit**: `express-api-toolkit` (v1.0.0)
- **Frontend**: Semantic HTML5, CSS3 with custom design tokens, vanilla JavaScript (ES6+)
- **Testing**: Node.js native test runner (`node:test`, `node:assert`)

## API Endpoints

- `GET /api/health` — Service health check and correlation request ID.
- `GET /api/assignments` — Paginated assignment listing with search (`search`), status (`status`), priority (`priority`), and subject (`subject`) filters.
- `POST /api/assignments` — Create a new assignment with required `title`, `subject`, and `dueDate`.
- `GET /api/assignments/:id` — Retrieve an assignment by its identifier.
- `PATCH /api/assignments/:id` — Partially update an existing assignment.
- `DELETE /api/assignments/:id` — Remove an assignment.
- `GET /api/assignments/upcoming` — Active assignments due within the next 7 days.
- `GET /api/assignments/overdue` — Incomplete assignments past their due date.
- `GET /api/assignments/stats` — Summary metrics (total, pending, in-progress, completed, overdue, completion percentage).
- `GET /api/subjects` — Unique list of assignment subjects sorted alphabetically.

## `express-api-toolkit` Integration

CampusFlow integrates `express-api-toolkit` across its middleware, routing, controllers, and services:

1. **`requestId`**: Attaches a unique correlation ID (`x-request-id`) to every incoming request and response header.
2. **`requestLogger`**: Automatically logs request method, URL path, HTTP status, and duration in milliseconds.
3. **`validateRequest`**: Provides declarative schema-level validation:
   - Validates query filters (`search`, `status`, `priority`, `subject`, `page`, `limit`) on `GET /api/assignments`.
   - Validates expected body field types and required fields on `POST /api/assignments`.
   - Validates body field types while supporting partial updates on `PATCH /api/assignments/:id`.
4. **`asyncHandler`**: Wraps asynchronous route controller handlers to forward rejected promises to the error pipeline.
5. **`getPagination` & `paginateResponse`**: Safely sanitizes query pagination parameters (`page`, `limit`, `skip`) and formats standard paginated responses.
6. **`successResponse`**: Formats consistent success envelopes (`{ success: true, message, data }`).
7. **`ApiError`**: Operational error class used across services and route middleware for structured HTTP status codes and error payloads.
8. **`errorHandler`**: Centralized Express error-handling middleware that catches all forwarded errors and returns standardized error responses (`{ success: false, message, errors }`).

### Note on `errorResponse`

The `express-api-toolkit` package exports an `errorResponse` helper function designed for sending immediate, standalone error responses directly from route handlers (e.g., `return errorResponse(res, "Access Denied", 403);`).

In CampusFlow, all route controllers and services strictly follow a **centralized error-handling pattern**: operational errors and validation failures throw or forward `ApiError` instances to `next()`, which are then captured by `errorHandler`. Because `errorHandler` automatically generates the identical `{ success: false, message, errors }` response payload, manual invocations of `errorResponse` are unnecessary in the application flow. `errorResponse` remains available as an alternative helper for standalone endpoints where centralized error delegation is not desired.

## Running the Application

### Development Server

```bash
node src/server.js
```

The application will be accessible at `http://localhost:5050`.

### Running Tests

```bash
npm test
```

