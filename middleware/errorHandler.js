class AppError extends Error {
    constructor(message,statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this,this.constructor);
    }
}

const handleCastErrorDB = (err) =>{
    const message = `Invalid ${err.path} : ${err.value}`;
    return new AppError(message,400)
}


const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue);
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists. Please use a different ${field}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
    new AppError("Invalid token. Please log in again!", 401);
}

const handleJWTExpiredError = () => {
    new AppError("Your token has expired! Please log in again.", 401);
}



const sendErrorDev = (err , res) => {
    res.status(err.statusCode).json({
        success : false,
        error : err,
        message : err.message,
        stack : err.stack
    })
}

const sendErrorProd = (err,res) => {
    if(err.isOperational){
        res.status(err.statusCode).json({
            success : false,
            message:err.message
        })
    } else {
        console.error("ERROR  💥",err);
        res.status(500).json({
          success: false,
          message: "Something went wrong!",
        });
        
    }
};


const errorHandler = (err,req,res,next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err , res)
    } else {
        let error = {...err};
        error.message = error.message;

            if (error.name === "CastError") error = handleCastErrorDB(error);
            if (error.code === 11000) error = handleDuplicateFieldsDB(error);
            if (error.name === "ValidationError")
              error = handleValidationErrorDB(error);
            if (error.name === "JsonWebTokenError") error = handleJWTError();
            if (error.name === "TokenExpiredError")
              error = handleJWTExpiredError();

            sendErrorProd(error,res);
    }

}


const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};


const notFound = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(err);
};

module.exports = {
    AppError,
    errorHandler,
    catchAsync,
    notFound
}