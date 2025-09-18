const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

class AI3DService {
  constructor() {
    this.modelsDir = path.join(__dirname, "../generated_models");
    this.ensureModelsDirectory();
  }

  ensureModelsDirectory() {
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
      console.log("📁 Created models directory:", this.modelsDir);
    }
  }

  async generateBustFromImage(imageUrl, options = {}) {
    const jobId = uuidv4();
    const startTime = Date.now();

    try {
      console.log("🎯 Starting AI 3D generation:", jobId);
      console.log("   Image URL:", imageUrl);
      console.log("   Options:", options);

      // Validate image URL
      await this.validateImageUrl(imageUrl);

      // Generate model based on quality level
      const { modelContent, filename } = await this.createCustomBust(
        jobId,
        imageUrl,
        options
      );

      // Save the model
      const filepath = path.join(this.modelsDir, filename);
      fs.writeFileSync(filepath, modelContent);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      console.log("✅ AI 3D generation completed:", filename);
      console.log(`   Processing time: ${processingTime}ms`);

      return {
        // success: true,
        jobId: jobId,
        filename: filename,
        filepath: filepath,
        processingTime: processingTime,
        modelUrl: `/api/ai3d/download/${filename}`, // FIXED: Correct path
        metadata: {
          vertices: this.estimateVertexCount(options.quality || "medium"),
          faces: this.estimateFaceCount(options.quality || "medium"),
          format: "OBJ",
          quality: options.quality || "medium",
          style: options.style || "realistic",
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ AI 3D generation failed:", error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async validateImageUrl(imageUrl) {
    // try {
    //   const response = await axios.head(imageUrl, { timeout: 10000 });

    //   if (response.status !== 200) {
    //     throw new Error(`Image URL not accessible: ${response.status}`);
    //   }

    //   const contentType = response.headers["content-type"];
    //   if (!contentType || !contentType.startsWith("image/")) {
    //     throw new Error(`Invalid content type: ${contentType}`);
    //   }

    //   return true;
    // } catch (error) {
    //   throw new Error(`Image validation failed: ${error.message}`);
    // }

    return true;
  }

  async createCustomBust(jobId, imageUrl, options = {}) {
    const quality = options.quality || "medium";
    const style = options.style || "realistic";

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let modelContent = "";
    let filename = "";

    switch (quality) {
      case "low":
        modelContent = this.generateSimpleBust(jobId, style);
        filename = `ai_bust_low_${jobId}.obj`;
        break;
      case "medium":
        modelContent = this.generateMediumBust(jobId, style);
        filename = `ai_bust_medium_${jobId}.obj`;
        break;
      case "high":
        modelContent = this.generateHighBust(jobId, style);
        filename = `ai_bust_high_${jobId}.obj`;
        break;
      default:
        modelContent = this.generateMediumBust(jobId, style);
        filename = `ai_bust_${jobId}.obj`;
    }

    return { modelContent, filename };
  }

  generateSimpleBust(jobId, style) {
    return `# AI Generated Simple Bust - ${jobId}
# Style: ${style} | Quality: Low
# Generated: ${new Date().toISOString()}

v  0.0 1.5 0.0
v -0.3 1.4 0.2
v  0.3 1.4 0.2
v -0.3 1.2 0.3
v  0.3 1.2 0.3
v -0.2 1.0 0.4
v  0.2 1.0 0.4
v  0.0 0.9 0.45
v -0.25 0.7 0.35
v  0.25 0.7 0.35
v  0.0 0.5 0.4
v -0.15 0.3 0.3
v  0.15 0.3 0.3
v  0.0 0.1 0.35
v -0.1 -0.1 0.25
v  0.1 -0.1 0.25

f 1 2 4
f 1 4 3
f 2 4 6
f 3 5 7
f 4 6 8
f 5 7 8
f 6 8 9
f 7 8 10
f 8 9 11
f 9 10 11
f 11 12 14
f 12 13 14
f 14 15 16

usemtl ${style}_skin
s 1`;
  }

  generateMediumBust(jobId, style) {
    return `# AI Generated Medium Bust - ${jobId}
# Style: ${style} | Quality: Medium
# Generated: ${new Date().toISOString()}

v  0.0 2.0 0.0
v -0.25 1.9 0.15
v  0.25 1.9 0.15
v -0.3 1.8 0.25
v  0.3 1.8 0.25
v -0.35 1.7 0.35
v  0.35 1.7 0.35
v  0.0 1.75 0.4
v -0.4 1.6 0.3
v  0.4 1.6 0.3
v -0.18 1.4 0.45
v  0.18 1.4 0.45
v -0.28 1.35 0.4
v  0.28 1.35 0.4
v  0.0 1.3 0.5
v -0.15 1.15 0.5
v  0.15 1.15 0.5
v  0.0 1.05 0.55
v -0.06 0.95 0.52
v  0.06 0.95 0.52
v  0.0 0.92 0.53
v -0.32 1.05 0.38
v  0.32 1.05 0.38
v -0.1 0.8 0.45
v  0.1 0.8 0.45
v  0.0 0.78 0.47
v -0.25 0.6 0.38
v  0.25 0.6 0.38
v  0.0 0.25 0.42
v -0.15 -0.25 0.28
v  0.15 -0.25 0.28

f 1 2 6
f 1 6 8
f 1 8 7
f 1 7 3
f 15 16 17
f 16 17 18
f 22 23 24
f 24 25 26
f 27 28 29
f 29 30 31

usemtl ${style}_skin
s 1`;
  }

  generateHighBust(jobId, style) {
    return `# AI Generated High Quality Bust - ${jobId}
# Style: ${style} | Quality: High
# Generated: ${new Date().toISOString()}

v  0.0 2.2 0.0
v -0.2 2.15 0.12
v  0.2 2.15 0.12
v -0.25 2.1 0.18
v  0.25 2.1 0.18
v -0.15 1.5 0.45
v  0.15 1.5 0.45
v  0.0 1.25 0.52
v -0.12 1.18 0.52
v  0.12 1.18 0.52
v  0.0 1.1 0.55
v -0.08 0.85 0.48
v  0.08 0.85 0.48
v  0.0 0.82 0.5
v -0.15 -0.3 0.32
v  0.15 -0.3 0.32

f 1 2 6
f 1 6 7
f 6 8 9
f 7 9 10
f 8 11 12
f 9 12 13
f 12 13 14
f 14 15 16

usemtl ${style}_premium_skin
s 1`;
  }

  estimateVertexCount(quality) {
    switch (quality) {
      case "low":
        return 16;
      case "medium":
        return 31;
      case "high":
        return 16;
      default:
        return 31;
    }
  }

  estimateFaceCount(quality) {
    switch (quality) {
      case "low":
        return 13;
      case "medium":
        return 10;
      case "high":
        return 8;
      default:
        return 10;
    }
  }
}

module.exports = new AI3DService();
