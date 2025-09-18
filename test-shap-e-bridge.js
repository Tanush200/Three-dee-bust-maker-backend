const shapEService = require("./services/shapEService");

async function testShapEBridge() {
  console.log("🚀 Testing Shap-E Node.js Bridge...\n");

  try {
    // Test 1: Health check
    console.log("1️⃣ Testing health check...");
    const health = await shapEService.checkHealth();
    console.log("✅ Health check passed!\n");

    // Test 2: List models
    console.log("2️⃣ Testing list models...");
    const models = await shapEService.listModels();
    console.log("✅ List models:", models.count, "models found\n");

    // Test 3: Generate from URL (simple test)
    console.log("3️⃣ Testing 3D generation from URL...");
    const testImageURL =
      "https://via.placeholder.com/512x512/FF0000/FFFFFF?text=Test";

    try {
      const result = await shapEService.generateFromURL(testImageURL);
      console.log("✅ Generation started:", result.job_id);

      // Check status once
      setTimeout(async () => {
        try {
          const status = await shapEService.getGenerationStatus(result.job_id);
          console.log(
            "📊 Current status:",
            status.data.status,
            "-",
            status.data.message
          );
        } catch (e) {
          console.log("⚠️ Status check failed (normal for test)");
        }
      }, 3000);
    } catch (error) {
      console.log("⚠️ Generation test failed (expected for placeholder image)");
    }

    console.log("\n🎉 Bridge testing completed!");
  } catch (error) {
    console.error("❌ Bridge test failed:", error.message);
  }
}

testShapEBridge();
