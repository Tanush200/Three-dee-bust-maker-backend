// const axios = require("axios");

// async function testTripoAPI() {
//   console.log("🚀 Testing Tripo AI 3D Generation (Ultra Fast!)...\n");

//   try {
//     // Health check
//     console.log("1️⃣ Health check...");
//     const health = await axios.get("http://localhost:5012/health");
//     console.log("✅ Service:", health.data.service);
//     console.log("🔗 Connection:", health.data.connection);
//     console.log("💰 Cost:", health.data.cost);
//     console.log("⚡ Speed:", health.data.speed);
//     console.log("📝 Formats:", health.data.formats.join(", "), "\n");

//     // Generate 3D model
//     console.log("2️⃣ Starting 3D generation...");
//     const generateResponse = await axios.post(
//       "http://localhost:5012/generate",
//       {
//         image_url:
//           "https://u2tlamfarr.ufs.sh/f/K7eopDIcSMpj08LV9FZNsW7YECUZr16Q9ALlVtkze8M0xBpn",
//       }
//     );

//     console.log("✅ Generation started!");
//     console.log("🆔 Job ID:", generateResponse.data.job_id);
//     console.log("⚡ Speed:", generateResponse.data.speed);
//     console.log("⏱️ Estimated time:", generateResponse.data.estimated_time);

//     const jobId = generateResponse.data.job_id;

//     // Monitor progress (should be very fast!)
//     console.log("\n3️⃣ Monitoring progress (Tripo is ULTRA FAST!)...");

//     for (let i = 1; i <= 20; i++) {
//       console.log(`\n🔍 Check ${i}/20...`);

//       const statusResponse = await axios.get(
//         `http://localhost:5012/status/${jobId}`
//       );
//       const status = statusResponse.data.data;

//       console.log(`📊 Status: ${status.status}`);
//       console.log(`📈 Progress: ${status.progress}%`);
//       console.log(`💬 Message: ${status.message}`);

//       if (status.status === "completed") {
//         console.log("\n🎉 TRIPO AI GENERATION COMPLETED!");
//         console.log("📁 Model URL:", status.model_url);
//         console.log("📊 File size:", status.file_size, "bytes");
//         console.log("📝 Format:", status.format);
//         console.log("⚡ Speed:", status.speed);
//         console.log("🏆 Quality:", status.quality);
//         console.log("💰 Cost:", status.cost);
//         console.log("🔧 Technology:", status.technology);
//         return;
//       } else if (status.status === "failed") {
//         console.error("\n❌ FAILED:", status.error);
//         return;
//       }

//       // Tripo is usually done in 1-2 checks!
//       await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5 seconds
//     }

//     console.log("\n⏰ Test completed (may still be processing)");
//   } catch (error) {
//     console.error("❌ Test failed:", error.message);
//     if (error.code === "ECONNREFUSED") {
//       console.error("🔧 Make sure the Tripo service is running on port 5012");
//       console.error("   Run: python tripo_3d_service.py");
//     } else if (error.response?.status === 401) {
//       console.error("🔑 API key authentication failed");
//       console.error(
//         "   Get a free API key from: https://platform.tripo3d.ai/api-keys"
//       );
//     } else {
//       console.error(
//         "Error details:",
//         error.response?.data || "No additional details"
//       );
//     }
//   }
// }

// testTripoAPI();


const axios = require("axios");

async function testTripoAPI() {
  console.log("🚀 Testing Tripo AI 3D Generation (Ultra Fast!)...\n");

  try {
    // Health check with better error handling
    console.log("1️⃣ Health check...");
    const health = await axios.get("http://localhost:5012/health");

    console.log("✅ Service:", health.data.service || "Unknown");
    console.log("🔗 Connection:", health.data.connection || "Unknown");
    console.log("💰 Cost:", health.data.cost || "Unknown");
    console.log("⚡ Speed:", health.data.speed || "Unknown");

    // Safe handling of formats array
    if (health.data.formats && Array.isArray(health.data.formats)) {
      console.log("📝 Formats:", health.data.formats.join(", "));
    } else {
      console.log("📝 Formats: Not specified");
    }

    // Check connection status
    if (health.data.status !== "healthy") {
      console.log("⚠️ Warning: Service status is not healthy");
      console.log("   Connection issue:", health.data.connection);

      // Continue anyway for testing
      console.log("   Continuing with test anyway...\n");
    } else {
      console.log("✅ Service is healthy\n");
    }

    // Generate 3D model
    console.log("2️⃣ Starting 3D generation...");
    const generateResponse = await axios.post(
      "http://localhost:5012/generate",
      {
        image_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop&crop=face",
      }
    );

    console.log("✅ Generation started!");
    console.log("🆔 Job ID:", generateResponse.data.job_id);
    console.log(
      "⏱️ Estimated time:",
      generateResponse.data.estimated_time || "Unknown"
    );
    console.log("🏢 Provider:", generateResponse.data.provider || "Unknown");

    const jobId = generateResponse.data.job_id;

    // Monitor progress
    console.log("\n3️⃣ Monitoring progress (Tripo is ULTRA FAST!)...");

    for (let i = 1; i <= 30; i++) {
      console.log(`\n🔍 Check ${i}/30...`);

      try {
        const statusResponse = await axios.get(
          `http://localhost:5012/status/${jobId}`
        );
        const status = statusResponse.data.data;

        console.log(`📊 Status: ${status.status || "unknown"}`);
        console.log(`📈 Progress: ${status.progress || 0}%`);
        console.log(`💬 Message: ${status.message || "No message"}`);

        if (status.status === "completed") {
          console.log("\n🎉 TRIPO AI GENERATION COMPLETED!");
          console.log("📁 Model URL:", status.model_url || "Not provided");
          console.log(
            "📊 File size:",
            status.file_size ? `${status.file_size} bytes` : "Unknown"
          );
          console.log("📝 Format:", status.format || "Unknown");
          console.log("🏢 Provider:", status.provider || "Unknown");
          console.log("🔧 Technology:", status.technology || "Not specified");

          if (status.completed_at) {
            console.log("⏰ Completed at:", status.completed_at);
          }

          return;
        } else if (status.status === "failed") {
          console.error("\n❌ FAILED:", status.error || "Unknown error");
          return;
        }

        // Wait before next check
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (statusError) {
        console.error(`❌ Status check ${i} failed:`, statusError.message);

        if (i >= 5) {
          // Stop after 5 failed attempts
          console.error("Too many status check failures, stopping test");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    console.log("\n⏰ Test completed (may still be processing)");
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("🔧 Service connection failed:");
      console.error(
        "   1. Make sure the Tripo service is running on port 5012"
      );
      console.error("   2. Run: python tripo_3d_service.py");
      console.error("   3. Check if the service started without errors");
    } else if (error.response?.status === 401) {
      console.error("🔑 Authentication failed:");
      console.error("   1. API key authentication failed");
      console.error(
        "   2. Get a valid API key from: https://platform.tripo3d.ai/api-keys"
      );
      console.error("   3. Update YOUR_TRIPO_API_KEY in tripo_3d_service.py");
    } else if (error.response?.status === 400) {
      console.error("🔧 Bad request error:");
      console.error("   1. Check API payload format");
      console.error("   2. Verify image URL is accessible");
      console.error("   Response:", error.response?.data);
    } else {
      console.error(
        "Error details:",
        error.response?.data || "No additional details"
      );

      if (error.response?.status) {
        console.error("HTTP Status:", error.response.status);
      }
    }
  }
}

testTripoAPI();
