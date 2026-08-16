import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({
  path: './src/.env',
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (localFilepath) {
  try {
    if (!localFilepath) return null;

    const response = await cloudinary.uploader.upload(localFilepath, {
      resource_type: 'auto',
    });

    console.log('file uploaded on cloudinary', response.url);
    fs.unlinkSync(localFilepath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilepath);
    console.log('Cloudinary upload failed', error);
    return null;
  }
};

const deleteFromCloudinary = async function (fileUrl, resourceType = 'image') {
  if (!fileUrl) return null;

  try {
    const publicId = fileUrl.split('/').pop().split('.')[0];

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return response;
  } catch (error) {
    console.log('Cloudinary deletion failed', error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
