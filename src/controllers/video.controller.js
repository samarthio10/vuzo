import mongoose from "mongoose"
import fs from "fs/promises"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const validId = (id, label) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}`); return id }
const paging = query => ({ page: Math.max(Number.parseInt(query.page, 10) || 1, 1), limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100) })

const getAllVideos = asyncHandler(async (req, res) => {
    const { page, limit } = paging(req.query)
    const filter = { isPublished: true }
    if (req.query.userId) filter.owner = validId(req.query.userId, "user id")
    if (req.query.query?.trim()) filter.$or = [{ title: { $regex: req.query.query.trim(), $options: "i" } }, { description: { $regex: req.query.query.trim(), $options: "i" } }]
    const sortFields = new Set(["createdAt", "updatedAt", "views", "title"])
    const sortBy = sortFields.has(req.query.sortBy) ? req.query.sortBy : "createdAt"
    const sort = { [sortBy]: req.query.sortType === "asc" ? 1 : -1 }
    const [videos, total] = await Promise.all([
        Video.find(filter).populate("owner", "fullName username avatar").sort(sort).skip((page - 1) * limit).limit(limit),
        Video.countDocuments(filter)
    ])
    return res.status(200).json(new ApiResponse(200, { videos, page, limit, total, totalPages: Math.ceil(total / limit) }, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const title = req.body.title?.trim(), description = req.body.description?.trim()
    const videoPath = req.files?.videoFile?.[0]?.path, thumbnailPath = req.files?.thumbnail?.[0]?.path

    const cleanupTempFiles = () => Promise.all(
        [videoPath, thumbnailPath].filter(Boolean).map(p => fs.unlink(p).catch(() => {}))
    )

    if (!title || !description) {
        await cleanupTempFiles()
        throw new ApiError(400, "Title and description are required")
    }
    if (!videoPath || !thumbnailPath) {
        await cleanupTempFiles()
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    const [videoUpload, thumbnailUpload] = await Promise.all([uploadOnCloudinary(videoPath), uploadOnCloudinary(thumbnailPath)])
    if (!videoUpload?.url || !thumbnailUpload?.url) throw new ApiError(500, "Unable to upload video assets")
    const duration = Number(videoUpload.duration)
    if (!Number.isFinite(duration)) throw new ApiError(500, "Video duration could not be determined")
    const video = await Video.create({ title, description, videoFile: videoUpload.url, thumbnail: thumbnailUpload.url, duration, owner: req.user._id })
    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const videoId = validId(req.params.videoId, "video id")
    const video = await Video.findById(videoId).populate("owner", "fullName username avatar")
    if (!video || (!video.isPublished && video.owner._id.toString() !== req.user._id.toString())) throw new ApiError(404, "Video not found")
    video.views += 1
    await video.save()
    await User.findByIdAndUpdate(req.user._id, { $pull: { watchHistory: videoId } })
    await User.findByIdAndUpdate(req.user._id, { $push: { watchHistory: { $each: [videoId], $position: 0, $slice: 100 } } })
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const videoId = validId(req.params.videoId, "video id")
    const updates = {}
    if (req.body.title !== undefined) { const title = req.body.title?.trim(); if (!title) throw new ApiError(400, "Title cannot be empty"); updates.title = title }
    if (req.body.description !== undefined) { const description = req.body.description?.trim(); if (!description) throw new ApiError(400, "Description cannot be empty"); updates.description = description }
    if (req.file?.path) { const upload = await uploadOnCloudinary(req.file.path); if (!upload?.url) throw new ApiError(500, "Unable to upload thumbnail"); updates.thumbnail = upload.url }
    if (!Object.keys(updates).length) throw new ApiError(400, "Provide video details or a thumbnail to update")
    const video = await Video.findOneAndUpdate({ _id: videoId, owner: req.user._id }, { $set: updates }, { new: true })
    if (!video) throw new ApiError(404, "Video not found or you are not authorized")
    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const video = await Video.findOneAndDelete({ _id: validId(req.params.videoId, "video id"), owner: req.user._id })
    if (!video) throw new ApiError(404, "Video not found or you are not authorized")
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const video = await Video.findOne({ _id: validId(req.params.videoId, "video id"), owner: req.user._id })
    if (!video) throw new ApiError(404, "Video not found or you are not authorized")
    video.isPublished = !video.isPublished
    await video.save()
    return res.status(200).json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`))
})

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus }
