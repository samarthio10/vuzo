import {
  accessTokenRefresh,
  chngePassword,
  getCurrentUser,
  updateAccDetails,
  updateAvatarImage,
  updateCoverImage,
  userLogout,
  userRegister,
  publishAVideo,
  deleteVideo,
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

router.route('/current-user').get(jwtVerify, getCurrentUser);
router.route('/change-password').post(jwtVerify, chngePassword);
router.route('/update-user').post(jwtVerify, updateAccDetails);
router
  .route('/update-avatar')
  .post(jwtVerify, upload.single('avatar'), updateAvatarImage);
router
  .route('/update-coverImage')
  .post(jwtVerify, upload.single('coverImage'), updateCoverImage);

router
  .route('/video')
  .post(
    jwtVerify,
    upload.fields([
      { name: 'videoFile', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
    publishAVideo
  );

router.route('/video/:videoId').delete(jwtVerify, deleteVideo);

export default router;
