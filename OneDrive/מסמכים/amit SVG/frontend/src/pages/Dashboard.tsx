import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getDesigns, deleteDesign, DesignListItem } from "../api/designs";
import "./Dashboard.css";

function Dashboard() {
  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Designs list states
  const [designs, setDesigns] = useState<DesignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Fetch designs on mount and listen for uploads
  useEffect(() => {
    fetchDesigns();

    const handleUpload = () => {
      fetchDesigns();
    };

    window.addEventListener("designUploaded", handleUpload);
    const interval = setInterval(fetchDesigns, 5000);

    return () => {
      window.removeEventListener("designUploaded", handleUpload);
      clearInterval(interval);
    };
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const data = await getDesigns();
      setDesigns(data);
      setListError(null);
    } catch (err: any) {
      console.error("Fetch designs error:", err);
      let errorMessage = err.message || "Failed to fetch designs";

      // Check for network errors
      if (
        err.message &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError") ||
          err.name === "TypeError")
      ) {
        errorMessage =
          "Network error: Cannot connect to the server. Make sure the backend server is running on http://localhost:8888";
      }

      setListError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith(".svg")) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(
          () => reject(new Error("Upload timeout: Request took too long")),
          30000
        );
      });

      const uploadPromise = fetch("http://localhost:8888/upload", {
        method: "POST",
        body: formData,
      });

      const response = await Promise.race([uploadPromise, timeoutPromise]);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(
          errorData.error || `Upload failed with status ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setFile(null);
        window.dispatchEvent(new Event("designUploaded"));
        fetchDesigns();
      } else if (data.error) {
        setError(data.error);
        setSuccess(false);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      let errorMessage =
        err.message || "Failed to upload file. Please try again.";

      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("took too long")
      ) {
        errorMessage =
          "Upload timeout: The server is not responding. Please check if the backend server is running on port 8888.";
      } else if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("network")
      ) {
        errorMessage =
          "Network error: Cannot connect to the server. Make sure the backend server is running on http://localhost:8888";
      }

      setError(errorMessage);
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleRowClick = (id: string) => {
    navigate(`/design/${id}`);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(designs.map((d) => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string
  ) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (e.target.checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one item to delete");
      return;
    }

    const count = selectedIds.size;
    if (
      !window.confirm(
        `Are you sure you want to delete ${count} item${count > 1 ? "s" : ""}?`
      )
    ) {
      return;
    }

    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteDesign(id)));
      setSelectedIds(new Set());
      fetchDesigns();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const allSelected = designs.length > 0 && selectedIds.size === designs.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="dashboard">
      {/* Upload Section */}
      <section className="upload-section">
        <div className="upload-card">
          <div className="upload-header">
            <h2>Upload SVG</h2>
            <p>Select an SVG file to upload and analyze</p>
          </div>

          <div className="upload-content">
            <div className="file-input-wrapper">
              <label htmlFor="svg-file" className="file-label">
                <div className="file-label-content">
                  <div className="icon-wrapper">
                    <svg
                      className="file-icon"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <span className="file-label-text">
                    {file ? file.name : "Choose SVG File"}
                  </span>
                  {file && (
                    <span className="file-size">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  )}
                </div>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="svg-file"
                accept=".svg"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>File uploaded successfully!</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="upload-button"
            >
              {uploading ? (
                <>
                  <svg
                    className="spinner"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      strokeDasharray="60"
                      strokeDashoffset="30"
                    />
                  </svg>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Designs List Section */}
      <section className="designs-section">
        <div className="designs-header">
          <h2>Saved Designs</h2>
          {someSelected && (
            <button
              className="delete-selected-btn"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading">Loading designs...</div>
          </div>
        ) : listError ? (
          <div className="error-state">
            <div className="error">Error: {listError}</div>
          </div>
        ) : designs.length === 0 ? (
          <div className="empty-state">
            <p>No designs saved. Upload an SVG file to get started.</p>
          </div>
        ) : (
          <div className="designs-table-wrapper">
            <table className="designs-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                  <th>Filename</th>
                  <th>Status</th>
                  <th>Items Count</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {designs.map((design) => (
                  <tr
                    key={design.id}
                    onClick={() => handleRowClick(design.id)}
                    className={`table-row ${
                      selectedIds.has(design.id) ? "selected" : ""
                    }`}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(design.id)}
                        onChange={(e) => handleSelectOne(e, design.id)}
                      />
                    </td>
                    <td>{design.filename}</td>
                    <td>
                      <span
                        className={`status-badge status-${design.status.toLowerCase()}`}
                      >
                        {design.status}
                      </span>
                    </td>
                    <td>{design.itemsCount}</td>
                    <td>{formatDate(design.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
