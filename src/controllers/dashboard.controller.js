import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const owner = req.user._id
    const [videoStats, subscribers, likes] = await Promise.all([
        Video.aggregate([{ $match: { owner } }, { $group: { _id: null, totalVideos: { $sum: 1 }, totalViews: { $sum: "$views" } } }]),
        Subscription.countDocuments({ channel: owner }),
        Like.aggregate([{ $lookup: { from: "videos", localField: "video", foreignField: "_id", as: "video" } }, { $unwind: "$video" }, { $match: { "video.owner": owner } }, { $count: "totalLikes" }])
    ])
    const stats = videoStats[0] || { totalVideos: 0, totalViews: 0 }
    return res.status(200).json(new ApiResponse(200, { totalVideos: stats.totalVideos, totalViews: stats.totalViews, totalSubscribers: subscribers, totalLikes: likes[0]?.totalLikes || 0 }, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({ owner: req.user._id }).sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export { getChannelStats, getChannelVideos }
