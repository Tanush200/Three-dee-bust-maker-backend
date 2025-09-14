// const express = require("express");
// const {uploadRouter} = require('../uploadthing/core')
// const {auth} = require('../middleware/auth')
// const { createRouteHandler } = require("uploadthing/express");
// const {AppError , catchAsync} = require('../middleware/errorHandler')
// const File = require('../models/File')
// const {createUploadLimiter} = require('../middleware/fileValidation');
// const {getFileDetails ,updateFileMetadata,processImageForGeneration , getUploadStats} = require('../controllers/fileController')
// const router = express.Router();




// const uploadthingHandler = createRouteHandler({
//     router:uploadRouter,
//     config:{
//         logLevel:process.env.NODE_ENV === 'development' ? 'debug':'error',
//     }
// })

// router.use("/uploadthing",createUploadLimiter,uploadthingHandler);

// router.use(auth)
// router.get('/stats',getUploadStats)
// router.get('/files/:fileId',getFileDetails)
// router.patch('/files/:fileId',updateFileMetadata)
// router.post('/files/:fileId/process',processImageForGeneration)
// // router.get('/files',getUserFiles);
// // router.delete('/files/:fileId',deleteFile)

// module.exports = router





const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { uploadRouter } = require("../uploadthing/core");
const { auth } = require("../middleware/auth");
const { createRouteHandler } = require("uploadthing/server"); // ✅ FIXED: V7 uses /server
const { AppError, catchAsync } = require("../middleware/errorHandler");
const File = require("../models/File");
const { createUploadLimiter } = require("../middleware/fileValidation");
const {
  getFileDetails,
  updateFileMetadata,
  processImageForGeneration,
  getUploadStats,
} = require("../controllers/fileController");

const router = express.Router();

console.log("📁 Upload routes loading...");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory:", uploadsDir);
}

// =============================================================================
// MULTER CONFIGURATION FOR DIRECT UPLOADS
// =============================================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  },
});

// =============================================================================
// ✅ DIRECT UPLOAD ROUTE (THIS WAS MISSING!)
// =============================================================================

router.post(
  "/direct",
  auth,
  upload.single("file"),
  catchAsync(async (req, res, next) => {
    console.log("🔄 Direct upload request received");

    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    console.log("✅ File uploaded successfully:", {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      mimetype: req.file.mimetype,
    });

    // Check user credits
    if (req.user.credits <= 0) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("🗑️ Deleted file due to insufficient credits");
      } catch (deleteError) {
        console.error("❌ Error deleting file:", deleteError);
      }
      return next(new AppError("Insufficient credits for upload", 403));
    }

    try {
      // Save file info to database
      const fileRecord = await File.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        uploadThingKey: req.file.filename,
        uploadThingUrl: `/uploads/${req.file.filename}`,
        fileType: "image",
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId: req.user.id,
        metadata: {
          format: req.file.mimetype.split("/")[1],
          uploadMethod: "direct",
        },
      });

      console.log("💾 File record saved to database:", fileRecord._id);

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          fileId: fileRecord._id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: `/uploads/${req.file.filename}`,
          size: req.file.size,
          mimeType: req.file.mimetype,
          uploadMethod: "direct",
        },
      });
    } catch (error) {
      console.error("❌ Database error:", error);

      try {
        fs.unlinkSync(req.file.path);
        console.log("🗑️ Deleted file due to database error");
      } catch (deleteError) {
        console.error(
          "❌ Error deleting file after database failure:",
          deleteError
        );
      }

      return next(new AppError("Failed to save file record", 500));
    }
  })
);

// =============================================================================
// UPLOADTHING ROUTES
// =============================================================================

try {
  const uploadthingHandler = createRouteHandler({
    router: uploadRouter,
    // ✅ FIXED: V7 doesn't use config object like this
  });

  router.use("/uploadthing", createUploadLimiter, uploadthingHandler);
  console.log("✅ UploadThing routes registered");
} catch (error) {
  console.error("❌ UploadThing routes failed to register:", error.message);
}

// =============================================================================
// TEST ROUTE
// =============================================================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Upload routes are working!",
    availableRoutes: [
      "POST /api/upload/direct",
      "POST /api/upload/uploadthing",
      "GET /api/upload/test",
      "GET /api/upload/stats (auth required)",
    ],
  });
});

// =============================================================================
// PROTECTED ROUTES (require authentication)
// =============================================================================

router.use(auth);
router.get("/stats", getUploadStats);
router.get("/files/:fileId", getFileDetails);
router.patch("/files/:fileId", updateFileMetadata);
router.post("/files/:fileId/process", processImageForGeneration);

console.log("✅ Upload routes configured");

// ✅ CRITICAL: Export the router (THIS WAS MISSING!)
module.exports = router;



// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const { uploadRouter } = require("../uploadthing/core");
// const { auth } = require("../middleware/auth");
// const { createRouteHandler } = require("uploadthing/server");
// const { AppError, catchAsync } = require("../middleware/errorHandler");
// const File = require("../models/File");
// const { createUploadLimiter } = require("../middleware/fileValidation");
// const {
//   getFileDetails,
//   updateFileMetadata,
//   processImageForGeneration,
//   getUploadStats,
// } = require("../controllers/fileController");

// const router = express.Router();

// // Ensure uploads directory exists
// const uploadsDir = path.join(__dirname, "../uploads");
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
//   console.log("✅ Created uploads directory:", uploadsDir);
// }

// // =============================================================================
// // MULTER CONFIGURATION FOR DIRECT UPLOADS
// // =============================================================================

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const extension = path.extname(file.originalname);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
//     }
//   },
// });

