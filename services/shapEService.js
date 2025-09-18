const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

class ShapEService {
  constructor() {
    this.baseURL = "http://127.0.0.1:5001";
    this.timeout = 300000; // 5 minutes timeout for 3D generation
  }

  // Health check
  async checkHealth() {
    try {
      console.log("🔍 Checking Shap-E service health...");
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });

      console.log("✅ Shap-E service health:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Shap-E service health check failed:", error.message);
      throw new Error("Shap-E service unavailable");
    }
  }

  // Generate 3D model from uploaded image
  async generateFromFile(filePath, options = {}) {
    try {
      console.log("🎨 Starting 3D generation from file:", filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append("image", fs.createReadStream(filePath));

      // Add options
      if (options.guidance_scale) {
        formData.append("guidance_scale", options.guidance_scale);
      }

      const response = await axios.post(`${this.baseURL}/generate`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: this.timeout,
      });

      console.log("✅ 3D generation started:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ 3D generation failed:", error.message);
      throw error;
    }
  }

  // Generate 3D model from image URL
  async generateFromURL(imageURL, options = {}) {
    try {
      console.log("🎨 Starting 3D generation from URL:", imageURL);

      const payload = {
        image_url: imageURL,
        ...options,
      };

      const response = await axios.post(`${this.baseURL}/generate`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: this.timeout,
      });

      console.log("✅ 3D generation started:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ 3D generation from URL failed:", error.message);
      throw error;
    }
  }

  // Check generation status
  async getGenerationStatus(jobId) {
    try {
      const response = await axios.get(`${this.baseURL}/status/${jobId}`, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("❌ Status check failed:", error.message);
      throw error;
    }
  }

  // Download generated model
  async downloadModel(filename, savePath) {
    try {
      console.log("📥 Downloading model:", filename);

      const response = await axios.get(`${this.baseURL}/download/${filename}`, {
        responseType: "stream",
        timeout: 30000,
      });

      const writer = fs.createWriteStream(savePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log("✅ Model downloaded to:", savePath);
          resolve(savePath);
        });
        writer.on("error", reject);
      });
    } catch (error) {
      console.error("❌ Model download failed:", error.message);
      throw error;
    }
  }

  // List all generated models
  async listModels() {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("❌ List models failed:", error.message);
      throw error;
    }
  }

  // Poll generation status until completion
  async waitForCompletion(jobId, maxWaitTime = 300000) {
    // 5 minutes max
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusResponse = await this.getGenerationStatus(jobId);
        const status = statusResponse.data;

        console.log(
          `🔄 Generation status: ${status.status} - ${status.progress}% - ${status.message}`
        );

        if (status.status === "completed") {
          console.log("✅ 3D generation completed!");
          return status;
        } else if (status.status === "failed") {
          throw new Error(`Generation failed: ${status.error}`);
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error("❌ Status polling error:", error.message);
        throw error;
      }
    }

    throw new Error("Generation timeout - took longer than expected");
  }

  // Complete workflow: generate and wait for completion
  async generateAndWait(imageSource, options = {}) {
    try {
      let generationResponse;

      // Determine if imageSource is URL or file path
      if (
        imageSource.startsWith("http://") ||
        imageSource.startsWith("https://")
      ) {
        generationResponse = await this.generateFromURL(imageSource, options);
      } else {
        generationResponse = await this.generateFromFile(imageSource, options);
      }

      const jobId = generationResponse.job_id;
      console.log("🎯 Waiting for generation completion:", jobId);

      // Wait for completion
      const completedStatus = await this.waitForCompletion(jobId);

      return {
        jobId,
        status: completedStatus,
        modelUrl: completedStatus.model_url,
        downloadUrl: `${this.baseURL}${completedStatus.model_url}`,
      };
    } catch (error) {
      console.error("❌ Complete generation workflow failed:", error.message);
      throw error;
    }
  }
}


// Add Point-E support to your existing shapEService.js

class PointEService {
  constructor() {
    this.baseURL = 'http://127.0.0.1:5002';  // Point-E service port
    this.timeout = 120000; // 2 minutes timeout (much faster than Shap-E)
  }

  // Health check for Point-E
  async checkHealth() {
    try {
      console.log('🔍 Checking Point-E service health...');
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      
      console.log('✅ Point-E service health:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Point-E service health check failed:', error.message);
      throw new Error('Point-E service unavailable');
    }
  }

