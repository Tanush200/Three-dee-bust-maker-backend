const rateLimit = require('express-rate-limit')


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders : false
});


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders : true,
  legacyHeaders:false,
  skipSuccessfulRequests: true,
});


const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many password reset attempts, please try again later.",
  },
  standardHeaders:true,
  legacyHeaders:false
});

const projectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many project requests, please try again later.",
  },

  standardHeaders:true,
  legacyHeaders:false
});

module.exports = {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    projectLimiter
}