import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/ayncHandler.js';

const healthCheckUp = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'ok', 'healthCheck successful'));
});

export default healthCheckUp;
