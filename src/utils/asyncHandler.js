import fs from 'fs';

const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
    try {
      await requestHandler(req, res, next);
    } catch (error) {
      const uploadedFiles = [
        ...(req.file ? [req.file] : []),
        ...Object.values(req.files || {}).flat(),
      ];

      uploadedFiles.forEach((file) => {
        if (file?.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      res.status(error.statusCode || 500).json({
        message: error.message,
        success: false,
      });
    }
  };
};
export default asyncHandler;
