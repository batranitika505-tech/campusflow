const express = require("express");
const path = require("node:path");

const {
  requestId,
  requestLogger,
  errorHandler,
} = require("express-api-toolkit");

const notFound = require("./middleware/notFound");
const assignmentRoutes = require("./routes/assignmentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");

const app = express();

// Request processing middleware
app.use(requestId());
app.use(requestLogger());

// Parse incoming JSON
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../public")));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CampusFlow API is running",
    requestId: req.requestId,
  });
});

// API routes
app.use("/api/assignments", assignmentRoutes);
app.use("/api/subjects", subjectRoutes);

// 404 handling
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
