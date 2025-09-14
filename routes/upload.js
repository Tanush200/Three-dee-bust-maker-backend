



const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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



// router.post(
//   "/uploadthing",
//   auth,
//   upload.single("files"),
//   catchAsync(async (req, res, next) => {
//     console.log("🔄 Mock UploadThing route called");

//     if (!req.file) {
//       return next(new AppError("No file uploaded to mock UploadThing", 400));
//     }

//     if (req.user.credits <= 0) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (e) {}
//       return next(new AppError("Insufficient credits", 403));
//     }

//     try {
//       // Save to database like UploadThing would
//       const fileRecord = await File.create({
//         filename: req.file.filename,
//         originalName: req.file.originalname,
//         uploadThingKey: `mock-${Date.now()}`,
//         uploadThingUrl: `/uploads/${req.file.filename}`,
//         fileType: "image",
//         mimeType: req.file.mimetype,
//         size: req.file.size,
//         userId: req.user.id,
//         metadata: {
//           format: req.file.mimetype.split("/")[1],
//           uploadMethod: "uploadthing", // ✅ FIXED: Use valid enum value
//         },
//       });

//       console.log("✅ Mock UploadThing file saved:", fileRecord._id);

//       // Return UploadThing-like response
//       res.status(200).json({
//         fileId: fileRecord._id.toString(),
//         url: `/uploads/${req.file.filename}`,
//         key: `mock-${Date.now()}`,
//         success: true,
//         message: "Mock UploadThing upload successful",
//       });
//     } catch (error) {
//       console.error("❌ Mock UploadThing error:", error);
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (e) {}
//       return next(new AppError("Mock UploadThing failed", 500));
//     }
//   })
// );

// =============================================================================
// ✅ MULTIPLE IMPORT STRATEGIES FOR UPLOADTHING
// =============================================================================

// let uploadthingHandler = null;
// let uploadthingError = null;

// try {
//   console.log('🔍 Starting UploadThing import diagnostics...');
  
//   // First check if the uploadthing package exists
//   let uploadthingPackage;
//   try {
//     uploadthingPackage = require('uploadthing/package.json');
//     console.log('✅ UploadThing package found, version:', uploadthingPackage.version);
//   } catch (e) {
//     throw new Error('UploadThing package not found: ' + e.message);
//   }

//   // Check if our core module loads
//   const { uploadRouter } = require('../uploadthing/core');
//   console.log('✅ Core uploadRouter loaded with routes:', Object.keys(uploadRouter));

//   // Try multiple import strategies for createRouteHandler
//   let createRouteHandler = null;
//   let importMethod = null;

//   // Strategy 1: Direct require with destructuring
//   try {
//     const serverModule = require("uploadthing/server");
//     console.log('✅ Strategy 1: Server module loaded');
//     console.log('Available exports:', Object.keys(serverModule));
    
//     createRouteHandler = serverModule.createRouteHandler;
//     if (createRouteHandler && typeof createRouteHandler === 'function') {
//       importMethod = 'destructuring';
//       console.log('✅ Strategy 1: createRouteHandler found via destructuring');
//     } else {
//       throw new Error('createRouteHandler not found in exports or not a function');
//     }
//   } catch (e1) {
//     console.log('❌ Strategy 1 failed:', e1.message);

//     // Strategy 2: Default import
//     try {
//       const uploadthingServer = require("uploadthing/server");
//       createRouteHandler = uploadthingServer.default?.createRouteHandler || uploadthingServer.createRouteHandler;
//       if (createRouteHandler && typeof createRouteHandler === 'function') {
//         importMethod = 'default';
//         console.log('✅ Strategy 2: createRouteHandler found via default');
//       } else {
//         throw new Error('createRouteHandler not found in default export');
//       }
//     } catch (e2) {
//       console.log('❌ Strategy 2 failed:', e2.message);

//       // Strategy 3: Try the main package
//       try {
//         const mainPackage = require("uploadthing");
//         createRouteHandler = mainPackage.createRouteHandler;
//         if (createRouteHandler && typeof createRouteHandler === 'function') {
//           importMethod = 'main-package';
//           console.log('✅ Strategy 3: createRouteHandler found in main package');
//         } else {
//           throw new Error('createRouteHandler not found in main package');
//         }
//       } catch (e3) {
//         console.log('❌ Strategy 3 failed:', e3.message);

