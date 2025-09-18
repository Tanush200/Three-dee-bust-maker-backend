const shapEService = require("./services/shapEService");
const fs = require("fs");
const path = require("path");

async function testRealImageGeneration() {
  console.log("🚀 Testing with real portrait image...\n");

  try {
    // Test with a real portrait URL
    const portraitURL =
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop&crop=face";

    console.log("🖼️ Testing with portrait image:", portraitURL);
    console.log("📋 This may take 2-3 minutes for 3D generation...\n");

    // Start generation
    const result = await shapEService.generateFromURL(portraitURL);
    console.log("✅ Generation started:", result.job_id);

    // Poll status every 5 seconds
    let attempt = 0;
    const maxAttempts = 36; // 3 minutes max

    while (attempt < maxAttempts) {
      attempt++;

      try {
        console.log(`\n🔍 Checking status (attempt ${attempt}/36)...`);
        const statusResponse = await shapEService.getGenerationStatus(
          result.job_id
        );
        const status = statusResponse.data;

        console.log(`📊 Status: ${status.status}`);
        console.log(`📈 Progress: ${status.progress}%`);
        console.log(`💬 Message: ${status.message}`);

        if (status.status === "completed") {
          console.log("\n🎉 3D Generation COMPLETED!");
          console.log("📁 Model URL:", status.model_url);
          console.log("🔢 Vertices:", status.vertices);
          console.log("🔺 Faces:", status.faces);

          // Try to download the model
          if (status.model_url) {
            const modelName = status.model_url.split("/").pop();
            const savePath = path.join(
              __dirname,
              "generated_models",
              modelName
            );

            // Create directory if it doesn't exist
            const dir = path.dirname(savePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            try {
              await shapEService.downloadModel(modelName, savePath);
              console.log("✅ Model downloaded to:", savePath);
            } catch (downloadError) {
              console.log("⚠️ Download failed:", downloadError.message);
            }
          }

          return;
        } else if (status.status === "failed") {
          console.error("\n❌ Generation FAILED!");
          console.error("Error:", status.error);
          return;
        }

        // Wait 5 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (statusError) {
        console.error("❌ Status check failed:", statusError.message);
        break;
      }
    }

    console.log("⏰ Generation timed out after 3 minutes");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testRealImageGeneration();
