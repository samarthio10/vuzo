import userRegister from '../controller/user.controller.js';
import { Router } from 'express';
import { upload } from '../middleware/multer.middleware.js';

const router = Router();

router.post(
  '/register',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  userRegister
);

export default router;
