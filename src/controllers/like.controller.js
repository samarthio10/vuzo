import mongoose from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggle = async (id, field, Model, userId) => {
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${field} id`)
    if (!await Model.exists({ _id: id })) throw new ApiError(404, `${field[0].toUpperCase() + field.slice(1)} not found`)
    const filter = { [field]: id, likedBy: userId }
    const existing = await Like.findOne(filter)
    if (existing) { await existing.deleteOne(); return false }
    await Like.create(filter)
    return true
}

const responseFor = (field, Model) => asyncHandler(async (req, res) => {
    const id = req.params[`${field}Id`]
    const liked = await toggle(id, field, Model, req.user._id)
    return res.status(200).json(new ApiResponse(200, { liked }, liked ? `${field} liked successfully` : `${field} unliked successfully`))
})

const toggleVideoLike = responseFor("video", Video)
const toggleCommentLike = responseFor("comment", Comment)
const toggleTweetLike = responseFor("tweet", Tweet)

const getLikedVideos = asyncHandler(async (req, res) => {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100)
    const [likes, total] = await Promise.all([
        Like.find({ likedBy: req.user._id, video: { $exists: true, $ne: null } }).populate({ path: "video", populate: { path: "owner", select: "fullName username avatar" } }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Like.countDocuments({ likedBy: req.user._id, video: { $exists: true, $ne: null } })
    ])
    const videos = likes.map(({ video }) => video).filter(Boolean)
    return res.status(200).json(new ApiResponse(200, { videos, page, limit, total, totalPages: Math.ceil(total / limit) }, "Liked videos fetched successfully"))
})

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos }
