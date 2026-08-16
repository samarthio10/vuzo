import mongoose from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const validId = (id, label) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}`); return id }

const createTweet = asyncHandler(async (req, res) => {
    const content = req.body.content?.trim()
    if (!content) throw new ApiError(400, "Tweet content is required")
    const tweet = await Tweet.create({ content, owner: req.user._id })
    await tweet.populate("owner", "fullName username avatar")
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = validId(req.params.userId, "user id")
    if (!await User.exists({ _id: userId })) throw new ApiError(404, "User not found")
    const tweets = await Tweet.find({ owner: userId }).populate("owner", "fullName username avatar").sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const tweetId = validId(req.params.tweetId, "tweet id")
    const content = req.body.content?.trim()
    if (!content) throw new ApiError(400, "Tweet content is required")
    const tweet = await Tweet.findOneAndUpdate({ _id: tweetId, owner: req.user._id }, { $set: { content } }, { new: true }).populate("owner", "fullName username avatar")
    if (!tweet) throw new ApiError(404, "Tweet not found or you are not authorized")
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const tweetId = validId(req.params.tweetId, "tweet id")
    const tweet = await Tweet.findOneAndDelete({ _id: tweetId, owner: req.user._id })
    if (!tweet) throw new ApiError(404, "Tweet not found or you are not authorized")
    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"))
})

export { createTweet, getUserTweets, updateTweet, deleteTweet }
