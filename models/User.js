
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')


const UserSchema = new mongoose.Schema(
  {
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
    subscription: {
      type: String,
      enum: ["free", "premium", "pro"],
      default: "free",
    },
    credits: {
      type: Number,
      default: 5,
    },
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
  { timestamps: true }
);


UserSchema.pre('save',async function (next) {
    if(!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password,salt);
        next();
    } catch (error) {
        next(error)
    }

})



UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

UserSchema.methods.incLoginAttempts = function(){
  if(this.lockUntil && this.lockUntil < Date.now()){
    return this.updateOne({
      $set : {loginAttempts: 1},
      $unset:{lockUntil : 1}
    })
  }
  const updates = {$inc : {loginAttempts:1}};

  if(this.loginAttempts + 1 >=5 && !this.isLocked()){
    updates.$set = {lockUntil: Date.now() + 2 * 60 * 60 * 1000}
  }
  return this.updateOne(updates)
}

UserSchema.methods.resetLoginAttempts = function(){
  return this.updateOne({
    $unset:{loginAttempts:1 , lockUntil:1}
  })
}


module.exports = mongoose.model('User',UserSchema)