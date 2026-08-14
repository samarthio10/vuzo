import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: 'edxlalwu',
  api_key: '271345757761358',
  api_secret: 'Yd2YzZ-gHA9OMt6b79Aoj-k5Hyg',
});

const uploadOnCloudinary = async function (localFilepath) {
  try {
    if (!localFilepath) return null;
    const response = await cloudinary.uploader.upload(localFilepath, {
      resource_type: 'auto',
    });
    console.log('files uploaded on cloudinary', response.url);
    fs.unlinkSync(localFilepath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilepath);
    return null;
  }
};
export default uploadOnCloudinary;
