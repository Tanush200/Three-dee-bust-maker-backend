const File = require('../models/File');
const Project = require('../models/Project');
const {AppError , catchAsync} = require('../middleware/errorHandler')
const sharp = require('sharp');
const path = require('path');

const getFileDetails = catchAsync(async(req,res,next)=>{
    const {fileId} = req.params;
    const file = await File.findOne({
      _id: fileId,
      userId: req.user.id,
    }).populate("projectId", "title status");

    if(!file){
        return next(new AppError('File not found',404))
    }

     res.status(200).json({
       success: true,
       data: {
         file,
       },
     });
})





const updateFileMetadata = catchAsync(async(req,res,next)=>{
    const {fileId} = req.params;
    const {filename , tags} = req.body;

    const file = await File.findOne({
        _id:fileId,
        userId:req.user.id
    })

    if(!file){
        return next(new AppError("File not found", 404));
    }

    if(filename){
        file.filename = filename;
    }

    if(tags && Array.isArray(tags)){
        file.tags;
    }

    await file.save()

    res.status(200).json({
      success: true,
      message: "File metadata updated successfully",
      data: {
        file,
      },
    });
})





const processImageForGeneration = catchAsync(async (req, res, next) => {
  const { fileId } = req.params;
  const { projectId } = req.body;

  const file = await File.findOne({
    _id: fileId,
    userId: req.user.id,
    fileType: 'image'
  });

  if (!file) {
    return next(new AppError('Image file not found', 404));
  }

  if (projectId) {
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    file.projectId = projectId;
    await file.save();

    project.inputImageUrl = file.uploadThingUrl;
    project.inputImageKey = file.uploadThingKey;
    project.status = 'processing';
    await project.save();
  }

  res.status(200).json({
    success: true,
    message: 'Image prepared for 3D generation',
    data: {
      file,
      project: projectId ? await Project.findById(projectId) : null
    }
  });
});






const getUploadStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const stats = await File.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: "$fileType",
        count: { $sum: 1 },
        totalSize: { $sum: "$size" },
        avgSize: { $avg: "$size" },
      },
    },
  ]);

  const totalFiles = await File.countDocuments({ userId });
  const totalSize = await File.aggregate([
    { $match: { userId: userId } },
    { $group: { _id: null, total: { $sum: "$size" } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalFiles,
      totalSize: totalSize?.total || 0,
      byFileType: stats,
      user: {
        credits: req.user.credits,
        subscription: req.user.subscription,
      },
    },
  });
});


module.exports = {
    getFileDetails,
    updateFileMetadata,
    processImageForGeneration,
    getUploadStats
}