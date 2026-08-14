import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/apiResponse.js';

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
  const coverImage = coverImageLocalPathStorage
    ? await uploadOnCloudinary(coverImageLocalPathStorage)
    : null;

  if (!avatar) {
    throw new ApiError(500, 'Failed to upload avatar');
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registering the user');
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

export default userRegister;
