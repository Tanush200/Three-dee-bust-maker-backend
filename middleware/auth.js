const jwt = require('jsonwebtoken')
const User = require('../models/User');

const auth = async (req,res,next) => {
    try {
        const authHeader = req.header("Authorization");
        if(!authHeader){
            return res.status(401).json({
              success: false,
              message: "No token provided, access denied",
            });
        }

        const token = authHeader.startsWith('Bearer') 
        ? authHeader.substring(7)
        : authHeader;

        if(!token){
            return res.status(401).json({
                success : false,
                message:'Invalid token format'
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select('-password');

        if(!user){
            return res.status(401).json({
              success: false,
              message: "User not found, token invalid",
            });
        }

        if(!user.isActive){
            return res.status(401).json({
              success: false,
              message: "User account is disabled",
            });
        }

        req.user = user
        next()
    } catch (error) {
        console.error("Auth middleware error:", error);
        if(error.name === 'JsonWebTokenError'){
           return res.status(401).json({
             success: false,
             message: "Invalid token",
           }); 
        }
        if (error.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token expired",
          });
        }
        res.status(500).json({
          success: false,
          message: "Server error during authentication",
        });
    }


    
}


// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    req.user = user || null;
    next();
    
  } catch (error) {
    req.user = null;
    next();
  }
};


module.exports = {auth , optionalAuth}