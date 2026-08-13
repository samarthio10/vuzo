import { v2 as cloudinary } from 'cloudinary';
import { ALL } from 'dns';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadOnCloudinary = async function (localFilepath) {
  try {
    if (!localFilepath) return null;
    const response = await cloudinary.uploader.upload(localFilepath, {
      resource_type: 'auto',
    });
    console.log('files uploaded on cloudinary', response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilepath);
    return null;
  }
};
export default uploadOnCloudinary;
