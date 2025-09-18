
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs')


// const UserSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       minlength: 3,
//       maxlength: 30,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//     },
//     avatar: {
//       type: String,
//       default: null,
//     },
//     subscription: {
//       type: String,
//       enum: ["free", "premium", "pro"],
//       default: "free",
//     },
//     credits: {
//       type: Number,
//       default: 5,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     isEmailVerified: {
//       type: Boolean,
//       default: true,
//     },
//     emailVerificationToken: {
//       type: String,
//       default: null,
//     },
//     emailVerificationExpires: {
//       type: Date,
//       default: null,
//     },
//     passwordResetToken: {
//       type: String,
//       default: null,
//     },
//     passwordResetExpires: {
//       type: Date,
//       default: null,
//     },
//     lastLoginAt: {
//       type: Date,
//       default: null,
//     },
//     loginAttempts: {
//       type: Number,
//       default: 0,
//     },
//     lockUntil: {
//       type: Date,
//       default: null,
//     },
//   },
//   { timestamps: true }
// );


// UserSchema.pre('save',async function (next) {
//     if(!this.isModified('password')) return next();
//     try {
//         const salt = await bcrypt.genSalt(12);
//         this.password = await bcrypt.hash(this.password,salt);
//         next();
//     } catch (error) {
//         next(error)
//     }

// })



// UserSchema.methods.comparePassword = async function (candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };


// UserSchema.methods.isLocked = function () {
//   return !!(this.lockUntil && this.lockUntil > Date.now());
// };

// UserSchema.methods.incLoginAttempts = function(){
//   if(this.lockUntil && this.lockUntil < Date.now()){
//     return this.updateOne({
//       $set : {loginAttempts: 1},
//       $unset:{lockUntil : 1}
//     })
//   }
//   const updates = {$inc : {loginAttempts:1}};

//   if(this.loginAttempts + 1 >=5 && !this.isLocked()){
//     updates.$set = {lockUntil: Date.now() + 2 * 60 * 60 * 1000}
//   }
//   return this.updateOne(updates)
// }

// UserSchema.methods.resetLoginAttempts = function(){
//   return this.updateOne({
//     $unset:{loginAttempts:1 , lockUntil:1}
//   })
// }


// module.exports = mongoose.model('User',UserSchema)


const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    // ✅ EXISTING FIELDS (unchanged)
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: null,
    },

    // ✅ UPDATED SUBSCRIPTION FIELD
    subscription: {
      type: String,
      enum: ["free", "premium", "pro", "starter", "enterprise"], // Added missing plans
      default: "free",
    },

    // ✅ EXISTING CREDITS (unchanged)
    credits: {
      type: Number,
      default: 5,
      min: 0,
    },

    // ✅ NEW CREDIT TRACKING FIELDS
    totalCreditsEarned: {
      type: Number,
      default: 5, // Start with 5 free credits
      min: 0,
    },

    totalCreditsSpent: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ✅ NEW SUBSCRIPTION FIELDS
    currentSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

    subscriptionStatus: {
      type: String,
      enum: ["free", "trial", "active", "cancelled", "expired"],
      default: "free",
    },

    // ✅ NEW PAYMENT PROVIDER FIELDS
    dodoCustomerId: {
      type: String,
      default: null,
    },

    stripeCustomerId: {
      // Keep for future use
      type: String,
      default: null,
    },

    // ✅ NEW USAGE TRACKING FIELDS
    monthlyGenerationsUsed: {
      type: Number,
      default: 0,
    },

    lastMonthlyReset: {
      type: Date,
      default: Date.now,
    },

    // ✅ NEW PLAN LIMITS (based on current subscription)
    planLimits: {
      maxProjects: {
        type: Number,
        default: 10, // Free plan limit
      },
      monthlyGenerations: {
        type: Number,
        default: 5, // Free plan limit
      },
      exportFormats: [
        {
          type: String,
          enum: ["obj", "stl", "ply", "gltf", "fbx"],
          default: ["obj"],
        },
      ],
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
    },

    // ✅ EXISTING FIELDS (unchanged)
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ NEW INDEXES for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ subscriptionStatus: 1 });
UserSchema.index({ dodoCustomerId: 1 });

// ✅ NEW VIRTUAL FIELDS
UserSchema.virtual("availableCredits").get(function () {
  return this.credits || 0;
});

UserSchema.virtual("isSubscribed").get(function () {
  return ["active", "trial"].includes(this.subscriptionStatus);
});

UserSchema.virtual("needsMonthlyReset").get(function () {
  const now = new Date();
  const lastReset = new Date(this.lastMonthlyReset);
  const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);
  return daysSinceReset >= 30;
});

// ✅ EXISTING PASSWORD HASHING (unchanged)
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ EXISTING PASSWORD METHODS (unchanged)
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

UserSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

// ✅ NEW CREDIT MANAGEMENT METHODS
UserSchema.methods.addCredits = function (amount) {
  this.credits = (this.credits || 0) + amount;
  this.totalCreditsEarned = (this.totalCreditsEarned || 0) + amount;
  return this.save();
};

UserSchema.methods.spendCredits = function (amount) {
  if (this.credits < amount) {
    throw new Error("Insufficient credits");
  }
  this.credits = (this.credits || 0) - amount;
  this.totalCreditsSpent = (this.totalCreditsSpent || 0) + amount;
  return this.save();
};

UserSchema.methods.hasEnoughCredits = function (amount) {
  return (this.credits || 0) >= amount;
};

// ✅ NEW USAGE TRACKING METHODS
UserSchema.methods.resetMonthlyUsage = function () {
  this.monthlyGenerationsUsed = 0;
  this.lastMonthlyReset = new Date();
  return this.save();
};

UserSchema.methods.incrementGenerationUsage = function () {
  this.monthlyGenerationsUsed = (this.monthlyGenerationsUsed || 0) + 1;

  // Auto-reset if it's been more than 30 days
  if (this.needsMonthlyReset) {
    this.resetMonthlyUsage();
  }

  return this.save();
};

// ✅ NEW SUBSCRIPTION MANAGEMENT METHODS
UserSchema.methods.updatePlanLimits = function (planType) {
  const { pricingPlans } = require("../config/pricingPlans");
  const plan = pricingPlans[planType];

  if (plan) {
    this.planLimits = {
      maxProjects: plan.features.maxProjects,
      monthlyGenerations: plan.limits.monthlyGenerations,
      exportFormats: plan.features.exportFormats,
      highQualityGeneration: plan.features.highQualityGeneration,
      customMaterials: plan.features.customMaterials,
      prioritySupport: plan.features.prioritySupport,
    };
  }

  return this.save();
};

UserSchema.methods.activateSubscription = function (subscriptionId, planType) {
  this.currentSubscription = subscriptionId;
  this.subscriptionStatus = "active";
  this.subscription = planType;
  this.updatePlanLimits(planType);
  return this.save();
};

UserSchema.methods.cancelSubscription = function () {
  this.subscriptionStatus = "cancelled";
  // Don't remove currentSubscription reference for history
  return this.save();
};

module.exports = mongoose.model("User", UserSchema);
