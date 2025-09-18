const axios = require("axios");

async function testAIMLAPI() {
  console.log("🚀 Testing AIML API 3D Generation...\n");

  try {
    // Health check
    console.log("1️⃣ Health check...");
    const health = await axios.get("http://localhost:5004/health");
    console.log("✅ Service:", health.data.service);
    console.log("🤖 Model:", health.data.model);
    console.log("⏱️ Time:", health.data.estimated_time, "\n");

    // Generate 3D model
    console.log("2️⃣ Starting 3D generation...");
    const generateResponse = await axios.post(
      "http://localhost:5004/generate",
      {
        image_url:
          "https://u2tlamfarr.ufs.sh/f/K7eopDIcSMpj08LV9FZNsW7YECUZr16Q9ALlVtkze8M0xBpn",
      }
    );

    console.log("✅ Generation started!");
    console.log("🆔 Job ID:", generateResponse.data.job_id);
    console.log("🤖 Model:", generateResponse.data.model);

    const jobId = generateResponse.data.job_id;

    // Monitor progress
    console.log("\n3️⃣ Monitoring progress...");

    for (let i = 1; i <= 20; i++) {
      console.log(`\n🔍 Check ${i}/20...`);

      const statusResponse = await axios.get(
        `http://localhost:5004/status/${jobId}`
      );
      const status = statusResponse.data.data;

      console.log(`📊 Status: ${status.status}`);
      console.log(`📈 Progress: ${status.progress}%`);
      console.log(`💬 Message: ${status.message}`);

      if (status.status === "completed") {
        console.log("\n🎉 AIML API GENERATION COMPLETED!");
        console.log("📁 Model URL:", status.model_url);
        console.log("📊 File size:", status.file_size, "bytes");
        console.log("📝 Format:", status.format);
        console.log("🏆 Quality:", status.quality);
        return;
      } else if (status.status === "failed") {
        console.error("\n❌ FAILED:", status.error);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAIMLAPI();
