import { v2 as cloudinary } from "cloudinary"
import fs from "fs/promises"

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        })

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        await fs.unlink(localFilePath).catch(() => {})
        return response
    } catch (error) {
        if (localFilePath) await fs.unlink(localFilePath).catch(() => {})
        return null
    }
}

export { uploadOnCloudinary }
