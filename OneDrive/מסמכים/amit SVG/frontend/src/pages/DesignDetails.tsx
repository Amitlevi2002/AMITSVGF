import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DesignDetails as DesignDetailsType,
  getDesignById,
} from "../api/designs";
import "./DesignDetails.css";

function DesignDetails() {
  const { id } = useParams<{ id: string }>();
  const [design, setDesign] = useState<DesignDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [hoveredItem, setHoveredItem] = useState<{
    item: DesignDetailsType["items"][0];
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchDesign(id);
    }
  }, [id]);

  useEffect(() => {
    // Draw overlay when SVG content or design changes
    if (design && svgContent && canvasRef.current && svgContainerRef.current) {
      // Wait for SVG to render in DOM
      const timer = setTimeout(() => {
        const svgElement = svgContainerRef.current?.querySelector("svg");
        if (svgElement) {
          console.log("SVG element found, drawing overlay");
          drawInteractiveOverlay(design);
        } else {
          console.warn("SVG element not found in container");
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [design, svgContent]);

  const fetchDesign = async (designId: string) => {
    try {
      setLoading(true);
      const data = await getDesignById(designId);
      setDesign(data);
      setError(null);

      // Fetch SVG content if filePath exists
      if (data.filePath) {
        try {
          const svgResponse = await fetch(
            `http://localhost:8888/uploads/${data.filePath}`
          );
          if (svgResponse.ok) {
            const svgText = await svgResponse.text();
            console.log("SVG content loaded, length:", svgText.length);
            console.log("SVG preview:", svgText.substring(0, 200));
            setSvgContent(svgText);
          } else {
            console.error("Failed to fetch SVG, status:", svgResponse.status);
          }
        } catch (svgErr) {
          console.error("Failed to fetch SVG content:", svgErr);
        }
      } else {
        console.warn("No filePath in design data");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch design");
    } finally {
      setLoading(false);
    }
  };

  const drawInteractiveOverlay = (designData: DesignDetailsType) => {
    const canvas = canvasRef.current;
    const svgContainer = svgContainerRef.current;
    if (!canvas || !svgContainer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get SVG element from container
    const svgElement = svgContainer.querySelector("svg");
    if (!svgElement) return;

    // Get actual displayed size of SVG
    const rect = svgElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!designData.items || designData.items.length === 0) {
      return;
    }

    // Calculate scale factor based on actual image display size vs SVG dimensions
    const scaleX = canvas.width / designData.svgWidth;
    const scaleY = canvas.height / designData.svgHeight;

    // Draw transparent overlay rectangles for hover detection
    designData.items.forEach((item) => {
      const x = item.x * scaleX;
      const y = item.y * scaleY;
      const width = item.width * scaleX;
      const height = item.height * scaleY;

      if (
        isNaN(x) ||
        isNaN(y) ||
        isNaN(width) ||
        isNaN(height) ||
        width <= 0 ||
        height <= 0
      ) {
        return;
      }

      // Draw transparent rectangle for hover detection
      ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Fully transparent
      ctx.fillRect(x, y, width, height);
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!design || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate scale factor based on actual canvas size vs SVG dimensions
    const scaleX = canvas.width / design.svgWidth;
    const scaleY = canvas.height / design.svgHeight;

    // Convert canvas coordinates to SVG coordinates
    const svgX = x / scaleX;
    const svgY = y / scaleY;

    // Check if cursor is inside any rectangle
    const hovered = design.items.find((item) => {
      return (
        svgX >= item.x &&
        svgX <= item.x + item.width &&
        svgY >= item.y &&
        svgY <= item.y + item.height
      );
    });

    if (hovered) {
      setHoveredItem({ item: hovered, x: e.clientX, y: e.clientY });
    } else {
      setHoveredItem(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredItem(null);
  };

  if (loading) {
    return (
      <div className="design-details">
        <div className="loading">Loading design...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="design-details">
        <div className="error">Error: {error}</div>
        <Link to="/" className="back-link">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="design-details">
        <div className="error">Design not found</div>
        <Link to="/" className="back-link">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="design-details">
      <div className="details-header">
        <Link to="/" className="back-link">
          ← Back to Dashboard
        </Link>
        <h1>{design.filename}</h1>
      </div>

      <div className="details-content">
        <div className="details-section">
          <h2>Design Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Filename:</span>
              <span className="info-value">{design.filename}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value">{design.status}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Items Count:</span>
              <span className="info-value">
                {design.itemsCount}{" "}
                {design.items && `(${design.items.length} rectangles)`}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Coverage Ratio:</span>
              <span className="info-value">
                {(design.coverageRatio * 100).toFixed(2)}%
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">SVG Dimensions:</span>
              <span className="info-value">
                {design.svgWidth} × {design.svgHeight}px
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Created At:</span>
              <span className="info-value">
                {new Date(design.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {design.issues.length > 0 && (
              <div className="info-item">
                <span className="info-label">Issues:</span>
                <span className="info-value">{design.issues.join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="details-section">
          <h2>Canvas Preview</h2>
          <div className="canvas-container">
            {svgContent ? (
              <div className="svg-preview-wrapper">
                <div
                  ref={svgContainerRef}
                  className="svg-content-container"
                  style={{
                    width: design.svgWidth ? `${design.svgWidth}px` : "auto",
                    height: design.svgHeight ? `${design.svgHeight}px` : "auto",
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
                <canvas
                  ref={canvasRef}
                  className="preview-canvas-overlay"
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                ></canvas>
                {hoveredItem && (
                  <div
                    className="tooltip"
                    style={{
                      position: "fixed",
                      left: hoveredItem.x + 10,
                      top: hoveredItem.y + 10,
                    }}
                  >
                    <div className="tooltip-content">
                      <div>
                        <strong>Rectangle Details</strong>
                      </div>
                      <div>x: {hoveredItem.item.x}</div>
                      <div>y: {hoveredItem.item.y}</div>
                      <div>width: {hoveredItem.item.width}</div>
                      <div>height: {hoveredItem.item.height}</div>
                      <div>fill: {hoveredItem.item.fill || "none"}</div>
                      {hoveredItem.item.issue && (
                        <div>issue: {hoveredItem.item.issue}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : design.filePath ? (
              <div className="no-svg-message">Loading SVG...</div>
            ) : (
              <div className="no-svg-message">SVG file not available</div>
            )}
          </div>
        </div>

        {design.items && design.items.length > 0 && (
          <div className="details-section">
            <h2>Detected Rectangles ({design.items.length})</h2>
            <div className="rects-list">
              {design.items.map((item, index) => (
                <div
                  key={index}
                  className={`rect-item ${item.issue ? "has-issue" : ""}`}
                >
                  <div className="rect-header">Rectangle {index + 1}</div>
                  <div className="rect-details">
                    <span>X: {item.x}</span>
                    <span>Y: {item.y}</span>
                    <span>Width: {item.width}</span>
                    <span>Height: {item.height}</span>
                    <span>Fill: {item.fill || "none"}</span>
                    {item.issue && (
                      <span className="rect-issue">Issue: {item.issue}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DesignDetails;
