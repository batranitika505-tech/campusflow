const express = require("express");
const assignmentController = require("../controllers/assignmentController");

const router = express.Router();

router.get("/", assignmentController.getAllAssignments);
router.get("/:id", assignmentController.getAssignmentById);
router.post("/", assignmentController.createAssignment);
router.patch("/:id", assignmentController.updateAssignment);
router.delete("/:id", assignmentController.deleteAssignment);

module.exports = router;
