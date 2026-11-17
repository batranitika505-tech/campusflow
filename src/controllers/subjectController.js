const { asyncHandler, successResponse } = require("express-api-toolkit");
const subjectService = require("../services/subjectService");

// GET /api/subjects
const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await subjectService.getAllSubjects();
  return successResponse(res, subjects, "Subjects retrieved successfully");
});

module.exports = {
  getAllSubjects,
};
