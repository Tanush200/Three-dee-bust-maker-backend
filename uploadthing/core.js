// const {createUploadthing} = require('uploadthing/server');
// const { UploadThingError } = require('uploadthing/server')
// const User = require('../models/User');
// const File = require('../models/File');
// const jwt = require('jsonwebtoken');
// const f = createUploadthing();

// const authenticateUser = async (req) =>{
//    try {
//     const authHeader = req.headers.authorization;
//     if(!authHeader) return null;

//     const token = authHeader.startsWith('Bearer ')
//     ? authHeader.substring(7)
//     : authHeader

//     if(!token) return null;

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select('-password');

//     return user
//    } catch (error) {
//      console.error("Auth error in UploadThing:", error);
//      return null;
//    }
// }

// const uploadRouter = {
//   profileImageUploader: f({
//     image: {
//       maxFileSize: "2MB",
//       maxFileCount: 1,
//     },
//   })
//     .middleware(async ({ req }) => {
//       const user = await authenticateUser(req);

//       if (!user) {
//         throw new UploadThingError("Authentication required");
//       }
//       return {
//         userId: user._id.toString(),
//         uploadType: "profile-image",
//       };
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       console.log("✅ Profile image upload complete");
//       console.log("User ID:", metadata.userId);
//       console.log("File URL:", file.url);

//       try {
//         const fileUrl = file.url || `https://utfs.io/f/${file.key}`;
//         const fileRecord = await File.create({
//           filename: file.name,
//           originalName: file.name,
//           uploadThingKey: file.key,
//           uploadThingUrl: fileUrl,
//           fileType: "image",
//           mimeType: file.type || "image/jpeg",
//           size: file.size,
//           userId: metadata.userId,
//           metadata: {
//             width: null,
//             height: null,
//             format: file.type?.split("/")[1] || "jpeg",
//             uploadMethod:'uploadthing'
//           },
//         });
//         await User.findByIdAndUpdate(metadata.userId, {
//           avatar: fileUrl,
//         });
//         console.log("✅ File record saved:", fileRecord._id);
//         return {
//           uploadedBy: metadata.userId,
//           fileId: fileRecord._id.toString(),
//           url: file.url,
//         };
//       } catch (error) {
//         console.error("❌ Error saving file record:", error);
//         throw new UploadThingError("Failed to save file record");
//       }
//     }),
//   bustImageUploader: f({
//     image: {
//       maxFileSize: "10MB",
//       maxFileCount: 1,
//     },
//   })
//     .middleware(async ({ req }) => {
//       const user = await authenticateUser(req);
//       if (!user) {
//         throw new UploadThingError("Authentication required");
//       }
//       if (user.credits <= 0) {
//         throw new UploadThingError("Insufficient credits for 3D generation");
//       }
//       return {
//         userId: user._id.toString(),
//         uploadType: "bust-generation",
//         userCredits: user.credits,
//       };
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       console.log("✅ Bust image upload complete");
//       console.log("User ID:", metadata.userId);
//       console.log("File URL:", file.url);
//       console.log("User Credits:", metadata.userCredits);

//       try {
//         const fileUrl = file.url || `https://utfs.io/f/${file.key}`;
//         const fileRecord = await File.create({
//           filename: file.name,
//           originalName: file.name,
//           uploadThingKey: file.key,
//           uploadThingUrl: fileUrl,
//           fileType: "image",
//           mimeType: file.type || "image/jpeg",
//           size: file.size,
//           userId: metadata.userId,
//           metadata: {
//             width: null,
//             height: null,
//             format: file.type?.split("/")[1] || "jpeg",
//             uploadMethod: "uploadthing",
//           },
//         });
//         console.log("✅ Bust image file record saved:", fileRecord._id);
//         return {
//           uploadedBy: metadata.userId,
//           fileId: fileRecord._id.toString(),
//           url: fileUrl,
//           message: "Image uploaded successfully. Ready for 3D generation!",
//         };
//       } catch (error) {
//         console.error("❌ Error saving file record:", error);
//         throw new UploadThingError("Failed to save file record");
//       }
//     }),
// };

// module.exports = {uploadRouter}




