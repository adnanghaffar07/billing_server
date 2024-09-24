class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  // Default status code and error message for unhandled errors
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || "Something went wrong.";

  // Check if the error is operational (custom error) or a programming error
  if (!err.isOperational) {
    console.error("Non-operational error occurred:", err);
    // Log the error here using your preferred logging library (e.g., Winston, Bunyan, etc.)
    // You can also use different status code and error message for non-operational errors if needed
    statusCode = 500;
    errorMessage = "Internal server error.";
  }

  res.status(statusCode).json({
    status: "error",
    message: errorMessage,
  });
}

module.exports = {
  AppError,
  errorHandler,
};

// Your other middleware and route handlers

// Example route that throws a custom error
// app.get('/example-route', (req, res, next) => {
//   try {
//     // Simulate some MongoDB operation that results in an error
//     throw new CustomError('Custom error message', 404);
//   } catch (err) {
//     next(err);
//   }
// });



// const CustomError = require('./CustomError');

// function errorHandler(err, req, res, next) {
//   // Handle Mongoose validation errors
//   if (err.name === 'ValidationError') {
//     const errors = {};
//     for (let field in err.errors) {
//       errors[field] = err.errors[field].message;
//     }
//     return res.status(422).json({ error: 'Validation failed', errors });
//   }

//   // Handle Mongoose CastError (e.g., invalid ObjectId)
//   if (err.name === 'CastError' && err.kind === 'ObjectId') {
//     return res.status(400).json({ error: 'Invalid ID' });
//   }

//   // Handle other Mongoose errors
//   if (err.name === 'MongoError') {
//     return res.status(500).json({ error: 'Database error' });
//   }

//   // Handle custom errors
//   if (err instanceof CustomError) {
//     return res.status(err.status).json({ error: err.message });
//   }

//   // Handle other unexpected errors
//   console.error(err);
//   return res.status(500).json({ error: 'Something went wrong' });
// }

// module.exports = errorHandler;





// const CustomError = require('./CustomError');

// app.get('/example', (req, res, next) => {
//   try {
//     // Some MongoDB operation that might throw an error
//     // For example:
//     if (!validCondition) {
//       throw new CustomError(400, 'Invalid condition');
//     }

//     // Handle the successful response
//     res.json({ message: 'Success' });
//   } catch (err) {
//     // Pass the error to the next middleware (error handling middleware)
//     return next(err);
//   }
// });
