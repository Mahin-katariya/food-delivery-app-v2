// Server par file aachuki hai and ab ussey any cloud service(cloudinary) mai bhejkar server se remove krdege

// in production grade settings we take the files on our own servers temporarily, and then send it to the cloud for performing re uploads if any problem arises during the users time of uploading. and then remove the files once transfered to the cloud from the local server.

import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // file has been uploaded successfully;
        console.log("File uploaded successfully on cloudinary",response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }catch(error){
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation failed.
        return null;
    }
}

export {
    uploadOnCloudinary
}