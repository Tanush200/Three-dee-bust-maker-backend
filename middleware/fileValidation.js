const multer = require('multer');
const {AppError} = require('./errorHandler')


const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const allowedModelTypes = [
  "application/octet-stream",
  "text/plain",
  "model/obj",
  "application/x-tgif",
];
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, 
  model: 50 * 1024 * 1024,
};

const validateFileType = (file, allowedTypes)=>{
    return allowedTypes.includes(file.mimetype)
};

const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
}; 


const validateImageUpload = (req,res,next)=>{
    if(!req.file){
       return next(new AppError("No file uploaded", 400)); 
    }

    const file = req.file

    if(!validateFileType(file,allowedImageTypes)){
       return next(
         new AppError(
           "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
           400
         )
       ); 
    }

      if (!validateFileSize(file, FILE_SIZE_LIMITS.image)) {
        return next(
          new AppError(
            `File too large. Maximum size is ${
              FILE_SIZE_LIMITS.image / (1024 * 1024)
            }MB.`,
            400
          )
        );
      }

        if (
          file.originalname.includes("..") ||
          file.originalname.includes("/")
        ) {
          return next(new AppError("Invalid filename", 400));
        }

        next();
}

const validateModelUpload = (req,res,next)=>{
    if (!req.file) {
       return next(new AppError("No file uploaded", 400));
    }

    const file = req.file;

     if (!validateFileType(file, allowedModelTypes)) {
       return next(
         new AppError(
           "Invalid file type. Only OBJ and STL models are allowed.",
           400
         )
       );
     }

      if (!validateFileSize(file, FILE_SIZE_LIMITS.model)) {
        return next(
          new AppError(
            `File too large. Maximum size is ${
              FILE_SIZE_LIMITS.model / (1024 * 1024)
            }MB.`,
            400
          )
        );
      }
      
      next()
}

const createUploadLimiter = require("express-rate-limit")({
  windowMs: 30 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many file uploads, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
    validateImageUpload,
    validateModelUpload,
    createUploadLimiter,
    allowedImageTypes,
    allowedModelTypes,
    FILE_SIZE_LIMITS
}