import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const objectId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}`)
    return new mongoose.Types.ObjectId(id)
}

const getVideoComments = asyncHandler(async (req, res) => {
    const videoId = objectId(req.params.videoId, "video id")
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100)
    const [comments, total] = await Promise.all([
        Comment.find({ video: videoId }).populate("owner", "fullName username avatar").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Comment.countDocuments({ video: videoId })
    ])
    return res.status(200).json(new ApiResponse(200, { comments, page, limit, total, totalPages: Math.ceil(total / limit) }, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    const videoId = objectId(req.params.videoId, "video id")
    const content = req.body.content?.trim()
    if (!content) throw new ApiError(400, "Comment content is required")
    if (!await Video.exists({ _id: videoId })) throw new ApiError(404, "Video not found")
    const comment = await Comment.create({ content, video: videoId, owner: req.user._id })
    await comment.populate("owner", "fullName username avatar")
    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const commentId = objectId(req.params.commentId, "comment id")
    const content = req.body.content?.trim()
    if (!content) throw new ApiError(400, "Comment content is required")
    const comment = await Comment.findOneAndUpdate({ _id: commentId, owner: req.user._id }, { $set: { content } }, { new: true }).populate("owner", "fullName username avatar")
    if (!comment) throw new ApiError(404, "Comment not found or you are not authorized")
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const commentId = objectId(req.params.commentId, "comment id")
    const comment = await Comment.findOneAndDelete({ _id: commentId, owner: req.user._id })
    if (!comment) throw new ApiError(404, "Comment not found or you are not authorized")
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export { getVideoComments, addComment, updateComment, deleteComment }
