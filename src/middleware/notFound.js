
const { ApiError } = require("express-api-toolkit");

function notFound(req, res, next) {
  next(
    ApiError.notFound(
      `Route not found: ${req.method} ${req.originalUrl}`
    )
  );
}

module.exports = notFound;
