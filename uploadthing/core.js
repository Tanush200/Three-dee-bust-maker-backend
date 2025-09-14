
// Add this to your backend/uploadthing/core.js at the top:
console.log('🔍 UploadThing version check:');
try {
  const pkg = require('uploadthing/package.json');
  console.log('UploadThing version:', pkg.version);
} catch (e) {
  console.log('Could not determine UploadThing version');
}

// Also add this to see what createRouteHandler returns:
const routeHandler = createRouteHandler({
  router: uploadRouter,
});

console.log('🔍 Route handler type:', typeof routeHandler);
console.log('🔍 Route handler properties:', Object.keys(routeHandler));

////////////////////////////////////////////////



// const { createUploadthing } = require("uploadthing/server");
// const { UploadThingError } = require("uploadthing/server");
// const User = require("../models/User");
// const File = require("../models/File");
// const jwt = require("jsonwebtoken");

// console.log("🔍 Loading UploadThing core...");

// const f = createUploadthing();

// // ✅ SIMPLIFIED AUTHENTICATION (less prone to errors)
// const authenticateUser = async (req) => {
//   try {
//     console.log("🔍 UploadThing Auth Debug:");

//     const authHeader = req.headers?.authorization || req.headers?.Authorization;
//     console.log("Authorization header exists:", !!authHeader);

//     if (!authHeader) {
//       console.log("❌ No auth header found");
//       return null;
//     }

//     const token = authHeader.startsWith("Bearer ")
//       ? authHeader.substring(7)
//       : authHeader;

//     if (!token) {
//       console.log("❌ No token extracted");
//       return null;
//     }

//     console.log("🔍 Token preview:", token.substring(0, 20) + "...");

//     // ✅ SAFER JWT VERIFICATION
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("🔍 Decoded token userID:", decoded.userId);

//     // ✅ SAFER USER LOOKUP WITH TIMEOUT
//     const user = await Promise.race([
//       User.findById(decoded.userId).select("-password"),
//       new Promise((_, reject) =>
//         setTimeout(() => reject(new Error("Database timeout")), 5000)
//       ),
//     ]);

//     if (!user) {
//       console.log("❌ User not found in database");
//       return null;
//     }

//     console.log("✅ User found:", user.username);
//     return user;
//   } catch (error) {
//     console.error("❌ Auth error in UploadThing:", error.message);
//     return null;
//   }
// };

// const uploadRouter = {
//   // ✅ SIMPLIFIED PROFILE UPLOADER
//   profileImageUploader: f({
//     image: {
//       maxFileSize: "2MB",
//       maxFileCount: 1,
//     },
//   })
//     .middleware(async ({ req }) => {
//       console.log("🔍 Profile uploader middleware called");

//       try {
//         const user = await authenticateUser(req);

//         if (!user) {
//           console.log("❌ Profile uploader: Authentication failed");
//           throw new UploadThingError("Authentication required");
//         }

//         console.log("✅ Profile uploader authenticated:", user.username);
//         return {
//           userId: user._id.toString(),
//           uploadType: "profile-image",
//         };
//       } catch (error) {
//         console.error("❌ Profile middleware error:", error);
//         throw new UploadThingError("Authentication failed");
//       }
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       console.log("✅ Profile image upload complete to UploadThing");
//       console.log("File info:", {
//         name: file.name,
//         size: file.size,
//         key: file.key,
//       });

//       try {
//         const fileUrl = file.url || `https://utfs.io/f/${file.key}`;

//         // ✅ SAFER DATABASE OPERATIONS
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
//             format: file.type?.split("/")[1] || "jpeg",
//             uploadMethod: "uploadthing",
//           },
//         });

//         // Update user avatar
//         await User.findByIdAndUpdate(metadata.userId, {
//           avatar: fileUrl,
//         });

//         console.log("✅ Profile file record saved:", fileRecord._id);

//         return {
//           uploadedBy: metadata.userId,
//           fileId: fileRecord._id.toString(),
//           url: fileUrl,
//           key: file.key,
//           success: true,
//         };
//       } catch (error) {
//         console.error("❌ Error in profile upload completion:", error);
//         // ✅ DON'T THROW - just log error and return basic response
//         return {
//           uploadedBy: metadata.userId,
//           url: file.url || `https://utfs.io/f/${file.key}`,
//           key: file.key,
//           success: true,
//           warning: "File uploaded but database record may have failed",
//         };
//       }
//     }),

//   // ✅ SIMPLIFIED BUST UPLOADER
//   bustImageUploader: f({
//     image: {
//       maxFileSize: "10MB",
//       maxFileCount: 1,
//     },
//   })
//     .middleware(async ({ req }) => {
//       console.log("🔍 Bust uploader middleware called");

//       try {
//         const user = await authenticateUser(req);

//         if (!user) {
//           console.log("❌ Bust uploader: Authentication failed");
//           throw new UploadThingError("Authentication required");
//         }

//         // ✅ SIMPLIFIED CREDIT CHECK
//         if (!user.credits || user.credits <= 0) {
//           console.log("❌ Bust uploader: Insufficient credits");
//           throw new UploadThingError("Insufficient credits for 3D generation");
//         }

//         console.log(
//           "✅ Bust uploader authenticated:",
//           user.username,
//           "Credits:",
//           user.credits
//         );

