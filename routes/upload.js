const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

// ✅ COMMENT OUT UPLOADTHING IMPORTS TO TEST
// const { uploadRouter } = require('../uploadthing/core');
const { auth } = require("../middleware/auth");
// const { createRouteHandler } = require("uploadthing/server");
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
// DIRECT UPLOAD ROUTE
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
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          $inc: { credits: -1 },
        },
        { new: true }
      );

        console.log('💳 Credit deducted! User credits:', req.user.credits, '→', updatedUser.credits);
      
      

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
          creditsRemaining: updatedUser.credits, // ✅ Include updated credits
          creditsUsed: 1,
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

// upload thing service
const uploadthingService = require('../services/uploadthingService');

router.post("/uploadthing", auth, upload.single("files"), catchAsync(async (req, res, next) => {
  console.log("🌐 UploadThing Direct API route called");
    console.log("👤 User ID:", req.user.id);
    console.log("👤 User credits at start:", req.user.credits);

  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  if (req.user.credits <= 0) {
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {}
    return next(new AppError("Insufficient credits", 403));
  }

  try {
    console.log('📤 Uploading to UploadThing cloud via UTApi...');

    // Upload directly to UploadThing using UTApi
    const uploadResult = await uploadthingService.uploadFile(req.file, {
      userId: req.user.id,
      uploadType: 'bust-generation'
    });

    console.log('✅ UploadThing upload successful:', uploadResult);

    // Save file record to database
    const fileRecord = await File.create({
      filename: uploadResult.name,
      originalName: req.file.originalname,
      uploadThingKey: uploadResult.key,
      uploadThingUrl: uploadResult.url,
      fileType: "image",
      mimeType: req.file.mimetype,
      size: uploadResult.size || req.file.size,
      userId: req.user.id,
      metadata: {
        format: req.file.mimetype.split("/")[1],
        uploadMethod: "uploadthing",
      },
    });

    console.log('💾 UploadThing file record saved:', fileRecord._id);
    console.log('🌐 File available at:', uploadResult.url);
    console.log("💳 Starting credit deduction...");
    console.log("💳 User ID for credit deduction:", req.user.id);

     const currentUser = await User.findById(req.user.id);
     console.log("💳 Current user credits in DB:", currentUser?.credits);

     if (!currentUser) {
       throw new Error("User not found for credit deduction");
     }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id ,
      {
        $inc : {credits:-1}
      },
      {new : true,
        runValidators:true
      }
    )
    console.log('💳 Credit deducted! User credits:', req.user.credits, '→', updatedUser.credits);
     console.log("  - Before:", currentUser.credits);
     console.log("  - After:", updatedUser?.credits);
     console.log("  - Update successful:", !!updatedUser);

      if (!updatedUser) {
        throw new Error("Failed to update user credits");
      }

      // Verify the update worked
      const verifyUser = await User.findById(req.user.id);
      console.log(
        "💳 Verification - DB credits after update:",
        verifyUser?.credits
      );
    // Clean up local file
    try {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Local file cleaned up');
    } catch (e) {
      console.log('⚠️ Could not delete local file:', e.message);
    }

    // Return response similar to UploadThing format
    res.status(200).json({
      fileId: fileRecord._id.toString(),
      url: uploadResult.url,
      key: uploadResult.key,
      success: true,
      message: "Successfully uploaded to UploadThing cloud via UTApi!",
      uploadMethod: "uploadthing-utapi",
      creditsRemaining: updatedUser.credits,
      creditsUsed: 1,
      creditUpdate: {
        before: currentUser.credits,
        after: updatedUser.credits,
        deducted: 1,
      },
    });

  } catch (uploadError) {
    console.error('❌ UploadThing UTApi upload failed:', uploadError);

    // Clean up local file on failure
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {}

    return next(new AppError(`UploadThing upload failed: ${uploadError.message}`, 500));
  }
}));

console.log("✅ UploadThing UTApi route registered");


// =============================================================================
// DEBUG ROUTES
// =============================================================================

router.get("/uploadthing-debug", (req, res) => {
  let uploadRouterStatus = null;
  try {
    const { uploadRouter } = require("../uploadthing/core");
    uploadRouterStatus = {
      configured: !!uploadRouter,
      routes: uploadRouter ? Object.keys(uploadRouter) : [],
    };
  } catch (error) {
    uploadRouterStatus = {
      configured: false,
      error: error.message,
    };
  }

  res.json({
    success: true,
    message: "UploadThing debug info",
    env: {
      hasToken: !!process.env.UPLOADTHING_TOKEN,
      tokenPreview: process.env.UPLOADTHING_TOKEN
        ? process.env.UPLOADTHING_TOKEN.substring(0, 20) + "..."
        : "No token",
      nodeEnv: process.env.NODE_ENV,
    },
    uploadRouter: uploadRouterStatus,
  });
});

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Upload routes are working!",
    availableRoutes: [
      "POST /api/upload/direct",
      "POST /api/upload/uploadthing",
      "GET /api/upload/test",
      "GET /api/upload/uploadthing-debug",
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

module.exports = router;