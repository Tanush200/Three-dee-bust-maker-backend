const fetch = require("node-fetch");
const Project = require("../models/Project");
const { AppError, catchAsync } = require("../middleware/errorHandler");
const ai3dService = require("../services/ai3dService");

const triggerAIGeneration = async (projectId, imageUrl) => {
  try {
    console.log(`🎯 ==> STARTING AI GENERATION <==`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Image URL: ${imageUrl}`);

    console.log("📞 Calling AI service...");
    const result = await ai3dService.generateBustFromImage(imageUrl, {
      quality: "medium",
      style: "realistic",
      projectId: projectId,
    });

    console.log("📋 AI Service returned:", JSON.stringify(result, null, 2));

    if (result && result.jobId) {
      const modelUrl = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }${result.modelUrl}`;

      console.log("🔗 Constructed model URL:", modelUrl);

      const updateData = {
        status: "completed",
        progress: 100,
        generatedModelUrl: modelUrl,
        metadata: {
          vertices: result.metadata.vertices,
          faces: result.metadata.faces,
          quality: result.metadata.quality,
          style: result.metadata.style,
          aiProvider: "fallback",
          jobId: result.jobId,
          processingTime: result.processingTime,
        },
        completedAt: new Date(),
        error: null,
      };

      console.log("🔄 Updating project with:", updateData);

      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        updateData,
        { new: true }
      );

      console.log(`✅ AI generation completed for project: ${projectId}`);
      console.log("✅ Updated project:", updatedProject.generatedModelUrl);

      return true;
    } else {
      throw new Error("AI service returned invalid result - no jobId");
    }
  } catch (error) {
    console.error(`❌ AI generation failed for project ${projectId}:`, error);
    console.error("Error stack:", error.stack);

    await Project.findByIdAndUpdate(projectId, {
      status: "failed",
      error: error.message,
    });

    return false;
  }
};
const getMyProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });
  res.status(200).json({
    success: true,
    results: projects.length,
    data: {
      projects,
    },
  });
});

const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  console.log("📊 Project loaded - checking for auto-generation:");
  console.log("   - Has inputImageUrl:", !!project.inputImageUrl);
  console.log("   - Has generatedModelUrl:", !!project.generatedModelUrl);
  console.log("   - Status:", project.status);
  console.log("   - InputImageUrl:", project.inputImageUrl);

  // AUTO-TRIGGER GENERATION if image exists but no model
  // ALSO handle stuck "processing" projects without models
  if (
    project.inputImageUrl &&
    project.inputImageUrl !== "" &&
    !project.generatedModelUrl &&
    (project.status === "pending" || project.status === "processing") // FIXED: Allow processing to restart
  ) {
    console.log("🎯 AUTO-TRIGGERING AI GENERATION...");

    // Update to processing immediately
    await Project.findByIdAndUpdate(req.params.id, {
      status: "processing",
      progress: 10,
      error: null, // Clear any previous errors
    });

    // Trigger generation in background
    setImmediate(async () => {
      console.log("🚀 Background generation started for:", req.params.id);
      await triggerAIGeneration(req.params.id, project.inputImageUrl);
    });

    // Update response to show processing
    project.status = "processing";
    project.progress = 10;

    console.log("✅ Auto-generation triggered!");
  } else {
    console.log("❌ Auto-generation NOT triggered - conditions not met");
    console.log("   - Condition details:");
    console.log("     * Has image:", !!project.inputImageUrl);
    console.log("     * No model:", !project.generatedModelUrl);
    console.log(
      "     * Status allows:",
      project.status === "pending" || project.status === "processing"
    );
  }

  res.status(200).json({
    success: true,
    data: {
      project,
    },
  });
});

const createProject = catchAsync(async (req, res, next) => {
  // if(req.user.credits <= 0){
  //   return next(
  //     new AppError("Insufficient credits. Please upgrade your plan.", 400)
  //   );
  // }

  const { title, description } = req.body;

  if (!title) {
    return next(new AppError("Project title is required", 400));
  }

  const project = await Project.create({
    title,
    description,
    userId: req.user.id,
    inputImageUrl: "", // this Will be updated when image is uploaded via uploadthing
    inputImageKey: "",
    status: "pending",
    progress: 0,
  });

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: {
      project,
    },
  });
});

// const updateProject  = catchAsync(async (req,res,next) => {
//     const project = await Project.findOneAndUpdate(
//         {_id:req.params.id , userId:req.user.id},
//         req.body,
//         {new:true , runValidators:true}
//     );
//     if (!project) {
//        return next(new AppError("Project not found", 404));
//     }
//     res.status(200).json({
//         success: true,
//         message: "Project updated successfully",
//         data: {
//           project,
//         },
//     });
// })

const updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  // AUTO-TRIGGER AI GENERATION when image is uploaded
  if (
    req.body.inputImageUrl &&
    !project.generatedModelUrl &&
    project.status !== "processing" &&
    project.status !== "completed"
  ) {
    console.log("🎯 Image uploaded, triggering AI generation...");

    // Update status to processing
    await Project.findByIdAndUpdate(req.params.id, {
      status: "processing",
      progress: 5,
    });

    // Trigger AI generation in background (non-blocking)
    setImmediate(() => {
      triggerAIGeneration(req.params.id, req.body.inputImageUrl);
    });

    // Update response to show processing status
    project.status = "processing";
    project.progress = 5;
  }

  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: {
      project,
    },
  });
});

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
  deleteProject,
};
