const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const User = require('../models/User');
const { sendVerificationEmail } = require('../services/emailService')
const {AppError,catchAsync} = require('../middleware/errorHandler')


const signToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });
}

const createSendToken = (user, statusCode, res, message = "Success")=>{
    const token = signToken(user._id);

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      subscription: user.subscription,
      credits: user.credits,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    res.status(statusCode).json({
        success:true,
        message,
        token,
        data:{
            user : userResponse
        }
    })
};


// Register controller for user

const register = catchAsync(async (req,res,next) => {
    const {username , email , password} = req.body;

    if(!username || !email || !password){
        return next(
          new AppError("Please provide username, email and password", 400)
        );
    }

      if (password.length < 6) {
        return next(
          new AppError("Password must be at least 6 characters", 400)
        );
      }

      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
      });

      if(existingUser){
        const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
         return next(
           new AppError(`User with this ${field} already exists`, 400)
         );
      }

      const newUser = await User.create({
        username,
        email:email.toLowerCase(),
        password
      })

      const verificationToken = crypto.randomBytes(32).toString('hex')
      const jwtToken = jwt.sign(
        {
          userId: newUser._id,
          verificationToken: verificationToken,
          email: newUser.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }

      );

        newUser.emailVerificationToken = crypto
           .createHash("sha256")
           .update(verificationToken)
           .digest("hex");
        newUser.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await newUser.save({ validateBeforeSave: false });

        try {
          await sendVerificationEmail(newUser,jwtToken)
        } catch (error) {
          console.error("Failed to send verification email:", error);
        }
      createSendToken(newUser, 201, res, "User registered successfully");
})


// Login controller for user

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !(await user.comparePassword(password))) {
    if(user){
      await user.incLoginAttempts();
    }
    return next(new AppError("Incorrect email or password", 401));
  }

  if(user.isLocked()){
    return next(
      new AppError(
        "Account is temporarily locked due to too many failed login attempts. Please try again later.",
        423
      )
    );
  }

  if (!user.isActive) {
    return next(new AppError("Your account has been deactivated", 401));
  }

  if(user.loginAttempts && user.loginAttempts > 0){
    await user.resetLoginAttempts();
  }

  user.lastLoginAt = new Date();
  await user.save({validateBeforeSave:false})

  createSendToken(user, 200, res, "Login successful");
});

// getMe controller 

const getMe = catchAsync(async( req,res,next ) => {
    const user = await User.findById(req.user.id).select('-password');

     res.status(200).json({
       success: true,
       data: {
         user,
       },
     });
})


const updateProfile  = catchAsync(async(req,res,next)=>{
    if(req.body.password){
      return next(
        new AppError("Please use /change-password to update password", 400)
      );  
    }

  const allowedFields = ["username", "avatar"];
  const filteredBody = {};

  Object.keys(req.body).forEach(key =>{
    if(allowedFields.includes(key)){
        filteredBody[key] = req.body[key]
    }
  })

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  }).select('-password');

 
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: updatedUser,
    },
  });
})


// Change Password controller

const changePassword = catchAsync(async (req,res,next) => {
    const {currentPassword , newPassword} = req.body;

     if (!currentPassword || !newPassword) {
        return next(
         new AppError("Please provide current and new password", 400)
        );
     }

       if (newPassword.length < 6) {
        return next(
           new AppError("New password must be at least 6 characters", 400)
        );
       }
       const user = await User.findById(req.user.id);

       if(!(await user.comparePassword(currentPassword))){
        return next(new AppError("Current password is incorrect", 400));
       }

       user.password = newPassword
       await user.save();

       createSendToken(user, 200, res, "Password changed successfully");
})

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword
}