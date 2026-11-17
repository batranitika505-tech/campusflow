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

// Validate strict YYYY-MM-DD calendar date using Gregorian calendar rules
function isValidCalendarDate(dueDate) {
  if (typeof dueDate !== "string") {
    return false;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = dueDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) {
    return false;
  }

  const isLeapYear =
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  let maxDays = 31;
  if (month === 2) {
    maxDays = isLeapYear ? 29 : 28;
  } else if (month === 4 || month === 6 || month === 9 || month === 11) {
    maxDays = 30;
  }

  return day >= 1 && day <= maxDays;
}

// Helper to convert due date to calendar date string (YYYY-MM-DD)
function toCalendarDate(dueDate) {
  if (typeof dueDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(dueDate)) {
    return dueDate.slice(0, 10);
  }
  return dueDate;
}

// Helper to get calendar date string for a given date
function getTodayString(refDate = new Date()) {
  const d = new Date(refDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to get calendar date string 7 days after given date
function getUpcomingEndString(refDate = new Date()) {
  const d = new Date(refDate);
  d.setDate(d.getDate() + 7);
  return getTodayString(d);
}

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

  // Sort by due date ascending using calendar-date comparison, tie-break by ID
  assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id);

  const total = assignments.length;

  if (skip !== undefined && limit !== undefined) {
    assignments = assignments.slice(skip, skip + limit);
  }

  return {
    assignments,
    total,
  };
}

// Get upcoming assignments (due today through next 7 calendar days inclusive, not completed)
async function getUpcomingAssignments(refDate = new Date()) {
  const assignments = await readData();
  const todayStr = getTodayString(refDate);
  const endStr = getUpcomingEndString(refDate);

  const upcoming = assignments.filter((item) => {
    if (item.status === ASSIGNMENT_STATUS.COMPLETED) {
      return false;
    }
    const itemDate = toCalendarDate(item.dueDate);
    return itemDate && itemDate >= todayStr && itemDate <= endStr;
  });

  // Sort by nearest due date first using calendar-date comparison
  upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id);

  return upcoming;
}

// Get overdue assignments (due strictly before today, not completed)
async function getOverdueAssignments(refDate = new Date()) {
  const assignments = await readData();
  const todayStr = getTodayString(refDate);

  const overdue = assignments.filter((item) => {
    if (item.status === ASSIGNMENT_STATUS.COMPLETED) {
      return false;
    }
    const itemDate = toCalendarDate(item.dueDate);
    return itemDate && itemDate < todayStr;
  });

  // Sort oldest overdue date first using calendar-date comparison
  overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id);

  return overdue;
}

// Get assignment statistics
async function getAssignmentStats(refDate = new Date()) {
  const assignments = await readData();
  const todayStr = getTodayString(refDate);
  const endStr = getUpcomingEndString(refDate);

  const total = assignments.length;
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;
  let upcoming = 0;

  for (const item of assignments) {
    if (item.status === ASSIGNMENT_STATUS.PENDING) {
      pending++;
    } else if (item.status === ASSIGNMENT_STATUS.IN_PROGRESS) {
      inProgress++;
    } else if (item.status === ASSIGNMENT_STATUS.COMPLETED) {
      completed++;
    }

    if (item.status !== ASSIGNMENT_STATUS.COMPLETED) {
      const itemDate = toCalendarDate(item.dueDate);
      if (itemDate) {
        if (itemDate < todayStr) {
          overdue++;
        } else if (itemDate >= todayStr && itemDate <= endStr) {
          upcoming++;
        }
      }
    }
  }

  const completionPercentage =
    total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2));

  return {
    total,
    pending,
    inProgress,
    completed,
    overdue,
    upcoming,
    completionPercentage,
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

  if (typeof dueDate !== "string" || !isValidCalendarDate(dueDate)) {
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
    dueDate,
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
      typeof filteredUpdates.dueDate !== "string" ||
      !isValidCalendarDate(filteredUpdates.dueDate)
    ) {
      throw new ApiError(400, "Invalid due date format");
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
  getUpcomingAssignments,
  getOverdueAssignments,
  getAssignmentStats,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
