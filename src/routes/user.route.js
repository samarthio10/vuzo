import { userLogout, userRegister } from '../controller/user.controller.js';
import { userLogin } from '../controller/user.controller.js';
import { Router } from 'express';
import { upload } from '../middleware/multer.middleware.js';
import jwtVerify from '../middleware/auth.middleware.js';

const router = Router();

router.post(
  '/register',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  userRegister
);

router.route('/login').post(userLogin);

router.route('/logout').post(jwtVerify, userLogout);

export default router;
