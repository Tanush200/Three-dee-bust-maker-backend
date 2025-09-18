const axios = require("axios");

async function testWorking() {
  console.log("Testing Working 3D Service...");

  try {
    const health = await axios.get("http://localhost:5004/health");
    console.log("Health check passed:", health.data.service);

    const response = await axios.post("http://localhost:5004/generate", {
      image_url:
        "https://u2tlamfarr.ufs.sh/f/K7eopDIcSMpjWzfuimXio0tl6uKW39TIZvh521afNC4UQLBO",
    });

    console.log("Generation started:", response.data.job_id);

    const jobId = response.data.job_id;
    for (let i = 1; i <= 8; i++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const status = await axios.get(`http://localhost:5004/status/${jobId}`);
      const data = status.data.data;
      console.log(`Status: ${data.status} - ${data.progress}%`);

      if (data.status === "completed") {
        console.log("COMPLETED! File:", data.model_url);
        console.log("Vertices:", data.vertices);
        console.log("File size:", data.file_size);
        break;
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testWorking();
