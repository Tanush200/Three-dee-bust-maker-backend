const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require('../models/User')
const {sendPasswordResetEmail} = require('../services/emailService')
const { AppError , catchAsync } = require('../middleware/errorHandler')


const requestPasswordReset = catchAsync(async(req,res,next) => {
    const {email} = req.body;

    if(!email){
      return next(new AppError("Please provide email address", 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if(!user){
        return res.status(200).json({
          success: true,
          message:
            "If an account with that email exists, a password reset link has been sent.",
        });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const jwtToken = jwt.sign(
      {
        userId: user._id,
        resetToken: resetToken,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save({validateBeforeSave:false})

    const emailSent = await sendPasswordResetEmail(user,jwtToken);

    if(!emailSent){
         if (!emailSent) {
           user.passwordResetToken = undefined;
           user.passwordResetExpires = undefined;
           await user.save({ validateBeforeSave: false });

           return next(
             new AppError(
               "Email could not be sent. Please try again later.",
               500
             )
           );
         } 
    }

    res.status(200).json({
       success: true,
       message: "Password reset email sent successfully",
       resetToken:jwtToken
    });
})

const verifyResetToken = catchAsync(async(req,res,next)=>{
    const {token} = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hashedToken = crypto
          .createHash("sha256")
          .update(decoded.resetToken)
          .digest("hex");
        const user = await User.findOne({
            _id:decoded.userId,
            passwordResetToken:hashedToken,
            passwordResetExpires:{$gt : Date.now()}
        })

        if(!user){
            return next(new AppError("Token is invalid or has expired", 400));
        }

         res.status(200).json({
           success: true,
           message: "Token is valid",
           data: {
             userId: user._id,
             email: user.email,
           },
         });
    } catch (error) {
        return next(new AppError("Token is invalid or has expired", 400));
    }

})


const resetPassword = catchAsync(async(req,res,next)=>{
    const {token , newPassword} = req.body;

    if(!token || !newPassword){
      return next(new AppError("Token and new password are required", 400));   
    }
    if (newPassword.length < 6) {
       return next(new AppError("Password must be at least 6 characters", 400));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hashedToken = crypto
           .createHash("sha256")
           .update(decoded.resetToken)
           .digest("hex");

        const user = await User.findOne({
            _id: decoded.userId,
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });
        if (!user) {
           return next(new AppError("Token is invalid or has expired", 400));
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.loginAttempts = undefined;
        user.lockUntil = undefined

        await user.save();

        res.status(201).json({
          success: true,
          message: "Password reset successful",
        });
    } catch (error) {
        return next(new AppError("Token is invalid or has expired", 400));
    }

})

module.exports = {
    requestPasswordReset,
    verifyResetToken,
    resetPassword
}