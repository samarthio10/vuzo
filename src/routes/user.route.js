import {
  accessTokenRefresh,
  updateAccDetails,
  updateAvatarImage,
  updateCoverImage,
  userLogout,
  userRegister,
} from '../controller/user.controller.js';
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

router.route('/refreshToken').post(accessTokenRefresh);

router.route('/update-user').post(updateAccDetails);
router.route('/update-avatar').post(updateAvatarImage);
router.route('/update-coverImage').post(updateCoverImage);

export default router;
