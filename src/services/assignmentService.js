const { ApiError } = require("express-api-toolkit");

const {
  readData,
  writeData,
  getNextId,
} = require("../utils/fileStorage");

const {
  ASSIGNMENT_STATUS,
  ASSIGNMENT_PRIORITY,
} = require("../config/constants");

// Get all assignments with search, filtering, sorting, and pagination
async function getAllAssignments(options = {}) {
  const { search, status, priority, subject, skip, limit } = options;
  let assignments = await readData();

  // Search across title and description (case-insensitive partial match)
  if (search !== undefined) {
    if (typeof search !== "string" || !search.trim()) {
      throw new ApiError(400, "Search query cannot be empty");
    }
    const term = search.trim().toLowerCase();
    assignments = assignments.filter((item) => {
      const matchTitle = item.title && item.title.toLowerCase().includes(term);
      const matchDesc = item.description && item.description.toLowerCase().includes(term);
      return Boolean(matchTitle || matchDesc);
    });
  }

  // Filter by status
  if (status !== undefined) {
    if (!Object.values(ASSIGNMENT_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid assignment status");
    }
    assignments = assignments.filter((item) => item.status === status);
  }

  // Filter by priority
  if (priority !== undefined) {
    if (!Object.values(ASSIGNMENT_PRIORITY).includes(priority)) {
      throw new ApiError(400, "Invalid assignment priority");
    }
    assignments = assignments.filter((item) => item.priority === priority);
  }

  // Filter by subject (case-insensitive exact match)
  if (subject !== undefined) {
    if (typeof subject !== "string" || !subject.trim()) {
      throw new ApiError(400, "Subject query cannot be empty");
    }
    const subj = subject.trim().toLowerCase();
    assignments = assignments.filter(
      (item) => item.subject && item.subject.toLowerCase() === subj
    );
  }

  // Sort by due date ascending, tie-break by ID
  assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate) || a.id - b.id);

  const total = assignments.length;

  if (skip !== undefined && limit !== undefined) {
    assignments = assignments.slice(skip, skip + limit);
  }

  return {
    assignments,
    total,
  };
}

// Get a single assignment by ID
async function getAssignmentById(id) {
  const assignments = await readData();

  const assignment = assignments.find(
    (item) => item.id === Number(id)
  );

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  return assignment;
}

// Create a new assignment
async function createAssignment(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ApiError(400, "Assignment data is required");
  }

  const { title, description, subject, dueDate, priority, status } = data;

  if (
    !title ||
    typeof title !== "string" ||
    !title.trim() ||
    !subject ||
    typeof subject !== "string" ||
    !subject.trim() ||
    !dueDate ||
    (typeof dueDate === "string" && !dueDate.trim())
  ) {
    throw new ApiError(
      400,
      "Title, subject and due date are required"
    );
  }

  if (isNaN(Date.parse(dueDate))) {
    throw new ApiError(400, "Invalid due date format");
  }

  if (
    priority &&
    !Object.values(ASSIGNMENT_PRIORITY).includes(priority)
  ) {
    throw new ApiError(400, "Invalid assignment priority");
  }

  if (
    status &&
    !Object.values(ASSIGNMENT_STATUS).includes(status)
  ) {
    throw new ApiError(400, "Invalid assignment status");
  }

  const now = new Date().toISOString();

  const assignment = {
    id: await getNextId(),
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : (description || ""),
    subject: subject.trim(),
    dueDate: typeof dueDate === "string" ? dueDate.trim() : dueDate,
    priority: priority || ASSIGNMENT_PRIORITY.MEDIUM,
    status: status || ASSIGNMENT_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  };

  const assignments = await readData();
  assignments.push(assignment);

  await writeData(assignments);

  return assignment;
}

// Update an existing assignment
async function updateAssignment(id, updates) {
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    throw new ApiError(400, "Invalid update data");
  }

  const assignments = await readData();

  const index = assignments.findIndex(
    (item) => item.id === Number(id)
  );

  if (index === -1) {
    throw new ApiError(404, "Assignment not found");
  }

  const allowedFields = [
    "title",
    "description",
    "subject",
    "dueDate",
    "priority",
    "status",
  ];

  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) =>
      allowedFields.includes(key)
    )
  );

  if (Object.keys(filteredUpdates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  if (filteredUpdates.title !== undefined) {
    if (typeof filteredUpdates.title !== "string" || !filteredUpdates.title.trim()) {
      throw new ApiError(400, "Title cannot be empty");
    }
    filteredUpdates.title = filteredUpdates.title.trim();
  }

  if (filteredUpdates.subject !== undefined) {
    if (typeof filteredUpdates.subject !== "string" || !filteredUpdates.subject.trim()) {
      throw new ApiError(400, "Subject cannot be empty");
    }
    filteredUpdates.subject = filteredUpdates.subject.trim();
  }

  if (filteredUpdates.description !== undefined) {
    filteredUpdates.description =
      typeof filteredUpdates.description === "string"
        ? filteredUpdates.description.trim()
        : filteredUpdates.description;
  }

  if (filteredUpdates.dueDate !== undefined) {
    if (
      !filteredUpdates.dueDate ||
      (typeof filteredUpdates.dueDate === "string" && !filteredUpdates.dueDate.trim()) ||
      isNaN(Date.parse(filteredUpdates.dueDate))
    ) {
      throw new ApiError(400, "Invalid due date format");
    }
    if (typeof filteredUpdates.dueDate === "string") {
      filteredUpdates.dueDate = filteredUpdates.dueDate.trim();
    }
  }

  if (
    filteredUpdates.priority !== undefined &&
    !Object.values(ASSIGNMENT_PRIORITY).includes(filteredUpdates.priority)
  ) {
    throw new ApiError(400, "Invalid assignment priority");
  }

  if (
    filteredUpdates.status !== undefined &&
    !Object.values(ASSIGNMENT_STATUS).includes(filteredUpdates.status)
  ) {
    throw new ApiError(400, "Invalid assignment status");
  }

  const updatedAssignment = {
    ...assignments[index],
    ...filteredUpdates,
    updatedAt: new Date().toISOString(),
  };

  assignments[index] = updatedAssignment;

  await writeData(assignments);

  return updatedAssignment;
}

// Delete an assignment
async function deleteAssignment(id) {
  const assignments = await readData();

  const index = assignments.findIndex(
    (item) => item.id === Number(id)
  );

  if (index === -1) {
    throw new ApiError(404, "Assignment not found");
  }

  const [deletedAssignment] = assignments.splice(index, 1);

  await writeData(assignments);

  return deletedAssignment;
}

module.exports = {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
