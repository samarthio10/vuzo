import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const validId = (id, label) => { if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}`); return id }
const ownedPlaylist = async (id, owner) => {
    const playlist = await Playlist.findOne({ _id: validId(id, "playlist id"), owner })
    if (!playlist) throw new ApiError(404, "Playlist not found or you are not authorized")
    return playlist
}

const createPlaylist = asyncHandler(async (req, res) => {
    const name = req.body.name?.trim(), description = req.body.description?.trim()
    if (!name || !description) throw new ApiError(400, "Name and description are required")
    const playlist = await Playlist.create({ name, description, owner: req.user._id })
    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = validId(req.params.userId, "user id")
    const playlists = await Playlist.find({ owner: userId }).populate("owner", "fullName username avatar").sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const playlist = await Playlist.findById(validId(req.params.playlistId, "playlist id")).populate("owner", "fullName username avatar").populate({ path: "videos", populate: { path: "owner", select: "fullName username avatar" } })
    if (!playlist) throw new ApiError(404, "Playlist not found")
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const playlist = await ownedPlaylist(req.params.playlistId, req.user._id)
    const videoId = validId(req.params.videoId, "video id")
    if (!await Video.exists({ _id: videoId })) throw new ApiError(404, "Video not found")
    if (!playlist.videos.some(id => id.equals(videoId))) { playlist.videos.push(videoId); await playlist.save() }
    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const playlist = await ownedPlaylist(req.params.playlistId, req.user._id)
    const videoId = validId(req.params.videoId, "video id")
    const originalLength = playlist.videos.length
    playlist.videos = playlist.videos.filter(id => !id.equals(videoId))
    if (playlist.videos.length === originalLength) throw new ApiError(404, "Video is not in this playlist")
    await playlist.save()
    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const playlist = await Playlist.findOneAndDelete({ _id: validId(req.params.playlistId, "playlist id"), owner: req.user._id })
    if (!playlist) throw new ApiError(404, "Playlist not found or you are not authorized")
    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const updates = {}
    if (req.body.name !== undefined) { const name = req.body.name?.trim(); if (!name) throw new ApiError(400, "Playlist name cannot be empty"); updates.name = name }
    if (req.body.description !== undefined) { const description = req.body.description?.trim(); if (!description) throw new ApiError(400, "Playlist description cannot be empty"); updates.description = description }
    if (!Object.keys(updates).length) throw new ApiError(400, "Provide a name or description to update")
    const playlist = await Playlist.findOneAndUpdate({ _id: validId(req.params.playlistId, "playlist id"), owner: req.user._id }, { $set: updates }, { new: true })
    if (!playlist) throw new ApiError(404, "Playlist not found or you are not authorized")
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export { createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist }
