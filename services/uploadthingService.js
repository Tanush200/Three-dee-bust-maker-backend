const { UTApi } = require("uploadthing/server");

class UploadThingService {
  constructor() {
    try {
      this.utapi = new UTApi();
      console.log("✅ UTApi initialized");
    } catch (error) {
      console.error("❌ UTApi initialization failed:", error);
      this.utapi = null;
    }
  }

  async uploadFile(file, metadata = {}) {
    if (!this.utapi) {
      throw new Error("UTApi not initialized");
    }

    try {
      console.log("🌐 Uploading to UploadThing via UTApi...");
      console.log("File details:", {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });

      // Read file buffer
      const fs = require("fs");
      const fileBuffer = fs.readFileSync(file.path);

      // Create File object
      const uploadFile = new File([fileBuffer], file.originalname, {
        type: file.mimetype,
      });

      // Upload to UploadThing
      const response = await this.utapi.uploadFiles([uploadFile]);
      console.log("✅ UTApi upload response:", response);

      // ✅ FIXED: Parse response correctly
      if (response && Array.isArray(response) && response.length > 0) {
        const uploadResult = response[0]; // Get first result

        if (uploadResult.data && !uploadResult.error) {
          const uploadedFile = uploadResult.data;

          return {
            success: true,
            key: uploadedFile.key,
            url: uploadedFile.ufsUrl || uploadedFile.url, // ✅ Use new ufsUrl
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type,
            fileHash: uploadedFile.fileHash,
          };
        } else {
          console.log("❌ Upload error in response:", uploadResult.error);
          throw new Error(uploadResult.error || "Upload failed");
        }
      } else {
        console.log("❌ Invalid response structure:", response);
        throw new Error("Invalid response from UploadThing");
      }
    } catch (error) {
      console.error("❌ UTApi upload error:", error);
      throw error;
    }
  }

  async deleteFile(key) {
    if (!this.utapi) {
      throw new Error("UTApi not initialized");
    }

    try {
      const response = await this.utapi.deleteFiles([key]);
      console.log("✅ File deleted from UploadThing:", key);
      return response;
    } catch (error) {
      console.error("❌ UTApi delete error:", error);
      throw error;
    }
  }
}

module.exports = new UploadThingService();
