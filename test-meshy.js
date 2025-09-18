const axios = require("axios");

async function testMeshyAPI() {
  console.log("🚀 Testing Meshy.ai 3D Generation...\n");

  try {
    // Health check
    console.log("1️⃣ Health check...");
    const health = await axios.get("http://localhost:5009/health");
    console.log("✅ Service:", health.data.service);
    console.log("🔗 Connection:", health.data.connection);
    console.log("💰 Cost:", health.data.cost);
    console.log("📝 Formats:", health.data.formats.join(", "), "\n");

    // Generate 3D model
    console.log("2️⃣ Starting 3D generation...");
    const generateResponse = await axios.post(
      "http://localhost:5009/generate",
      {
        image_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop&crop=face",
      }
    );

    console.log("✅ Generation started!");
    console.log("🆔 Job ID:", generateResponse.data.job_id);
    console.log("⏱️ Estimated time:", generateResponse.data.estimated_time);

    const jobId = generateResponse.data.job_id;

    // Monitor progress
    console.log("\n3️⃣ Monitoring progress...");

    for (let i = 1; i <= 50; i++) {
      console.log(`\n🔍 Check ${i}/50...`);

      const statusResponse = await axios.get(
        `http://localhost:5009/status/${jobId}`
      );
      const status = statusResponse.data.data;

      console.log(`📊 Status: ${status.status}`);
      console.log(`📈 Progress: ${status.progress}%`);
      console.log(`💬 Message: ${status.message}`);

      if (status.status === "completed") {
        console.log("\n🎉 MESHY.AI GENERATION COMPLETED!");
        console.log("📁 Model URL:", status.model_url);
        console.log("📊 File size:", status.file_size, "bytes");
        console.log("📝 Format:", status.format);
        console.log("🎯 Polycount:", status.polycount);
        console.log("🏆 Quality:", status.quality);
        console.log("💰 Cost:", status.cost);
        return;
      } else if (status.status === "failed") {
        console.error("\n❌ FAILED:", status.error);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    console.log("\n⏰ Test completed (may still be processing)");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(
      "Error details:",
      error.response?.data || "No additional details"
    );
  }
}

testMeshyAPI();
