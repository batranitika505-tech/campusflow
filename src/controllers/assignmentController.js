const { asyncHandler, successResponse } = require("express-api-toolkit");
const assignmentService = require("../services/assignmentService");

// GET /api/assignments
const getAllAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getAllAssignments();
  return successResponse(res, assignments, "Assignments retrieved successfully");
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
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
