import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import designRoutes from "./routes/designRoutes";
import { upload } from "./middleware/upload";
import { uploadDesign } from "./controllers/designController";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8888;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/svg-designs";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from localhost on any port (for development)
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static SVG files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use("/api/designs", designRoutes);

// Direct upload route with error handling
// Accept file under the key "file"
app.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err: any) => {
      if (err) {
        console.error("[server] Multer error:", err);
        return res
          .status(400)
          .json({ error: err.message || "File upload failed" });
      }
      next();
    });
  },
  uploadDesign
);

// Health check with detailed status
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  
  res.json({ 
    status: "ok",
    server: "running",
    port: PORT,
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Start server immediately, connect to MongoDB in background
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Upload route available at http://localhost:${PORT}/upload`);
  console.log(`✅ CORS enabled for ${CORS_ORIGIN}`);

  // Connect to MongoDB in background (non-blocking)
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB");
      console.log(`✅ Database: ${MONGODB_URI}`);
    })
    .catch((error) => {
      console.error(
        "❌ MongoDB connection error:",
        error.message
      );
      console.log("⚠️ Server is running but uploads will fail until MongoDB is connected");
      console.log("💡 To fix: Start MongoDB service or check connection string");
      console.log(`💡 Connection string: ${MONGODB_URI}`);
    });
});
