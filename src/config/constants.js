
const ASSIGNMENT_STATUS = Object.freeze({
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
});

const ASSIGNMENT_PRIORITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 5,
  MAX_LIMIT: 50,
});

module.exports = {
  ASSIGNMENT_STATUS,
  ASSIGNMENT_PRIORITY,
  PAGINATION,
};
