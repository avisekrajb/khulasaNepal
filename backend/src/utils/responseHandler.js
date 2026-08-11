/**
 * Standard success response format
 */
const successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    data
  };

  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 */
const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};