  // Generate 3D model from image URL using Point-E
  async generateFromURL(imageURL, options = {}) {
    try {
      console.log('🎨 Starting Point-E generation from URL:', imageURL);

      const payload = {
        image_url: imageURL,
        ...options
      };

      const response = await axios.post(`${this.baseURL}/generate`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: this.timeout
      });

      console.log('✅ Point-E generation started:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Point-E generation failed:', error.message);
      throw error;
    }
  }

  // Check generation status
  async getGenerationStatus(jobId) {
    try {
      const response = await axios.get(`${this.baseURL}/status/${jobId}`, {
        timeout: 10000
      });

      return response.data;

    } catch (error) {
      console.error('❌ Point-E status check failed:', error.message);
      throw error;
    }
  }

  // Complete workflow: generate and wait
  async generateAndWait(imageURL, options = {}) {
    try {
      const generationResponse = await this.generateFromURL(imageURL, options);
      const jobId = generationResponse.job_id;
      
      console.log('🎯 Waiting for Point-E completion:', jobId);

      // Poll for completion (Point-E is much faster)
      const maxAttempts = 24; // 2 minutes max (5 second intervals)
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const statusResponse = await this.getGenerationStatus(jobId);
        const status = statusResponse.data;

        console.log(`🔄 Point-E status (${attempt}/${maxAttempts}): ${status.status} - ${status.progress}%`);

        if (status.status === 'completed') {
          console.log('✅ Point-E generation completed!');
          return {
            jobId,
            status: status,
            modelUrl: status.model_url,
            downloadUrl: `${this.baseURL}${status.model_url}`
          };
        } else if (status.status === 'failed') {
          throw new Error(`Point-E generation failed: ${status.error}`);
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error('Point-E generation timeout');

    } catch (error) {
      console.error('❌ Point-E complete workflow failed:', error.message);
      throw error;
    }
  }
}
class AIMLBustService {
  constructor() {
    this.baseURL = "http://127.0.0.1:5004";
    this.timeout = 120000; // 2 minutes timeout
  }

  async checkHealth() {
    try {
      console.log("🔍 Checking AIML API service health...");
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });

      console.log("✅ AIML API service health:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ AIML API service health check failed:", error.message);
      throw new Error("AIML API service unavailable");
    }
  }

  async generateFromURL(imageURL, options = {}) {
    try {
      console.log("🎨 Starting AIML API generation from URL:", imageURL);

      const payload = {
        image_url: imageURL,
        ...options,
      };

      const response = await axios.post(`${this.baseURL}/generate`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: this.timeout,
      });

      console.log("✅ AIML API generation started:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ AIML API generation failed:", error.message);
      throw error;
    }
  }

  async getGenerationStatus(jobId) {
    try {
      const response = await axios.get(`${this.baseURL}/status/${jobId}`, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("❌ AIML API status check failed:", error.message);
      throw error;
    }
  }

  async generateAndWait(imageURL, options = {}) {
    try {
      const generationResponse = await this.generateFromURL(imageURL, options);
      const jobId = generationResponse.job_id;

      console.log("🎯 Waiting for AIML API completion:", jobId);

      // Poll for completion
      const maxAttempts = 30; // 5 minutes max (10 second intervals)

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const statusResponse = await this.getGenerationStatus(jobId);
        const status = statusResponse.data;

        console.log(
          `🔄 AIML API status (${attempt}/${maxAttempts}): ${status.status} - ${status.progress}%`
        );

        if (status.status === "completed") {
          console.log("✅ AIML API generation completed!");
          return {
            jobId,
            status: status,
            modelUrl: status.model_url,
            downloadUrl: `${this.baseURL}${status.model_url}`,
            fileFormat: status.format,
            fileSize: status.file_size,
          };
        } else if (status.status === "failed") {
          throw new Error(`AIML API generation failed: ${status.error}`);
        }

        // Wait 10 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      throw new Error("AIML API generation timeout");
    } catch (error) {
      console.error("❌ AIML API complete workflow failed:", error.message);
      throw error;
    }
  }
}


class MeshyBustService {
  constructor() {
    this.baseURL = "http://127.0.0.1:5009";
    this.timeout = 300000; // 5 minutes timeout for 3D generation
  }

  async checkHealth() {
    try {
      console.log("🔍 Checking Meshy.ai service health...");
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });

