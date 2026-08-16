import mongoose from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const validId = (id, label) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}`); return id }

const toggleSubscription = asyncHandler(async (req, res) => {
    const channelId = validId(req.params.channelId, "channel id")
    if (channelId === req.user._id.toString()) throw new ApiError(400, "You cannot subscribe to your own channel")
    if (!await User.exists({ _id: channelId })) throw new ApiError(404, "Channel not found")
    const existing = await Subscription.findOne({ subscriber: req.user._id, channel: channelId })
    if (existing) { await existing.deleteOne(); return res.status(200).json(new ApiResponse(200, { subscribed: false }, "Channel unsubscribed successfully")) }
    await Subscription.create({ subscriber: req.user._id, channel: channelId })
    return res.status(201).json(new ApiResponse(201, { subscribed: true }, "Channel subscribed successfully"))
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const channelId = validId(req.params.channelId, "channel id")
    const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber", "fullName username avatar").sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, subscribers, "Channel subscribers fetched successfully"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = validId(req.params.subscriberId, "subscriber id")
    const channels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "fullName username avatar coverImage").sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"))
})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }
