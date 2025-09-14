const express = require("express");
const path = require('path');
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const helmet = require('helmet')
const morgan = require('morgan')
const { errorHandler , notFound } = require('./middleware/errorHandler')
const {generalLimiter} = require('./middleware/rateLimiter')
const uploadRoute = require('./routes/upload')


dotenv.config();

const app = express();

connectDB();


app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(helmet());
app.use(generalLimiter)

// app.use(
//   cors({
//     origin:
//       process.env.NODE_ENV === "production"
//         ? "https://your-domain.com"
//         : "http://localhost:3000",
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: function (origin,callback){
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.CLIENT_URL,
      ];
      if(!origin || allowedOrigins.includes(origin)){
        callback(null , true)
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials:true
  })
)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// if (process.env.NODE_ENV === "development") {
//   app.use((req, res, next) => {
//     console.log(
//       `${req.method} ${req.originalUrl} - ${new Date().toISOString()}`
//     );
//     next();
//   });
// }

if (process.env.NODE_ENV === "development"){
  app.use(morgan('dev'));
}
  // Routes
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "3D Bust Maker API is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });
app.use('/api/auth',require('./routes/auth'));
app.use('/api/projects',require('./routes/projects'))
app.use('/api/upload',uploadRoute)
app.use('/{*splat}',notFound);
app.use(errorHandler);


process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("Database connection closed");
    process.exit(0);
  });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📁 Static files: /uploads`);
  console.log(`🔗 Routes registered:`);
  console.log(`   - GET /api/health`);
  console.log(`   - /api/auth`);
  console.log(`   - /api/projects`);
  console.log(`   - /api/upload`);
});