      console.log("✅ Meshy.ai service health:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Meshy.ai service health check failed:", error.message);
      throw new Error("Meshy.ai service unavailable");
    }
  }

  async generateFromURL(imageURL, options = {}) {
    try {
      console.log("🎨 Starting Meshy.ai generation from URL:", imageURL);

      const payload = {
        image_url: imageURL,
        ...options,
      };

      const response = await axios.post(`${this.baseURL}/generate`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: this.timeout,
      });

      console.log("✅ Meshy.ai generation started:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Meshy.ai generation failed:", error.message);
      throw error;
    }
  }

  async getGenerationStatus(jobId) {
    try {
      const response = await axios.get(`${this.baseURL}/status/${jobId}`, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("❌ Meshy.ai status check failed:", error.message);
      throw error;
    }
  }

  async generateAndWait(imageURL, options = {}) {
    try {
      const generationResponse = await this.generateFromURL(imageURL, options);
      const jobId = generationResponse.job_id;

      console.log("🎯 Waiting for Meshy.ai completion:", jobId);

      // Poll for completion
      const maxAttempts = 50; // 8+ minutes max (10 second intervals)

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const statusResponse = await this.getGenerationStatus(jobId);
        const status = statusResponse.data;

        console.log(
          `🔄 Meshy.ai status (${attempt}/${maxAttempts}): ${status.status} - ${status.progress}%`
        );

        if (status.status === "completed") {
          console.log("✅ Meshy.ai generation completed!");
          return {
            jobId,
            status: status,
            modelUrl: status.model_url,
            downloadUrl: `${this.baseURL}${status.model_url}`,
            fileFormat: status.format,
            fileSize: status.file_size,
            polycount: status.polycount,
          };
        } else if (status.status === "failed") {
          throw new Error(`Meshy.ai generation failed: ${status.error}`);
        }

        // Wait 10 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      throw new Error("Meshy.ai generation timeout");
    } catch (error) {
      console.error("❌ Meshy.ai complete workflow failed:", error.message);
      throw error;
    }
  }
}
class TripoBustService {
  constructor() {
    this.baseURL = "http://127.0.0.1:5012";
    this.timeout = 120000; // 2 minutes (but usually done in 10 seconds!)
  }

  async checkHealth() {
    try {
      console.log("🔍 Checking Tripo AI service health...");
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });

      console.log("✅ Tripo AI service health:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Tripo AI service health check failed:", error.message);
      throw new Error("Tripo AI service unavailable");
    }
  }

  async generateAndWait(imageURL, options = {}) {
    try {
      const generationResponse = await this.generateFromURL(imageURL, options);
      const jobId = generationResponse.job_id;

      console.log("🎯 Waiting for Tripo AI completion (ultra fast!):", jobId);

      // Poll for completion (Tripo is usually done in 10-30 seconds!)
      const maxAttempts = 20;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const statusResponse = await this.getGenerationStatus(jobId);
        const status = statusResponse.data;

        console.log(
          `🔄 Tripo AI status (${attempt}/${maxAttempts}): ${status.status} - ${status.progress}%`
        );

        if (status.status === "completed") {
          console.log("✅ Tripo AI generation completed!");
          return {
            jobId,
            status: status,
            modelUrl: status.model_url,
            downloadUrl: `${this.baseURL}${status.model_url}`,
            fileFormat: status.format,
            fileSize: status.file_size,
            speed: status.speed,
          };
        } else if (status.status === "failed") {
          throw new Error(`Tripo AI generation failed: ${status.error}`);
        }

        // Check every 5 seconds (Tripo is very fast)
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      throw new Error("Tripo AI generation timeout");
    } catch (error) {
      console.error("❌ Tripo AI complete workflow failed:", error.message);
      throw error;
    }
  }

  async generateFromURL(imageURL, options = {}) {
    try {
      console.log("🎨 Starting Tripo AI generation from URL:", imageURL);

      const payload = {
        image_url: imageURL,
        ...options,
      };

      const response = await axios.post(`${this.baseURL}/generate`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: this.timeout,
      });

      console.log("✅ Tripo AI generation started:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Tripo AI generation failed:", error.message);
      throw error;
    }
  }

  async getGenerationStatus(jobId) {
    try {
      const response = await axios.get(`${this.baseURL}/status/${jobId}`, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("❌ Tripo AI status check failed:", error.message);
      throw error;
    }
  }
}

// Export both services
module.exports = {
  shapEService: new ShapEService(),
  pointEService: new PointEService(),
  aimlBustService: new AIMLBustService(),
  meshyBustService: new MeshyBustService(),
  tripoBustService: new TripoBustService(),
};



