const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require('../models/User')
const { sendVerificationEmail } = require('../services/emailService')
const {AppError , catchAsync} = require('../middleware/errorHandler')


const sendEmailVerification = catchAsync(async(req,res,next)=>{
    const user = await User.findById(req.user.id);

    if(user.isEmailVerified){
      return next(new AppError("Email is already verified", 400));  
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const jwtToken = jwt.sign(
      {
        userId: user._id,
        verificationToken: verificationToken,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    user.emailVerificationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const emailSent = await sendVerificationEmail(user,jwtToken);

    if (!emailSent) {
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError(
              "Email could not be sent. Please try again later.",
              500
            )
          );
    }

    res.status(200).json({
        success: true,
        message: "Verification email sent successfully",
    });
})

const verifyEmail = catchAsync(async(req,res,next)=>{
  const {token} = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedToken = crypto
       .createHash("sha256")
       .update(decoded.verificationToken)
       .digest("hex");
    const user = await User.findOne({
      _id:decoded.userId,
      emailVerificationToken:hashedToken,
      emailVerificationExpires:{$gt:Date.now()}
    })

     if (!user) {
       return next(new AppError("Token is invalid or has expired", 400));
     }
     
     user.isEmailVerified = true;
     user.emailVerificationToken = undefined;
     user.emailVerificationExpires = undefined;
     await user.save({validateBeforeSave:false})

     res.status(200).json({
       success: true,
       message: "Email verified successfully",
     });

  } catch (error) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
})

const resendEmailVerification = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Please provide email address", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.isEmailVerified) {
    return next(new AppError("Email is already verified", 400));
  }

 
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const jwtToken = jwt.sign(
    {
      userId: user._id,
      verificationToken: verificationToken,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  user.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });


  const emailSent = await sendVerificationEmail(user, jwtToken);

  if (!emailSent) {
    return next(
      new AppError("Email could not be sent. Please try again later.", 500)
    );
  }

  res.status(200).json({
    success: true,
    message: "Verification email sent successfully",
  });
});

module.exports = {
  sendEmailVerification,
  verifyEmail,
  resendEmailVerification
}