// // =============================================================================
// // DIRECT UPLOAD ROUTE
// // =============================================================================

// router.post(
//   "/direct",
//   auth,
//   upload.single("file"),
//   catchAsync(async (req, res, next) => {
//     console.log("🔄 Direct upload request received");

//     if (!req.file) {
//       return next(new AppError("No file uploaded", 400));
//     }

//     console.log("✅ File uploaded successfully:", {
//       filename: req.file.filename,
//       originalName: req.file.originalname,
//       size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
//       mimetype: req.file.mimetype,
//       path: req.file.path,
//     });

//     // Check user credits
//     if (req.user.credits <= 0) {
//       // IMPROVED: Better error handling for file deletion
//       try {
//         fs.unlinkSync(req.file.path);
//         console.log("🗑️ Deleted file due to insufficient credits");
//       } catch (deleteError) {
//         console.error("❌ Error deleting file:", deleteError);
//       }
//       return next(new AppError("Insufficient credits for upload", 403));
//     }

//     try {
//       // Save file info to database
//       const fileRecord = await File.create({
//         filename: req.file.filename,
//         originalName: req.file.originalname,
//         uploadThingKey: req.file.filename,
//         uploadThingUrl: `/uploads/${req.file.filename}`,
//         fileType: "image",
//         mimeType: req.file.mimetype,
//         size: req.file.size,
//         userId: req.user.id,
//         metadata: {
//           format: req.file.mimetype.split("/")[1],
//           uploadMethod: "direct",
//         },
//       });

//       console.log("💾 File record saved to database:", fileRecord._id);

//       res.status(200).json({
//         success: true,
//         message: "File uploaded successfully",
//         data: {
//           fileId: fileRecord._id,
//           filename: req.file.filename,
//           originalName: req.file.originalname,
//           url: `/uploads/${req.file.filename}`,
//           size: req.file.size,
//           mimeType: req.file.mimetype,
//           uploadMethod: "direct",
//         },
//       });
//     } catch (error) {
//       console.error("❌ Database error:", error);

//       // IMPROVED: Better error handling for file deletion
//       try {
//         fs.unlinkSync(req.file.path);
//         console.log("🗑️ Deleted file due to database error");
//       } catch (deleteError) {
//         console.error(
//           "❌ Error deleting file after database failure:",
//           deleteError
//         );
//       }

//       return next(new AppError("Failed to save file record", 500));
//     }
//   })
// );

// // =============================================================================
// // UPLOADTHING ROUTES
// // =============================================================================

// const uploadthingHandler = createRouteHandler({
//   router: uploadRouter,
// });

// // IMPROVED: Remove rate limiter for UploadThing to avoid conflicts
// router.use("/uploadthing", uploadthingHandler);

// // =============================================================================
// // TEST ROUTES (for debugging)
// // =============================================================================

// // Add test route to verify UploadThing configuration
// router.get("/uploadthing-test", (req, res) => {
//   res.json({
//     success: true,
//     message: "UploadThing configuration test",
//     env: {
//       hasToken: !!process.env.UPLOADTHING_TOKEN,
//       tokenPreview: process.env.UPLOADTHING_TOKEN
//         ? process.env.UPLOADTHING_TOKEN.substring(0, 20) + "..."
//         : "No token found",
//       uploadRouterConfigured: !!uploadRouter,
//       availableRoutes: uploadRouter ? Object.keys(uploadRouter) : [],
//     },
//   });
// });

// // =============================================================================
// // PROTECTED ROUTES (require authentication)
// // =============================================================================

// router.use(auth);
// router.get("/stats", getUploadStats);
// router.get("/files/:fileId", getFileDetails);
// router.patch("/files/:fileId", updateFileMetadata);
// router.post("/files/:fileId/process", processImageForGeneration);

// // ADDED: Get user's files with pagination
// router.get(
//   "/files",
//   catchAsync(async (req, res, next) => {
//     const { page = 1, limit = 10, fileType } = req.query;

//     const query = { userId: req.user.id };
//     if (fileType) {
//       query.fileType = fileType;
//     }

//     const files = await File.find(query)
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .populate("projectId", "title status");

//     const total = await File.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       data: {
//         files,
//         totalPages: Math.ceil(total / limit),
//         currentPage: parseInt(page),
//         total,
//         limit: parseInt(limit),
//       },
//     });
//   })
// );

// // ADDED: Delete file
// router.delete(
//   "/files/:fileId",
//   catchAsync(async (req, res, next) => {
//     const { fileId } = req.params;

//     const file = await File.findOne({
//       _id: fileId,
//       userId: req.user.id,
//     });

//     if (!file) {
//       return next(new AppError("File not found", 404));
//     }

//     // Delete physical file if it's a direct upload
//     if (file.uploadThingUrl && file.uploadThingUrl.startsWith("/uploads/")) {
//       const filePath = path.join(__dirname, "../", file.uploadThingUrl);
//       try {
//         if (fs.existsSync(filePath)) {
//           fs.unlinkSync(filePath);
//           console.log(`🗑️ Deleted physical file: ${filePath}`);
//         }
//       } catch (error) {
//         console.error("❌ Error deleting physical file:", error);
//       }
//     }

//     // Delete database record
//     await File.findByIdAndDelete(fileId);
//     console.log(`🗑️ Deleted file record: ${fileId}`);

//     res.status(200).json({
//       success: true,
//       message: "File deleted successfully",
//     });
//   })
// );

// module.exports = router;


