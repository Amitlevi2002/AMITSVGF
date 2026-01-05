import { Request, Response } from "express";
import Design from "../models/Design";
import { parseSvg } from "../utils/svgParser";
import path from "path";
import mongoose from "mongoose";
import fs from "fs";

export const uploadDesign = async (
  req: Request,
  res: Response
): Promise<void> => {
  let design: any = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const filePath = req.file.path;
    const filename = req.file.originalname;
    // Store only the filename for the filePath field (relative to uploads directory)
    const filePathForDb = req.file.filename;

    console.log(`[uploadDesign] ✅ File received: ${filename}`);
    console.log(`[uploadDesign] 📁 Saved to: ${filePath}`);

    // Check MongoDB connection - wait for connection if not ready
    let isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      console.warn(
        `[uploadDesign] ⚠️ MongoDB not connected, attempting to connect...`
      );

      // Try to connect if not connected
      if (mongoose.connection.readyState === 0) {
        try {
          const MONGODB_URI =
            process.env.MONGODB_URI || "mongodb://localhost:27017/svg-designs";
          await mongoose.connect(MONGODB_URI);
          isConnected = true;
          console.log(`[uploadDesign] ✅ Connected to MongoDB`);
        } catch (connectError: any) {
          console.error(
            `[uploadDesign] ❌ Failed to connect to MongoDB:`,
            connectError.message
          );
          return res.status(503).json({
            error:
              "Database connection failed. Please ensure MongoDB is running.",
            details: connectError.message,
          });
        }
      } else {
        // Connection is in progress, wait a bit
        await new Promise((resolve) => setTimeout(resolve, 1000));
        isConnected = mongoose.connection.readyState === 1;

        if (!isConnected) {
          return res.status(503).json({
            error:
              "Database connection not ready. Please try again in a moment.",
          });
        }
      }
    }

    // Create Design document with status="PENDING"
    design = new Design({
      filename: filename,
      filePath: filePathForDb,
      status: "PENDING",
      svgWidth: 0,
      svgHeight: 0,
      items: [],
      itemsCount: 0,
      coverageRatio: 0,
      issues: [],
    });

    try {
    await design.save();
      console.log(
        `[uploadDesign] ✅ Created Design document with ID: ${design._id}`
      );
    } catch (dbError: any) {
      console.error(`[uploadDesign] ❌ Database save error:`, dbError);
      return res.status(500).json({
        error: "Failed to save design to database",
        details: dbError.message,
      });
    }

    try {
      // Parse the SVG file
      console.log(`[uploadDesign] 🔍 Starting SVG parsing...`);
      const parsedData = await parseSvg(filePath);
      console.log(
        `[uploadDesign] ✅ SVG parsed: ${parsedData.itemsCount} items found`
      );

      // Update Design with parsed fields
      if (design) {
      design.svgWidth = parsedData.svgWidth;
      design.svgHeight = parsedData.svgHeight;
      design.items = parsedData.items;
      design.itemsCount = parsedData.itemsCount;
      design.coverageRatio = parsedData.coverageRatio;
      design.issues = parsedData.issues;
      design.status = "PROCESSED";

        try {
      await design.save();
          console.log(`[uploadDesign] ✅ Design updated and saved to MongoDB`);
        } catch (saveError: any) {
          console.error(
            `[uploadDesign] ❌ Failed to save to database:`,
            saveError.message
          );
          return res.status(500).json({
            error: "Failed to save parsed data to database",
            details: saveError.message,
          });
        }
      }

      res.json({
        success: true,
        design: {
          id: design?._id || "unknown",
          filename: filename,
          status: "PROCESSED",
          itemsCount: parsedData.itemsCount,
          coverageRatio: parsedData.coverageRatio,
          issues: parsedData.issues,
        },
      });
    } catch (parseError: any) {
      console.error(`[uploadDesign] ❌ SVG parsing error:`, parseError);
      
      // Set status to ERROR if parsing fails
      if (design) {
        try {
      design.status = "ERROR";
      await design.save();
        } catch (saveError) {
          // Ignore save errors
        }
      }

      res.status(500).json({
        error: "Failed to parse SVG file",
        details: parseError.message,
      });
    }
  } catch (error: any) {
    console.error("[uploadDesign] ❌ Unexpected error:", error);
    res.status(500).json({
      error: error.message || "Failed to upload design",
    });
  }
};

export const getDesigns = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return res.status(503).json({
        error: "Database not connected",
        designs: [],
      });
    }

    const designs = await Design.find()
      .select("filename status createdAt itemsCount coverageRatio issues")
      .sort({ createdAt: -1 })
      .lean();

    const designsList = designs.map((design) => ({
      id: design._id,
      filename: design.filename,
      status: design.status,
      itemsCount: design.itemsCount,
      coverageRatio: design.coverageRatio,
      issues: design.issues,
      createdAt: design.createdAt,
    }));

    res.json(designsList);
  } catch (error: any) {
    console.error("Get designs error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch designs" });
  }
};

export const getDesignById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return res.status(503).json({
        error: "Database not connected",
      });
    }

    const { id } = req.params;
    const design = await Design.findById(id);

    if (!design) {
      res.status(404).json({ error: "Design not found" });
      return;
    }

    res.json({
      id: design._id,
      filename: design.filename,
      filePath: design.filePath,
      status: design.status,
      createdAt: design.createdAt,
      svgWidth: design.svgWidth,
      svgHeight: design.svgHeight,
      items: design.items,
      itemsCount: design.itemsCount,
      coverageRatio: design.coverageRatio,
      issues: design.issues,
    });
  } catch (error: any) {
    console.error("Get design error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch design" });
  }
};

export const deleteDesign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      res.status(503).json({
        error: "Database not connected",
      });
      return;
    }

    const { id } = req.params;
    const design = await Design.findByIdAndDelete(id);

    if (!design) {
      res.status(404).json({ error: "Design not found" });
      return;
    }

    // Delete the physical file
    if (design.filePath) {
      const filePath = path.join(process.cwd(), "uploads", design.filePath);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`[deleteDesign] Failed to delete file ${filePath}:`, err);
        } else {
          console.log(`[deleteDesign] Successfully deleted file: ${filePath}`);
        }
      });
    }

    res.status(200).json({ message: "Design deleted successfully" });
  } catch (error: any) {
    console.error("Delete design error:", error);
    res.status(500).json({ error: error.message || "Failed to delete design" });
  }
};