const { createUploadthing } = require("uploadthing/server");
const { UploadThingError } = require("uploadthing/server");
const User = require("../models/User");
const File = require("../models/File");
const jwt = require("jsonwebtoken");

const f = createUploadthing();

const authenticateUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    return user;
  } catch (error) {
    console.error("Auth error in UploadThing:", error);
    return null;
  }
};

const uploadRouter = {
  profileImageUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      console.log("🔍 Profile uploader middleware called");
      const user = await authenticateUser(req);

      if (!user) {
        console.log("❌ Profile uploader: Authentication failed");
        throw new UploadThingError("Authentication required");
      }

      console.log("✅ Profile uploader authenticated:", user.username);
      return {
        userId: user._id.toString(),
        uploadType: "profile-image",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Profile image upload complete");
      console.log("User ID:", metadata.userId);
      console.log("File object:", file);
      console.log("Available properties:", Object.keys(file));

      try {
        // FIXED: More robust URL handling for V7
        const fileUrl = file.url || `https://utfs.io/f/${file.key}`;

        const fileRecord = await File.create({
          filename: file.name,
          originalName: file.name,
          uploadThingKey: file.key,
          uploadThingUrl: fileUrl,
          fileType: "image",
          mimeType: file.type || "image/jpeg",
          size: file.size,
          userId: metadata.userId,
          metadata: {
            width: null,
            height: null,
            format: file.type?.split("/")[1] || "jpeg",
            uploadMethod: "uploadthing",
          },
        });

        // Update user avatar
        await User.findByIdAndUpdate(metadata.userId, {
          avatar: fileUrl,
        });

        console.log("✅ Profile file record saved:", fileRecord._id);
        console.log("🌐 Profile image URL:", fileUrl);

        // FIXED: Consistent return object
        return {
          uploadedBy: metadata.userId,
          fileId: fileRecord._id.toString(),
          url: fileUrl, // Use the constructed URL
          key: file.key,
          success: true,
        };
      } catch (error) {
        console.error("❌ Error saving profile file record:", error);
        throw new UploadThingError(
          "Failed to save file record: " + error.message
        );
      }
    }),

  bustImageUploader: f({
    image: {
      maxFileSize: "10MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      console.log("🔍 Bust uploader middleware called");
      const user = await authenticateUser(req);

      if (!user) {
        console.log("❌ Bust uploader: Authentication failed");
        throw new UploadThingError("Authentication required");
      }

      if (user.credits <= 0) {
        console.log("❌ Bust uploader: Insufficient credits");
        throw new UploadThingError("Insufficient credits for 3D generation");
      }

      console.log(
        "✅ Bust uploader authenticated:",
        user.username,
        "Credits:",
        user.credits
      );
      return {
        userId: user._id.toString(),
        uploadType: "bust-generation",
        userCredits: user.credits,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Bust image upload complete to UploadThing!");
      console.log("User ID:", metadata.userId);
      console.log("File object:", file);
      console.log("Available properties:", Object.keys(file));
      console.log("User Credits:", metadata.userCredits);

      try {
        // FIXED: More robust URL handling for V7
        const fileUrl = file.url || `https://utfs.io/f/${file.key}`;

        const fileRecord = await File.create({
          filename: file.name,
          originalName: file.name,
          uploadThingKey: file.key,
          uploadThingUrl: fileUrl,
          fileType: "image",
          mimeType: file.type || "image/jpeg",
          size: file.size,
          userId: metadata.userId,
          metadata: {
            width: null,
            height: null,
            format: file.type?.split("/")[1] || "jpeg",
            uploadMethod: "uploadthing",
          },
        });

        console.log(
          "✅ Bust image file record saved to database:",
          fileRecord._id
        );
        console.log("🌐 Bust image available at:", fileUrl);

        // FIXED: Consistent return object
        return {
          uploadedBy: metadata.userId,
          fileId: fileRecord._id.toString(),
          url: fileUrl, // Use the constructed URL
          key: file.key,
          message: "Image uploaded successfully to UploadThing cloud!",
          success: true,
        };
      } catch (error) {
        console.error("❌ Error saving bust file record:", error);
        throw new UploadThingError(
          "Failed to save file record: " + error.message
        );
      }
    }),
};

module.exports = { uploadRouter };