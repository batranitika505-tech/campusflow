const {
  asyncHandler,
  successResponse,
  getPagination,
  paginateResponse,
} = require("express-api-toolkit");
const { PAGINATION } = require("../config/constants");
const assignmentService = require("../services/assignmentService");

// GET /api/assignments (with search, filtering, and pagination)
const getAllAssignments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, {
    defaultPage: PAGINATION.DEFAULT_PAGE,
    defaultLimit: PAGINATION.DEFAULT_LIMIT,
    maxLimit: PAGINATION.MAX_LIMIT,
  });

  const { assignments, total } = await assignmentService.getAllAssignments({
    search: req.query.search,
    status: req.query.status,
    priority: req.query.priority,
    subject: req.query.subject,
    skip,
    limit,
  });

  return paginateResponse(
    res,
    assignments,
    total,
    page,
    limit,
    "Assignments retrieved successfully"
  );
});

// GET /api/assignments/upcoming
const getUpcomingAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getUpcomingAssignments();
  return successResponse(
    res,
    assignments,
    "Upcoming assignments retrieved successfully"
  );
});

// GET /api/assignments/overdue
const getOverdueAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getOverdueAssignments();
  return successResponse(
    res,
    assignments,
    "Overdue assignments retrieved successfully"
  );
});

// GET /api/assignments/stats
const getAssignmentStats = asyncHandler(async (req, res) => {
  const stats = await assignmentService.getAssignmentStats();
  return successResponse(
    res,
    stats,
    "Assignment statistics retrieved successfully"
  );
});

// GET /api/assignments/:id
const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.getAssignmentById(req.params.id);
  return successResponse(res, assignment, "Assignment retrieved successfully");
});

// POST /api/assignments
const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.createAssignment(req.body);
  return successResponse(res, assignment, "Assignment created successfully", 201);
});

// PATCH /api/assignments/:id
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.updateAssignment(
    req.params.id,
    req.body
  );
  return successResponse(res, assignment, "Assignment updated successfully");
});

// DELETE /api/assignments/:id
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.deleteAssignment(req.params.id);
  return successResponse(res, assignment, "Assignment deleted successfully");
});

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
