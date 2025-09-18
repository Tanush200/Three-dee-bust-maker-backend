const axios = require("axios");

async function testSimplePointE() {
  console.log("🚀 Testing Simple Point-E (Text-to-3D)...\n");

  try {
    // Health check
    console.log("1️⃣ Health check...");
    const health = await axios.get("http://localhost:5002/health");
    console.log("✅ Service:", health.data.service);
    console.log("📝 Input type:", health.data.input_type);
    console.log("💰 Cost:", health.data.cost, "\n");

    // Generate from text prompt
    console.log("2️⃣ Generating 3D bust from text...");
    const generateResponse = await axios.post(
      "http://localhost:5002/generate-text",
      {
        text_prompt:
          "a detailed human head bust sculpture, realistic face, portrait",
      }
    );

    console.log("✅ Generation started!");
    console.log("🆔 Job ID:", generateResponse.data.job_id);
    console.log("📝 Prompt:", generateResponse.data.text_prompt);

    const jobId = generateResponse.data.job_id;

    // Monitor progress
    console.log("\n3️⃣ Monitoring progress...");

    for (let i = 1; i <= 18; i++) {
      console.log(`\n🔍 Check ${i}/18...`);

      const statusResponse = await axios.get(
        `http://localhost:5002/status/${jobId}`
      );
      const status = statusResponse.data.data;

      console.log(`📊 Status: ${status.status}`);
      console.log(`📈 Progress: ${status.progress}%`);
      console.log(`💬 Message: ${status.message}`);

      if (status.status === "completed") {
        console.log("\n🎉 TEXT-TO-3D COMPLETED!");
        console.log("📁 Model URL:", status.model_url);
        console.log("📊 Points:", status.points);
        console.log("🔄 Method:", status.method);
        console.log("💰 Cost:", status.cost);
        return;
      } else if (status.status === "failed") {
        console.error("\n❌ FAILED:", status.error);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log("\n⏰ Test completed");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(
      "Error details:",
      error.response?.data || "No additional details"
    );
  }
}

testSimplePointE();