//         return {
//           userId: user._id.toString(),
//           uploadType: "bust-generation",
//           userCredits: user.credits,
//         };
//       } catch (error) {
//         console.error("❌ Bust middleware error:", error);
//         throw new UploadThingError(error.message || "Authentication failed");
//       }
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       console.log("✅ Bust image upload complete to UploadThing!");
//       console.log("File info:", {
//         name: file.name,
//         size: file.size,
//         key: file.key,
//       });

//       try {
//         const fileUrl = file.url || `https://utfs.io/f/${file.key}`;

//         // ✅ SAFER DATABASE OPERATIONS WITH TIMEOUT
//         const fileRecord = await Promise.race([
//           File.create({
//             filename: file.name,
//             originalName: file.name,
//             uploadThingKey: file.key,
//             uploadThingUrl: fileUrl,
//             fileType: "image",
//             mimeType: file.type || "image/jpeg",
//             size: file.size,
//             userId: metadata.userId,
//             metadata: {
//               format: file.type?.split("/")[1] || "jpeg",
//               uploadMethod: "uploadthing",
//             },
//           }),
//           new Promise((_, reject) =>
//             setTimeout(() => reject(new Error("Database timeout")), 10000)
//           ),
//         ]);

//         console.log("✅ Bust image file record saved:", fileRecord._id);

//         return {
//           uploadedBy: metadata.userId,
//           fileId: fileRecord._id.toString(),
//           url: fileUrl,
//           key: file.key,
//           message: "Image uploaded successfully to UploadThing cloud!",
//           success: true,
//         };
//       } catch (error) {
//         console.error("❌ Error in bust upload completion:", error);
//         // ✅ DON'T THROW - just log error and return basic response
//         return {
//           uploadedBy: metadata.userId,
//           url: file.url || `https://utfs.io/f/${file.key}`,
//           key: file.key,
//           message:
//             "Image uploaded to UploadThing (database record may have failed)",
//           success: true,
//           warning: "Database operation failed but upload succeeded",
//         };
//       }
//     }),
// };

// console.log("✅ UploadThing uploadRouter configured");

// module.exports = { uploadRouter };


const { createUploadthing } = require("uploadthing/server");
const { UploadThingError } = require("uploadthing/server");
const User = require("../models/User");
const File = require("../models/File");
const jwt = require("jsonwebtoken");

console.log("🔍 UploadThing Core Loading...");
console.log("Environment check:");
console.log("- UPLOADTHING_TOKEN exists:", !!process.env.UPLOADTHING_TOKEN);
console.log(
  "- Token preview:",
  process.env.UPLOADTHING_TOKEN?.substring(0, 30) + "..."
);
console.log("- NODE_ENV:", process.env.NODE_ENV);

let f;
try {
  f = createUploadthing();
  console.log("✅ createUploadthing() successful");
} catch (error) {
  console.error("❌ createUploadthing() failed:", error);
  throw error;
}

// Enhanced authentication with detailed logging
const authenticateUser = async (req) => {
  try {
    console.log("🔍 UploadThing authentication starting...");

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    console.log("Auth header exists:", !!authHeader);

    if (!authHeader) {
      console.log("❌ No authorization header");
      return null;
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      console.log("❌ No token in header");
      return null;
    }

    console.log("🔍 Token length:", token.length);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ JWT decoded, userId:", decoded.userId);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("❌ User not found in database");
      return null;
    }

    console.log(
      "✅ User authenticated:",
      user.username,
      "Credits:",
      user.credits
    );
    return user;
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    return null;
  }
};

const uploadRouter = {
  bustImageUploader: f({
    image: {
      maxFileSize: "10MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      console.log("🎯 UploadThing middleware executing...");

      try {
        const user = await authenticateUser(req);

        if (!user) {
          console.log("❌ Middleware: Authentication failed");
          throw new UploadThingError("Authentication required");
        }

        if (user.credits <= 0) {
          console.log("❌ Middleware: Insufficient credits");
          throw new UploadThingError("Insufficient credits for 3D generation");
        }

        console.log("✅ Middleware: All checks passed for", user.username);

        return {
          userId: user._id.toString(),
          username: user.username,
          uploadType: "bust-generation",
          userCredits: user.credits,
        };
      } catch (error) {
        console.error("❌ Middleware error:", error);
        throw error instanceof UploadThingError
          ? error
          : new UploadThingError("Middleware failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("🎉 UploadThing upload COMPLETE!");
      console.log("📁 File details:", {
        name: file.name,
        size: file.size,
        key: file.key,
        url: file.url,
      });
      console.log("👤 User:", metadata.username);

      try {
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
            format: file.type?.split("/")[1] || "jpeg",
            uploadMethod: "uploadthing",
          },
        });

        console.log("✅ Real UploadThing file record saved:", fileRecord._id);
        console.log("🌐 Available at UploadThing URL:", fileUrl);

        return {
          fileId: fileRecord._id.toString(),
          url: fileUrl,
          key: file.key,
          message: "Successfully uploaded to UploadThing cloud!",
          success: true,
          uploadMethod: "uploadthing-cloud",
        };
      } catch (dbError) {
        console.error("❌ Database save error:", dbError);
        // Still return success since file uploaded to UploadThing
        return {
          url: file.url || `https://utfs.io/f/${file.key}`,
          key: file.key,
          success: true,
          warning: "Uploaded to UploadThing but database save failed",
        };
      }
    }),
};

console.log(
  "✅ UploadThing uploadRouter configured with routes:",
  Object.keys(uploadRouter)
);

module.exports = { uploadRouter };
