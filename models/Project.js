const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  inputImageUrl: {
    type: String,
    required: false,
    default:null
  },
  inputImageKey: {
    type: String, // UploadThing file key
    required: false,
    default:null
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  generatedModelUrl: {
    type: String,
    default: null,
  },
  generatedModelKey: {
    type: String, // UploadThing file key for 3D model for later that I will use
    default: null,
  },
  modelFormat: {
    type: String,
    enum: ["obj", "stl", "ply", "gltf"],
    default: "obj",
  },
  customizations: {
    scale: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 5.0,
    },
    material: {
      type: String,
      enum: ["default", "bronze", "marble", "wood", "plastic"],
      default: "default",
    },
    color: {
      type: String,
      default: "#8B4513",
    },
    rotation: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
  },
  metadata: {
    processingTime: Number,
    fileSize: Number, // in bytes
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
    },
    polyCount: Number,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
},{timestamps:true});


ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Project',ProjectSchema);