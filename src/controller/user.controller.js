import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/apiResponse.js';

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
export { userRegister, userLogin, userLogout };
