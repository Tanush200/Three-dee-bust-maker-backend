// const mongoose = require("mongoose");

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//     console.log(`Database Name: ${conn.connection.name}`);
//     return conn

//     // Handle connection events
//     mongoose.connection.on("error", (err) => {
//       console.error("MongoDB connection error:", err);
//     });

//     mongoose.connection.on("disconnected", () => {
//       console.warn("MongoDB disconnected");
//     });

//     process.on("SIGINT", async () => {
//       await mongoose.connection.close();
//       console.log("MongoDB connection closed through app termination");
//       process.exit(0);
//     });
//   } catch (error) {
//     console.error("Error connecting to database:", error);
//     throw error
//   }
// };

// module.exports = connectDB;


const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error; 
  }
};

module.exports = connectDB;
