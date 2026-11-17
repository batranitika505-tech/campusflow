const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs/promises");
const path = require("node:path");
const app = require("../src/app");

const PORT = process.env.PORT || 5050;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DATA_FILE = path.join(__dirname, "../src/data/assignments.json");

describe("Assignment CRUD API Integration Tests", () => {
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

  // 1. List assignments
  test("1. GET /api/assignments returns all assignments", async () => {
    const res = await fetch(`${BASE_URL}/api/assignments`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Assignments retrieved successfully");
    assert(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 4);
    assert.strictEqual(body.data[0].id, 1);
  });

  // 2. Retrieve an existing assignment
  test("2. GET /api/assignments/:id returns the requested assignment", async () => {
    const res = await fetch(`${BASE_URL}/api/assignments/1`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Assignment retrieved successfully");
    assert.strictEqual(body.data.id, 1);
    assert.strictEqual(body.data.title, "DBMS Normalization Assignment");
    assert.strictEqual(body.data.subject, "DBMS");
  });

  // 3. Retrieve a nonexistent assignment and receive 404
  test("3. GET /api/assignments/:id with nonexistent ID returns 404", async () => {
    const res = await fetch(`${BASE_URL}/api/assignments/9999`);
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, "Assignment not found");
  });

  // 4. Create a valid assignment
  test("4. POST /api/assignments creates a new assignment with 201 status", async () => {
    const newAssignment = {
      title: "Algorithms Dynamic Programming",
      description: "Solve knapsack and longest common subsequence problems.",
      subject: "Algorithms",
      dueDate: "2026-11-28",
      priority: "high",
      status: "pending",
    };

    const res = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAssignment),
    });

    assert.strictEqual(res.status, 201);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Assignment created successfully");
    assert.strictEqual(body.data.id, 5);
    assert.strictEqual(body.data.title, newAssignment.title);
    assert.strictEqual(body.data.subject, newAssignment.subject);
    assert.strictEqual(body.data.dueDate, newAssignment.dueDate);
    assert.strictEqual(body.data.priority, newAssignment.priority);
    assert.strictEqual(body.data.status, newAssignment.status);
    assert(body.data.createdAt);
    assert(body.data.updatedAt);
  });

  // 5. Reject invalid assignment data
  test("5. POST /api/assignments rejects missing required fields and invalid values", async () => {
    // Missing title
    let res = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Algorithms",
        dueDate: "2026-11-28",
      }),
    });
    assert.strictEqual(res.status, 400);
    let body = await res.json();
    assert.strictEqual(body.success, false);

    // Missing subject
    res = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Algorithms HW",
        dueDate: "2026-11-28",
      }),
    });
    assert.strictEqual(res.status, 400);

    // Missing dueDate
    res = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Algorithms HW",
        subject: "Algorithms",
      }),
    });
    assert.strictEqual(res.status, 400);

    // Invalid dueDate format
    res = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Algorithms HW",
        subject: "Algorithms",
        dueDate: "not-a-valid-date",
      }),
    });
    assert.strictEqual(res.status, 400);

    // Invalid priority
    res = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Algorithms HW",
        subject: "Algorithms",
        dueDate: "2026-11-28",
        priority: "critical",
      }),
    });
    assert.strictEqual(res.status, 400);

    // Invalid status
    res = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Algorithms HW",
        subject: "Algorithms",
        dueDate: "2026-11-28",
        status: "archived",
      }),
    });
    assert.strictEqual(res.status, 400);
  });

  // 6. Update an existing assignment
  test("6. PATCH /api/assignments/:id updates an existing assignment", async () => {
    const updates = {
      title: "Updated Algorithms Title",
      status: "in-progress",
      priority: "medium",
    };

    const res = await fetch(`${BASE_URL}/api/assignments/5`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Assignment updated successfully");
    assert.strictEqual(body.data.id, 5);
    assert.strictEqual(body.data.title, "Updated Algorithms Title");
    assert.strictEqual(body.data.status, "in-progress");
    assert.strictEqual(body.data.priority, "medium");
    assert.strictEqual(body.data.subject, "Algorithms"); // preserved
  });

  // 7. Reject updates for nonexistent assignments
  test("7. PATCH /api/assignments/:id rejects updates for nonexistent IDs with 404", async () => {
    const res = await fetch(`${BASE_URL}/api/assignments/9999`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nonexistent" }),
    });

    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, "Assignment not found");
  });

  // Reject invalid updates
  test("Reject invalid updates (empty fields, invalid status/priority, no valid fields)", async () => {
    // Empty title
    let res = await fetch(`${BASE_URL}/api/assignments/5`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "   " }),
    });
    assert.strictEqual(res.status, 400);

    // Invalid priority
    res = await fetch(`${BASE_URL}/api/assignments/5`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: "super-high" }),
    });
    assert.strictEqual(res.status, 400);

    // Invalid status
    res = await fetch(`${BASE_URL}/api/assignments/5`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    assert.strictEqual(res.status, 400);

    // No valid fields
    res = await fetch(`${BASE_URL}/api/assignments/5`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unknownField: "test", anotherField: 123 }),
    });
    assert.strictEqual(res.status, 400);
  });

  // 8. Delete an existing assignment
  test("8. DELETE /api/assignments/:id deletes an existing assignment", async () => {
    const res = await fetch(`${BASE_URL}/api/assignments/5`, {
      method: "DELETE",
    });

    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Assignment deleted successfully");
    assert.strictEqual(body.data.id, 5);
  });

  // 9. Confirm deleted assignments cannot be retrieved
  test("9. GET /api/assignments/:id confirms deleted assignment returns 404", async () => {
    const res = await fetch(`${BASE_URL}/api/assignments/5`);
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, "Assignment not found");
  });

  // 10. Confirm JSON persistence works after requests
  test("10. Verify JSON persistence in file storage after CRUD operations", async () => {
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const storedAssignments = JSON.parse(fileContent);

    assert(Array.isArray(storedAssignments));
    assert.strictEqual(storedAssignments.length, 4);
    assert(!storedAssignments.some((item) => item.id === 5));
    assert.strictEqual(storedAssignments[0].id, 1);
  });

  // Extra verification: Health endpoint & requestId
  test("Health check endpoint returns 200 and requestId", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "CampusFlow API is running");
    assert(body.requestId);
  });

  // Extra verification: Not found middleware
  test("Unknown routes return standardized 404 error", async () => {
    const res = await fetch(`${BASE_URL}/api/nonexistent-route`);
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert(body.message.includes("Route not found"));
  });
});
