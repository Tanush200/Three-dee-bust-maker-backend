const { aimlBustService } = require("./services/shapEService");

async function testAIMLService() {
  console.log("🚀 Testing AIML Service from shapEService.js...\n");

  try {
    // Health check
    console.log("1️⃣ Health check...");
    const health = await aimlBustService.checkHealth();
    console.log("✅ Service:", health.service);
    console.log("🤖 Model:", health.model);
    console.log("⏱️ Time:", health.estimated_time, "\n");

    // Generate and wait
    console.log("2️⃣ Starting complete generation workflow...");
    const imageURL =
      "https://u2tlamfarr.ufs.sh/f/K7eopDIcSMpj08LV9FZNsW7YECUZr16Q9ALlVtkze8M0xBpn";

    const result = await aimlBustService.generateAndWait(imageURL);

    console.log("\n🎉 AIML SERVICE GENERATION COMPLETED!");
    console.log("🆔 Job ID:", result.jobId);
    console.log("📁 Model URL:", result.modelUrl);
    console.log("🌐 Download URL:", result.downloadUrl);
    console.log("📝 Format:", result.fileFormat);
    console.log("📊 File Size:", result.fileSize, "bytes");
  } catch (error) {
    console.error("❌ AIML Service test failed:", error.message);
  }
}

testAIMLService();
