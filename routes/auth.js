const express = require('express');
const {login , register,getMe,updateProfile,changePassword} = require('../controllers/authController')
const {requestPasswordReset , verifyResetToken , resetPassword} = require('../controllers/passwordController');
const { sendEmailVerification , verifyEmail , resendEmailVerification }  = require('../controllers/emailController')
const { authLimiter , passwordResetLimiter } = require('../middleware/rateLimiter')
const {auth} = require('../middleware/auth');

const router = express.Router();

// Public Routes with rate limiting 
router.post('/register',authLimiter,register);
router.post('/login',authLimiter,login)

// Password Reset Route
router.post("/forgot-password",passwordResetLimiter,requestPasswordReset);
router.get("/verify-reset-token/:token",verifyResetToken);
router.post("/reset-password",passwordResetLimiter,resetPassword);

// Email verification Routes with nodemailer
router.get("/verify-email/:token",verifyEmail);
router.post("/resend-verification",authLimiter,resendEmailVerification);

router.use(auth);

router.get('/me',getMe);
router.patch('/update-profile',updateProfile);
router.patch('/change-password',changePassword);
router.post("/send-verification",sendEmailVerification);

module.exports = router;