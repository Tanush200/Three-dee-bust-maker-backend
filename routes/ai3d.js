const express = require("express");
const router = express.Router();
const ai3dService = require("../services/ai3dService");
const path = require("path");
const fs = require("fs");


// Add this route for testing
router.get("/test-service", async (req, res) => {
  try {
    console.log("🧪 Testing AI service directly...");
    
    const result = await ai3dService.generateBustFromImage(
      "https://example.com/test.jpg", 
      { quality: "medium" }
    );
    
    console.log("🧪 Test result:", result);
    
    res.json({
      success: true,
      message: "AI service test completed",
      result: result
    });
  } catch (error) {
    console.error("🧪 Test failed:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Generate 3D model from image
router.post("/generate", async (req, res) => {
  try {
    const { imageUrl, options = {} } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Image URL is required",
      });
    }

    console.log("🎯 AI 3D generation request:", { imageUrl, options });

    const result = await ai3dService.generateBustFromImage(imageUrl, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ AI generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Download generated model
router.get("/download/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, "../generated_models", filename);

    console.log("📥 Download request for:", filename);
    console.log("📁 Looking for file at:", filepath);

    if (!fs.existsSync(filepath)) {
      console.log("❌ File not found:", filepath);
      return res.status(404).json({
        success: false,
        error: "Model not found",
      });
    }

    console.log("✅ File found, sending:", filename);

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.sendFile(path.resolve(filepath));
  } catch (error) {
    console.error("❌ Download error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
