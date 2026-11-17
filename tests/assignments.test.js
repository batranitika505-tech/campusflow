const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs/promises");
const path = require("node:path");
const app = require("../src/app");

const PORT = process.env.PORT || 5050;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DATA_FILE = path.join(__dirname, "../src/data/assignments.json");

function getCalendarDateString(d = new Date()) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("CampusFlow API Integration Tests (Phase 2 & Phase 3)", () => {
  let server;
  let originalData;

  before(async () => {
    // Backup original data
    originalData = await fs.readFile(DATA_FILE, "utf-8");

    // Start server on specified port
    await new Promise((resolve) => {
      server = app.listen(PORT, resolve);
    });
  });

  after(async () => {
    // Close server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    // Restore original assignments data
    if (originalData) {
      await fs.writeFile(DATA_FILE, originalData, "utf-8");
    }
  });

  // 1. Search by title and description
  test("1. Search assignments by title and description", async () => {
    // Search title
    let res = await fetch(`${BASE_URL}/api/assignments?search=Normalization`);
    assert.strictEqual(res.status, 200);
    let body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].id, 1);

    // Search description
    res = await fetch(`${BASE_URL}/api/assignments?search=exercises`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.strictEqual(body.data.length, 2); // IDs 1 and 2 mention exercises
  });

  // 2. Case-insensitive and partial search
  test("2. Case-insensitive, partial search, and empty search rejection", async () => {
    // Case-insensitive partial
    let res = await fetch(`${BASE_URL}/api/assignments?search=pRoMiSe`);
    assert.strictEqual(res.status, 200);
    let body = await res.json();
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].id, 2);

    // Partial match in title
    res = await fetch(`${BASE_URL}/api/assignments?search=react`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].id, 3);

    // Empty search query rejection
    res = await fetch(`${BASE_URL}/api/assignments?search=`);
    assert.strictEqual(res.status, 400);

    // Whitespace search rejection
    res = await fetch(`${BASE_URL}/api/assignments?search=%20%20%20`);
    assert.strictEqual(res.status, 400);
  });

  // 3. Individual filters
  test("3. Filter assignments individually by status, priority, and subject", async () => {
    // Filter by status
    let res = await fetch(`${BASE_URL}/api/assignments?status=pending`);
    assert.strictEqual(res.status, 200);
    let body = await res.json();
    assert(body.data.every((item) => item.status === "pending"));
    assert.strictEqual(body.data.length, 2);

    // Filter by priority
    res = await fetch(`${BASE_URL}/api/assignments?priority=high`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert(body.data.every((item) => item.priority === "high"));
    assert.strictEqual(body.data.length, 2);

    // Filter by subject (case-insensitive exact match)
    res = await fetch(`${BASE_URL}/api/assignments?subject=dbms`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].subject, "DBMS");
  });

  // 4. Combined filters
  test("4. Combine multiple filters using AND logic", async () => {
    let res = await fetch(
      `${BASE_URL}/api/assignments?status=pending&priority=high&subject=DBMS`
    );
    assert.strictEqual(res.status, 200);
    let body = await res.json();
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].id, 1);

    // Combined filters matching zero items
    res = await fetch(
      `${BASE_URL}/api/assignments?status=completed&priority=low`
    );
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.strictEqual(body.data.length, 0);
    assert.strictEqual(body.pagination.total, 0);
  });

  // 5. Invalid filters
  test("5. Reject invalid filter values with 400 Bad Request", async () => {
    // Invalid status
    let res = await fetch(`${BASE_URL}/api/assignments?status=unknown_status`);
    assert.strictEqual(res.status, 400);

    // Invalid priority
    res = await fetch(`${BASE_URL}/api/assignments?priority=urgent`);
    assert.strictEqual(res.status, 400);

    // Empty subject
    res = await fetch(`${BASE_URL}/api/assignments?subject=`);
    assert.strictEqual(res.status, 400);
  });

  // 6. Pagination and metadata
  test("6. Default pagination, custom pagination, and metadata", async () => {
    // Default page 1, limit 5
    let res = await fetch(`${BASE_URL}/api/assignments`);
    assert.strictEqual(res.status, 200);
    let body = await res.json();
    assert.strictEqual(body.pagination.page, 1);
    assert.strictEqual(body.pagination.limit, 5);
    assert.strictEqual(body.pagination.total, 4);
    assert.strictEqual(body.pagination.totalPages, 1);
    assert.strictEqual(body.data.length, 4);

    // Verify sorted by dueDate ascending
    const dueDates = body.data.map((item) => new Date(item.dueDate).getTime());
    for (let i = 1; i < dueDates.length; i++) {
      assert(dueDates[i] >= dueDates[i - 1]);
    }

    // Custom limit 2, page 1
    res = await fetch(`${BASE_URL}/api/assignments?page=1&limit=2`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.strictEqual(body.pagination.page, 1);
    assert.strictEqual(body.pagination.limit, 2);
    assert.strictEqual(body.pagination.total, 4);
    assert.strictEqual(body.pagination.totalPages, 2);
    assert.strictEqual(body.data.length, 2);

    // Page 2
    res = await fetch(`${BASE_URL}/api/assignments?page=2&limit=2`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.strictEqual(body.pagination.page, 2);
    assert.strictEqual(body.data.length, 2);
  });

  // 7. Pagination after filtering
  test("7. Apply search and filters before pagination and calculate total from filtered result", async () => {
    // 2 high priority items total
    let res = await fetch(`${BASE_URL}/api/assignments?priority=high&page=1&limit=1`);
    assert.strictEqual(res.status, 200);
    let body = await res.json();
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.pagination.page, 1);
    assert.strictEqual(body.pagination.limit, 1);
    assert.strictEqual(body.pagination.total, 2);
    assert.strictEqual(body.pagination.totalPages, 2);

    // Page 2 of filtered items
    res = await fetch(`${BASE_URL}/api/assignments?priority=high&page=2&limit=1`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.pagination.page, 2);
  });

  // 8. Invalid page and limit
  test("8. Reject invalid page and limit values with 400 Bad Request", async () => {
    // Page < 1
    let res = await fetch(`${BASE_URL}/api/assignments?page=0`);
    assert.strictEqual(res.status, 400);

    res = await fetch(`${BASE_URL}/api/assignments?page=-3`);
    assert.strictEqual(res.status, 400);

    // Page non-numeric
    res = await fetch(`${BASE_URL}/api/assignments?page=abc`);
    assert.strictEqual(res.status, 400);

    // Limit < 1
    res = await fetch(`${BASE_URL}/api/assignments?limit=0`);
    assert.strictEqual(res.status, 400);

    // Limit > 50
    res = await fetch(`${BASE_URL}/api/assignments?limit=51`);
    assert.strictEqual(res.status, 400);

    // Limit non-numeric
    res = await fetch(`${BASE_URL}/api/assignments?limit=xyz`);
    assert.strictEqual(res.status, 400);
  });

  // 9. Upcoming assignments, including today and 7-day boundary
  // 10. Exclusion of completed assignments
  test("9 & 10. Upcoming assignments include today and 7-day boundary, exclude completed and >7 days", async () => {
    const today = new Date();
    const todayStr = getCalendarDateString(today);

    const day7 = new Date();
    day7.setDate(day7.getDate() + 7);
    const day7Str = getCalendarDateString(day7);

    const day8 = new Date();
    day8.setDate(day8.getDate() + 8);
    const day8Str = getCalendarDateString(day8);

    // Create test assignments
    // 1. Due today (pending) -> should appear in upcoming
    await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Upcoming Due Today",
        subject: "Math",
        dueDate: todayStr,
        status: "pending",
      }),
    });

    // 2. Due Day 7 (boundary day, pending) -> should appear in upcoming
    await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Upcoming Day 7 Boundary",
        subject: "Physics",
        dueDate: day7Str,
        status: "in-progress",
      }),
    });

    // 3. Due Day 8 (beyond boundary) -> should NOT appear in upcoming
    await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Far Future Assignment",
        subject: "Biology",
        dueDate: day8Str,
        status: "pending",
      }),
    });

    // 4. Due today but completed -> should be EXCLUDED
    await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Today Completed Assignment",
        subject: "Chemistry",
        dueDate: todayStr,
        status: "completed",
      }),
    });

    const res = await fetch(`${BASE_URL}/api/assignments/upcoming`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert(Array.isArray(body.data));

    // Confirm no completed assignments are included
    assert(body.data.every((item) => item.status !== "completed"));

    // Confirm "Upcoming Due Today" and "Upcoming Day 7 Boundary" are present
    assert(body.data.some((item) => item.title === "Upcoming Due Today"));
    assert(body.data.some((item) => item.title === "Upcoming Day 7 Boundary"));

    // Confirm "Far Future Assignment" and "Today Completed Assignment" are not present
    assert(!body.data.some((item) => item.title === "Far Future Assignment"));
    assert(!body.data.some((item) => item.title === "Today Completed Assignment"));

    // Confirm sorted by nearest due date first
    const dates = body.data.map((item) => new Date(item.dueDate).getTime());
    for (let i = 1; i < dates.length; i++) {
      assert(dates[i] >= dates[i - 1]);
    }
  });

  // 11. Overdue assignments and date boundaries
  test("11. Overdue assignments include strictly before today and exclude completed", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getCalendarDateString(yesterday);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const pastDateStr = getCalendarDateString(pastDate);

    // Overdue pending assignment
    await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Overdue Pending 1",
        subject: "History",
        dueDate: yesterdayStr,
        status: "pending",
      }),
    });

    // Older overdue assignment
    await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Overdue Older Pending",
        subject: "History",
        dueDate: pastDateStr,
        status: "in-progress",
      }),
    });

    // Overdue but completed assignment -> should be EXCLUDED
    await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Overdue Completed Assignment",
        subject: "History",
        dueDate: yesterdayStr,
        status: "completed",
      }),
    });

    const res = await fetch(`${BASE_URL}/api/assignments/overdue`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert(Array.isArray(body.data));

    // Confirm no completed assignments
    assert(body.data.every((item) => item.status !== "completed"));

    // Confirm overdue items present
    assert(body.data.some((item) => item.title === "Overdue Pending 1"));
    assert(body.data.some((item) => item.title === "Overdue Older Pending"));
    assert(!body.data.some((item) => item.title === "Overdue Completed Assignment"));

    // Confirm sorted oldest overdue date first
    const dates = body.data.map((item) => new Date(item.dueDate).getTime());
    for (let i = 1; i < dates.length; i++) {
      assert(dates[i] >= dates[i - 1]);
    }
  });

  // 12. Statistics and completion percentage
  test("12. Statistics endpoint returns consistent counts and completion percentage", async () => {
    const res = await fetch(`${BASE_URL}/api/assignments/stats`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const stats = body.data;
    assert.strictEqual(typeof stats.total, "number");
    assert.strictEqual(typeof stats.pending, "number");
    assert.strictEqual(typeof stats.inProgress, "number");
    assert.strictEqual(typeof stats.completed, "number");
    assert.strictEqual(typeof stats.overdue, "number");
    assert.strictEqual(typeof stats.upcoming, "number");
    assert.strictEqual(typeof stats.completionPercentage, "number");

    // Total must equal pending + inProgress + completed
    assert.strictEqual(stats.total, stats.pending + stats.inProgress + stats.completed);

    // Completion percentage check
    const expectedPercentage =
      stats.total === 0 ? 0 : Number(((stats.completed / stats.total) * 100).toFixed(2));
    assert.strictEqual(stats.completionPercentage, expectedPercentage);
  });

  // 13. Empty dataset behavior
  test("13. Handles empty dataset cleanly across all endpoints", async () => {
    // Temporarily clear assignments file
    await fs.writeFile(DATA_FILE, "[]", "utf-8");

    // GET /api/assignments
    let res = await fetch(`${BASE_URL}/api/assignments`);
    assert.strictEqual(res.status, 200);
    let body = await res.json();
    assert.strictEqual(body.data.length, 0);
    assert.strictEqual(body.pagination.total, 0);
    assert.strictEqual(body.pagination.totalPages, 0);

    // GET /api/assignments/upcoming
    res = await fetch(`${BASE_URL}/api/assignments/upcoming`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.deepStrictEqual(body.data, []);

    // GET /api/assignments/overdue
    res = await fetch(`${BASE_URL}/api/assignments/overdue`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.deepStrictEqual(body.data, []);

    // GET /api/assignments/stats
    res = await fetch(`${BASE_URL}/api/assignments/stats`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.deepStrictEqual(body.data, {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      upcoming: 0,
      completionPercentage: 0,
    });

    // GET /api/subjects
    res = await fetch(`${BASE_URL}/api/subjects`);
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.deepStrictEqual(body.data, []);

    // Restore original data for remaining tests
    await fs.writeFile(DATA_FILE, originalData, "utf-8");
  });

  // 14. Unique, alphabetically sorted subjects
  test("14. GET /api/subjects returns unique, alphabetically sorted subjects", async () => {
    const res = await fetch(`${BASE_URL}/api/subjects`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Subjects retrieved successfully");
    assert.deepStrictEqual(body.data, [
      "DBMS",
      "JavaScript",
      "Mobile Development",
      "Operating Systems",
    ]);
  });

  // 15. Regression tests for Phase 2 CRUD endpoints
  test("15. Regression tests for all Phase 2 CRUD operations", async () => {
    // 1. Get by ID
    let res = await fetch(`${BASE_URL}/api/assignments/1`);
    assert.strictEqual(res.status, 200);
    let body = await res.json();
    assert.strictEqual(body.data.id, 1);
    assert.strictEqual(body.data.title, "DBMS Normalization Assignment");

    // 2. Get nonexistent ID -> 404
    res = await fetch(`${BASE_URL}/api/assignments/9999`);
    assert.strictEqual(res.status, 404);

    // 3. Create valid assignment -> 201
    const newAssignment = {
      title: "Regression Test Assignment",
      subject: "Testing",
      dueDate: "2026-12-15",
      priority: "medium",
      status: "pending",
    };
    res = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAssignment),
    });
    assert.strictEqual(res.status, 201);
    body = await res.json();
    const createdId = body.data.id;
    assert.strictEqual(body.data.title, "Regression Test Assignment");

    // 4. Create invalid assignment -> 400
    res = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    assert.strictEqual(res.status, 400);

    // 5. Update assignment -> 200
    res = await fetch(`${BASE_URL}/api/assignments/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Regression Title", status: "completed" }),
    });
    assert.strictEqual(res.status, 200);
    body = await res.json();
    assert.strictEqual(body.data.title, "Updated Regression Title");
    assert.strictEqual(body.data.status, "completed");

    // 6. Update nonexistent assignment -> 404
    res = await fetch(`${BASE_URL}/api/assignments/9999`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nope" }),
    });
    assert.strictEqual(res.status, 404);

    // 7. Update invalid values -> 400
    res = await fetch(`${BASE_URL}/api/assignments/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: "nonexistent-priority" }),
    });
    assert.strictEqual(res.status, 400);

    // 8. Delete assignment -> 200
    res = await fetch(`${BASE_URL}/api/assignments/${createdId}`, {
      method: "DELETE",
    });
    assert.strictEqual(res.status, 200);

    // 9. Confirm deleted assignment returns 404
    res = await fetch(`${BASE_URL}/api/assignments/${createdId}`);
    assert.strictEqual(res.status, 404);

    // 10. Delete nonexistent assignment -> 404
    res = await fetch(`${BASE_URL}/api/assignments/9999`, {
      method: "DELETE",
    });
    assert.strictEqual(res.status, 404);
  });

  // 16. Health check and unknown route handling
  test("16. Health check endpoint and unknown route handling regressions", async () => {
    // Health check
    let res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    let body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "CampusFlow API is running");
    assert(body.requestId);

    // Unknown route
    res = await fetch(`${BASE_URL}/api/completely-unknown-route`);
    assert.strictEqual(res.status, 404);
    body = await res.json();
    assert.strictEqual(body.success, false);
    assert(body.message.includes("Route not found"));
  });
});
