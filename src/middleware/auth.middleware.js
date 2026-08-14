import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';

const jwtVerify = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header('authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'unauthorized request');
  }

  const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decodeToken?._id).select(
    '-password -refreshToken'
  );

  if (!user) {
    throw new ApiError(401, 'Invalid access token');
  }

  req.user = user;
  next();
});

export default jwtVerify;
