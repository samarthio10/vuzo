const asyncHandler = (requestHandler) => async (req, res, next) => {
  try {
    await requestHandler(req, res, next);
  } catch (error) {
    res.status(error.statuscode || 500).json({
      message: error.mesaage,
      success: false,
    });
  }
};
export default asyncHandler;
