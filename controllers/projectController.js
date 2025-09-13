const Project = require('../models/Project');
const {AppError , catchAsync} = require('../middleware/errorHandler');


const getMyProjects = catchAsync(async (req,res,next) => {
    const projects = await Project.find({userId:req.user.id}).sort({createdAt: -1})
    res.status(200).json({
        success:true,
        results:projects.length,
        data:{
            projects
        }
    })
})


const getProject = catchAsync(async(req,res,next) => {
    const project = await Project.findOne({
        _id:req.params.id,
        userId:req.user.id
    })
    if (!project) {
       return next(new AppError("Project not found", 404));
    }

    res.status(200).json({
        success: true,
        data: {
          project,
        },
    });
})


const createProject = catchAsync(async (req,res,next)=>{
    if(req.user.credits <= 0){
      return next(
        new AppError("Insufficient credits. Please upgrade your plan.", 400)
      );  
    }

    const {title , description} = req.body;

    if (!title) {
        return next(new AppError("Project title is required", 400));
    }

    const project = await Project.create({
      title,
      description,
      userId: req.user.id,
      inputImageUrl: "placeholder", // this Will be updated when image is uploaded via uploadthing
      inputImageKey: "placeholder",
    });

     res.status(201).json({
       success: true,
       message: "Project created successfully",
       data: {
         project,
       },
     });
})


const updateProject  = catchAsync(async (req,res,next) => {
    const project = await Project.findOneAndUpdate(
        {_id:req.params.id , userId:req.user.id},
        req.body,
        {new:true , runValidators:true}
    );
    if (!project) {
       return next(new AppError("Project not found", 404));
    }
    res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: {
          project,
        },
    });
})

const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
});

module.exports = {
    getMyProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject
}
