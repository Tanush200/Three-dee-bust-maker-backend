const {createUploadthing} = require('uploadthing/express');
const { UploadThingError } = require('uploadthing/server')
const User = require('../models/User');
const File = require('../models/File');
const jwt = require('jsonwebtoken');

const f = createUploadthing();

const authenticateUser = async (req) =>{
   try {
    const authHeader = req.headers.authorization;
    if(!authHeader) return null;

    const token = authHeader.startsWith('Bearer')
    ? authHeader.substring(7)
    : authHeader

    if(!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    return user
   } catch (error) {
     console.error("Auth error in UploadThing:", error);
     return null;
   }
}

const uploadRouter = {
  profileImageUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await authenticateUser(req);

      if (!user) {
        throw new UploadThingError("Authentication required");
      }
      return {
        userId: user._id.toString(),
        uploadType: "profile-image",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Profile image upload complete");
      console.log("User ID:", metadata.userId);
      console.log("File URL:", file.ufsUrl);

      try {
        const fileRecord = await File.create({
          filename: file.name,
          originalName: file.name,
          uploadThingKey: file.key,
          uploadThingUrl: file.ufsUrl,
          fileType: "image",
          mimeType: file.type || "image/jpeg",
          size: file.size,
          userId: metadata.userId,
          metadata: {
            width: null,
            height: null,
            format: file.type?.split("/")[21] || "jpeg",
          },
        });
        await User.findByIdAndUpdate(metadata.userId, {
          avatar: file.ufsUrl,
        });
        console.log("✅ File record saved:", fileRecord._id);
        return {
          uploadedBy: metadata.userId,
          fileId: fileRecord._id.toString(),
          ufsUrl: file.ufsUrl,
        };
      } catch (error) {
        console.error("❌ Error saving file record:", error);
        throw new UploadThingError("Failed to save file record");
      }
    }),
  bustImageUploader:f({
    image:{
        maxFileSize:'10MB',
        maxFileCount:1,
    }
  }).middleware(async({req})=>{
    const user = await authenticateUser(req);
    if(!user){
        throw new UploadThingError("Authentication required");
    }
    if(user.credits <= 0){
     throw new UploadThingError("Insufficient credits for 3D generation");   
    }
    return {
      userId: user._id.toString(),
      uploadType: "bust-generation",
      userCredits: user.credits
    };
  }).onUploadComplete(async({metadata,file})=>{
    console.log("✅ Bust image upload complete");
    console.log("User ID:", metadata.userId);
    console.log("File URL:", file.ufsUrl);
    console.log("User Credits:", metadata.userCredits);

    try {
        const fileRecord = await File.create({
          filename: file.name,
          originalName: file.name,
          uploadThingKey: file.key,
          uploadThingUrl: file.ufsUrl,
          fileType: "image",
          mimeType: file.type || "image/jpeg",
          size: file.size,
          userId: metadata.userId,
          metadata: {
            width: null,
            height: null,
            format: file.type?.split("/")[21] || "jpeg",
          },
        });
        console.log("✅ Bust image file record saved:", fileRecord._id);
        return {
          uploadedBy: metadata.userId,
          fileId: fileRecord._id.toString(),
          ufsUrl: file.ufsUrl,
          message: "Image uploaded successfully. Ready for 3D generation!",
        };
    } catch (error) {
        console.error("❌ Error saving file record:", error);
        throw new UploadThingError("Failed to save file record");
    }
  }),
};

module.exports = {uploadRouter}