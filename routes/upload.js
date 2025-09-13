const express = require("express");
const {uploadRouter} = require('../uploadthing/core')
const {auth} = require('../middleware/auth')
const { createRouteHandler } = require("uploadthing/express");
const {AppError , catchAsync} = require('../middleware/errorHandler')
const File = require('../models/File')
const {createUploadLimiter} = require('../middleware/fileValidation');
const {getFileDetails ,updateFileMetadata,processImageForGeneration , getUploadStats} = require('../controllers/fileController')

const router = express.Router();

const uploadthingHandler = createRouteHandler({
    router:uploadRouter,
    config:{
        logLevel:process.env.NODE_ENV === 'development' ? 'debug':'error',
    }
})

router.use("/uploadthing",createUploadLimiter,uploadthingHandler);

// const getUserFiles = catchAsync(async(req,res,next)=>{
//     const {page = 1,limit = 10 , fileType} = req.query;

//     const query = {userId:req.user.id};
//     if(fileType){
//         query.fileType = fileType;
//     }
//     const files = await File.find(query)
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .populate("projectId", "title status");

//       const total = await File.countDocuments(query)

//       res.status(200).json({
//         success: true,
//         data: {
//           files,
//           totalPages: Math.ceil(total / limit),
//           currentPage:page,
//           total
//         },
//       });
// })

// const deleteFile = catchAsync(async (req, res, next) => {
//   const { fileId } = req.params;

//   const file = await File.findOne({
//     _id: fileId,
//     userId: req.user.id,
//   });

//   if (!file) {
//     return next(new AppError("File not found", 404));
//   }


//   await File.findByIdAndDelete(fileId);

//   res.status(200).json({
//     success: true,
//     message: "File deleted successfully",
//   });
// });

router.use(auth)
router.get('/stats',getUploadStats)
router.get('/files/:fileId',getFileDetails)
router.patch('/files/:fileId',updateFileMetadata)
router.post('/files/:fileId/process',processImageForGeneration)
// router.get('/files',getUserFiles);
// router.delete('/files/:fileId',deleteFile)

module.exports = router
