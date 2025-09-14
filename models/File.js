const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    uploadThingKey: {
      type: String,
      required: false,
      sparse: true,
    },
    uploadThingUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["image", "3d-model", "texture"],
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    metadata: {
      width: Number,
      height: Number,
      format: String,
      quality: Number,
      uploadMethod: {
        type: String,
        enum: ["direct", "uploadthing"],
        default: "direct",
      },
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

FileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
FileSchema.index({ userId: 1, fileType: 1 });
FileSchema.index({ uploadThingKey: 1 }, { sparse: true });


module.exports = mongoose.model('File',FileSchema);