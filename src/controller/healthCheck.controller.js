import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const healthCheckUp = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'ok', 'healthCheck successful'));
});

export default healthCheckUp;