//         // Strategy 4: Manual path construction
//         try {
//           const path = require('path');
//           const uploadthingPath = path.join(__dirname, '../node_modules/uploadthing/server');
//           const serverFile = require(uploadthingPath);
//           createRouteHandler = serverFile.createRouteHandler;
//           if (createRouteHandler && typeof createRouteHandler === 'function') {
//             importMethod = 'manual-path';
//             console.log('✅ Strategy 4: createRouteHandler found via manual path');
//           } else {
//             throw new Error('createRouteHandler not found via manual path');
//           }
//         } catch (e4) {
//           console.log('❌ Strategy 4 failed:', e4.message);
//           throw new Error(`All import strategies failed: ${e1.message} | ${e2.message} | ${e3.message} | ${e4.message}`);
//         }
//       }
//     }
//   }

//   if (!createRouteHandler || typeof createRouteHandler !== 'function') {
//     throw new Error(`createRouteHandler is ${typeof createRouteHandler}, expected function`);
//   }

//   console.log(`✅ createRouteHandler successfully imported via ${importMethod}`);

//   // Create the route handler
//   uploadthingHandler = createRouteHandler({
//     router: uploadRouter,
//   });

//   console.log('✅ UploadThing handler created successfully');
//   console.log('Handler type:', typeof uploadthingHandler);

// } catch (error) {
//   console.error('❌ UploadThing setup completely failed:', error.message);
//   uploadthingError = error.message;
// }

// // Register routes (same as before)
// if (uploadthingHandler && !uploadthingError) {
//   console.log('✅ Registering REAL UploadThing routes...');
  
//   if (typeof uploadthingHandler === 'function') {
//     router.all("/uploadthing", (req, res, next) => {
//       console.log('🌐 REAL UploadThing route hit:', {
//         method: req.method,
//         url: req.url,
//       });
//       return uploadthingHandler(req, res, next);
//     });
    
//     console.log("✅ REAL UploadThing registered successfully!");
    
//   } else if (uploadthingHandler.GET && uploadthingHandler.POST) {
//     router.get("/uploadthing", uploadthingHandler.GET);
//     router.post("/uploadthing", uploadthingHandler.POST);
//     console.log("✅ REAL UploadThing registered with GET/POST handlers!");
//   }
  
// } else {
//   console.log('🚫 Using fallback mock due to error:', uploadthingError);
  
//   // Your existing mock route (keep it as fallback)
//   router.post("/uploadthing", auth, upload.single("files"), catchAsync(async (req, res, next) => {
//     console.log("🔄 FALLBACK: Mock UploadThing route");
//     // ... rest of your mock route code
    
//     if (!req.file) {
//       return next(new AppError("No file uploaded", 400));
//     }

//     if (req.user.credits <= 0) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (e) {}
//       return next(new AppError("Insufficient credits", 403));
//     }

//     try {
//       const fileRecord = await File.create({
//         filename: req.file.filename,
//         originalName: req.file.originalname,
//         uploadThingKey: `fallback-${Date.now()}`,
//         uploadThingUrl: `/uploads/${req.file.filename}`,
//         fileType: "image",
//         mimeType: req.file.mimetype,
//         size: req.file.size,
//         userId: req.user.id,
//         metadata: {
//           format: req.file.mimetype.split("/")[1],
//           uploadMethod: "uploadthing",
//         },
//       });

//       console.log("✅ Fallback upload saved:", fileRecord._id);

//       res.status(200).json({
//         fileId: fileRecord._id.toString(),
//         url: `/uploads/${req.file.filename}`,
//         key: `fallback-${Date.now()}`,
//         success: true,
//         message: "Upload successful (fallback mode)",
//       });
      
//     } catch (error) {
//       console.error("❌ Fallback upload error:", error);
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (e) {}
//       return next(new AppError("Upload failed", 500));
//     }
//   }));
// }


// =============================================================================
// ✅ UPLOADTHING DIRECT API APPROACH (UTApi)
// =============================================================================

const uploadthingService = require('../services/uploadthingService');

router.post("/uploadthing", auth, upload.single("files"), catchAsync(async (req, res, next) => {
  console.log("🌐 UploadThing Direct API route called");

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
      uploadMethod: "uploadthing-utapi"
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