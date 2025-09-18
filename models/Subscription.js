const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Dodo Subscription ID
    dodoSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },

    // Subscription Details
    planType: {
      type: String,
      required: true,
      enum: ["starter", "pro", "premium", "enterprise"],
    },

    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "cancelled", "expired", "trial"],
      default: "active",
    },

    // Billing
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      default: "USD",
    },

    billingInterval: {
      type: String,
      required: true,
      enum: ["monthly", "yearly", "lifetime"],
      default: "monthly",
    },

    // Credits
    monthlyCredits: {
      type: Number,
      required: true,
      min: 0,
    },

    // Dates
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    nextBillingDate: {
      type: Date,
      required: false,
    },

    trialEndsAt: {
      type: Date,
      required: false,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    // Features
    features: {
      maxProjects: {
        type: Number,
        default: 10,
      },
      highQualityGeneration: {
        type: Boolean,
        default: false,
      },
      customMaterials: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      exportFormats: [
        {
          type: String,
          enum: ["obj", "stl", "ply", "gltf", "fbx"],
        },
      ],
    },

    // Metadata
    metadata: {
      source: String,
      couponCode: String,
      originalAmount: Number,
      discount: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1, endDate: 1 });
SubscriptionSchema.index({ dodoSubscriptionId: 1 });

// Virtual for days remaining
SubscriptionSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for is active
SubscriptionSchema.virtual("isActive").get(function () {
  return this.status === "active" && new Date() < this.endDate;
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
