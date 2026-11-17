const express = require("express");
const { validateRequest } = require("express-api-toolkit");
const { ASSIGNMENT_STATUS, ASSIGNMENT_PRIORITY, PAGINATION } = require("../config/constants");
const assignmentController = require("../controllers/assignmentController");

const router = express.Router();

const validateQuery = validateRequest({
  query: (query) => {
    const errors = [];

    if (query.search !== undefined) {
      if (typeof query.search !== "string" || query.search.trim() === "") {
        errors.push("Search query cannot be empty");
      }
    }

    if (query.status !== undefined) {
      if (!Object.values(ASSIGNMENT_STATUS).includes(query.status)) {
        errors.push("Invalid status filter");
      }
    }

    if (query.priority !== undefined) {
      if (!Object.values(ASSIGNMENT_PRIORITY).includes(query.priority)) {
        errors.push("Invalid priority filter");
      }
    }

    if (query.subject !== undefined) {
      if (typeof query.subject !== "string" || query.subject.trim() === "") {
        errors.push("Subject query cannot be empty");
      }
    }

    if (query.page !== undefined) {
      const pageNum = Number(query.page);
      if (isNaN(pageNum) || !Number.isInteger(pageNum) || pageNum < 1) {
        errors.push("Page must be a positive integer");
      }
    }

    if (query.limit !== undefined) {
      const limitNum = Number(query.limit);
      if (
        isNaN(limitNum) ||
        !Number.isInteger(limitNum) ||
        limitNum < 1 ||
        limitNum > PAGINATION.MAX_LIMIT
      ) {
        errors.push(`Limit must be an integer between 1 and ${PAGINATION.MAX_LIMIT}`);
      }
    }

    if (errors.length > 0) {
      return { error: errors };
    }

    return null;
  },
});

router.get("/", validateQuery, assignmentController.getAllAssignments);
router.get("/:id", assignmentController.getAssignmentById);
router.post("/", assignmentController.createAssignment);
router.patch("/:id", assignmentController.updateAssignment);
router.delete("/:id", assignmentController.deleteAssignment);

module.exports = router;
