const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");


dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());


async function startServer() {
  try {
    await connectDB();
    const User = require("./models/User");
    const Project = require("./models/Project");
    const File = require("./models/File");


    app.get("/api/test", async (req, res) => {
      try {
        const userCount = await User.countDocuments();
        const projectCount = await Project.countDocuments();
        const fileCount = await File.countDocuments();

        res.json({
          message: "3D Bust Maker API - Database Connected",
          database: {
            users: userCount,
            projects: projectCount,
            files: fileCount,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: "Database connection test failed",
          details: error.message,
        });
      }
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}


startServer();
