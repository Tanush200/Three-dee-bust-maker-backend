const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const { errorHandler, notFound } = require("./middleware/errorHandler");

dotenv.config();

const app = express();

connectDB();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://your-domain.com"
        : "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(
      `${req.method} ${req.originalUrl} - ${new Date().toISOString()}`
    );
    next();
  });
}

// Routes
app.get('/api/health',(req,res) => {
    res.status(200).json({
      success: true,
      message: "3D Bust Maker API is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
})
app.use('/api/auth',require('./routes/auth'));
app.use('/api/projects',require('./routes/projects'))
app.use('/{*splat}',notFound);
app.use(errorHandler)


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