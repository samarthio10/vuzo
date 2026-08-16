import jwt from 'jsonwebtoken'; // ADDED — needed for jwt.verify() below
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import ApiResponse from '../utils/apiResponse.js';
import { validate } from 'uuid';
import { upload } from '../middleware/multer.middleware.js';
import { Video } from '../models/video.model.js';

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'something went wrong while generating refresh and access token'
    );
  }
};

const userRegister = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body;

  if (
    [username, fullname, email, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, 'User with this username or email already exists');
  }

  const avatarLocalPathStorage = req.files?.avatar?.[0]?.path;
  const coverImageLocalPathStorage = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPathStorage) {
    throw new ApiError(400, 'Avatar is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPathStorage);
  const coverImage = await uploadOnCloudinary(coverImageLocalPathStorage);

  if (!avatar) {
    throw new ApiError(500, 'Failed to upload avatar');
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullname: fullname,
    email: email,
    password: password,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
  });

  const createdUser = await User.findById(user._id).select('-password');

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registering the user');
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

const userLogin = asyncHandler(async (req, res) => {
  const { username, email, password, fullname } = req.body;

  if (!username && !email) {
    throw new ApiError(400, 'username or email should be entered');
  }

  if (!password || password?.trim() === '') {
    throw new ApiError(400, 'password is required');
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!existedUser) {
    throw new ApiError(404, 'user does not exist');
  }

  const isPasswordValid = await existedUser.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existedUser._id
  );

  const loggedInUser = await User.findById(existedUser._id).select('-password');

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, refreshToken, accessToken },
        'user logged in successfully'
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );
  const methods = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie('accessToken', methods)
    .clearCookie('refreshToken', methods)
    .json(new ApiResponse(200, {}, 'logout successful'));
});

const accessTokenRefresh = asyncHandler(async (req, res) => {
  // FIXED — req.cookie → req.cookies (was undefined, crashed on .refreshToken)
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'unauthorized refresh');
  }

  try {
    // FIXED — jwtVerify (undefined, was your middleware's name) → jwt.verify
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodeToken._id);
    if (!user) {
      throw new ApiError(404, 'invalid refreshToken');
    }

    if (incomingRefreshToken != user?.refreshToken) {
      throw new ApiError(401, 'refresh token is expired or used');
    }

    const methods = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    res
      .status(200)
      .cookie('accessToken', accessToken, methods)
      .cookie('refreshToken', refreshToken, methods)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          'access token refreshed successfully'
        )
      );
  } catch (error) {
    // FIXED — err (undefined) → error (the actual caught variable)
    throw new ApiError(401, error?.message || 'invalid refresh token');
  }
});

const chngePassword = asyncHandler(async (req, res) => {
  const { newPassword, oldPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordtrue = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordtrue) {
    throw new ApiError(401, 'invalid old password');
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, {}, 'password changed'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, 'user successfully fetched'));
});

const updateAccDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(401, 'invalid credential');
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname, email } },
    { new: true }
  ).select('-password');
  res.status(200).json(new ApiResponse(200, user, 'account details updated'));
});

const updateAvatarImage = asyncHandler(async (req, res) => {
  const avatarLocalpath = req.file?.path;
  if (!avatarLocalpath) {
    throw new ApiError(401, 'avatar file is missing');
  }
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  if (!avatar.url) {
    throw new ApiError(401, 'error while uploading avatar');
  }
  // FIXED — was missing `await`, and `{ new: true }.select(...)` was calling
  // .select() on the plain options object instead of chaining it on the query
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select('-password');
  res
    .status(200)
    .json(new ApiResponse(200, user, 'user  avatar updated successfully'));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(401, 'coverImage file is missing');
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(401, 'error while uploading coverImage');
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select('-password');
  res
    .status(200)
    .json(new ApiResponse(200, user, 'user  coverimage updated successfully'));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, 'title and description are required');
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, 'videoFile is missing');
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, 'thumbnail is required');
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile?.url) {
    throw new ApiError(500, 'error uploading videoFile on cloudinary');
  }
  if (!thumbnail?.url) {
    throw new ApiError(500, 'error uploading thumbnail on cloudinary');
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, 'video uploaded successfully'));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, 'invalid videoId');
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, 'video not found');
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'you are not allowed to delete this video');
  }

  await deleteFromCloudinary(video.videoFile, 'video');
  await deleteFromCloudinary(video.thumbnail, 'image');

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'video deleted successfully'));
});

export {
  userRegister,
  userLogin,
  userLogout,
  accessTokenRefresh,
  updateAccDetails,
  updateAvatarImage,
  updateCoverImage,
  publishAVideo,
  deleteVideo,
};
