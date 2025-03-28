import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useParams } from "react-router-dom";

function DataInput() {
  const { sourceId } = useParams(); // Get sourceId from URL params
  const [selectedSource, setSelectedSource] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceData, setSourceData] = useState(null);

  const dataSources = [
    "Thera Stripe Balance Changes",
    "Thera Stripe Incoming Transactions",
    "Thera Ledger Transactions",
    "Thera Ledger Accounts",
  ];

  // Only fetch if we have a sourceId
  useEffect(() => {
    if (sourceId) {
      fetchSourceData();
    }
  }, [sourceId]);

  const fetchSourceData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/sources/${sourceId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch source data");
      }
      const data = await response.json();
      setSourceData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles.filter(
      (file) => file.type === "text/csv" || file.type === "application/json"
    );
    if (validFiles.length === 0) {
      setError("Only CSV or JSON files are allowed");
      return;
    }
    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    setError(null);
  }, []);

  const handleUpload = async () => {
    if (!selectedSource) {
      setError("Please select a data source");
      return;
    }

    if (files.length === 0) {
      setError("Please select one or more files");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      for (const file of files) {
        console.log(`Uploading file: ${file.name}`); // Debug log

        const formData = new FormData();
        formData.append("file", file);
        formData.append("source", selectedSource);

        console.log(
          `Making request to: ${process.env.REACT_APP_API_URL}/api/upload`
        ); // Debug log

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/upload`,
          {
            method: "POST",
            body: formData,
            headers: {
              "x-api-key":
                "9f8a24bcfb9d4c8e97f6c4c7e2ac9ed7d64fbd3d2ad1f1ef68e8a58273f5b649",
            },
            credentials: "include", // Add this if your backend expects credentials
          }
        );

        console.log("Response status:", response.status); // Debug log

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText); // Debug log

          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData?.message ||
              `Error uploading ${file.name} (${response.status})`
          );
        }

        const responseData = await response.json();
        console.log("Upload successful:", responseData); // Debug log
      }

      await fetchSourceData();
      setFiles([]);
      alert("Files uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/reconcile`,
        {
          method: "POST",
        }
      );

      const data = await response.json(); // Always try to parse JSON first
      console.log("Raw reconciliation response:", data);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to perform reconciliation"
        );
      }

      // Check if we have the expected data structure
      if (data.started_matches && data.succeeded_matches) {
        const message =
          `Reconciliation completed successfully!\n\n` +
          `Started Matches:\n` +
          `- Matched: ${data.started_matches.match}\n` +
          `- Stripe Only: ${data.started_matches.stripe_only}\n\n` +
          `Succeeded Matches:\n` +
          `- Matched: ${data.succeeded_matches.match}\n` +
          `- Stripe Only: ${data.succeeded_matches.stripe_only}`;

        alert(message);
      } else {
        console.warn("Unexpected response structure:", data);
        alert("Reconciliation completed but response format was unexpected.");
      }

      // Refresh source data after successful reconciliation
      await fetchSourceData();
    } catch (error) {
      console.error("Error performing reconciliation:", error);
      alert(error.message || "Failed to perform reconciliation");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/json": [".json"],
    },
    disabled: !selectedSource,
  });

  return (
    <div className="data-input">
      {/* Back button */}
      <button onClick={() => window.history.back()} className="back-btn">
        ← Back to Sources
      </button>

      <h2>Upload Data Files</h2>

      <div className="input-container">
        {/* Data Source Selection */}
        <div className="source-selection">
          <h3>Select Data Source</h3>
          <div className="source-grid">
            {dataSources.map((source) => (
              <button
                key={source}
                className={`source-button ${
                  selectedSource === source ? "selected" : ""
                }`}
                onClick={() => setSelectedSource(source)}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone - only enabled after source selection */}
        <div
          {...getRootProps()}
          className={`dropzone ${!selectedSource ? "disabled" : ""}`}
        >
          <input {...getInputProps()} />
          {!selectedSource ? (
            <p>Please select a data source first</p>
          ) : (
            <>
              <p>Drag files here or click to select</p>
              <small>CSV or JSON files only</small>
            </>
          )}
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="file-list-container">
            <h3>Selected Files</h3>
            <ul className="file-list">
              {files.map((file, index) => (
                <li key={index} className="file-item">
                  <span>{file.name}</span>
                  <span className="file-size">
                    {Math.round(file.size / 1024)} KB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={loading || files.length === 0 || !selectedSource}
          className="submit-btn"
        >
          {loading ? "Uploading..." : "Upload Files"}
        </button>

        {/* Add Reconcile button after the upload button */}
        <button
          onClick={handleReconcile}
          disabled={loading}
          className="reconcile-btn"
        >
          {loading ? "Processing..." : "Reconcile Data"}
        </button>

        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        {/* Associated files table */}
        {sourceData?.file_urls && sourceData.file_urls.length > 0 && (
          <div className="files-table">
            <h3>Associated Files</h3>
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Upload Date</th>
                </tr>
              </thead>
              <tbody>
                {sourceData.file_urls.map((file, index) => (
                  <tr key={index}>
                    <td>{file.name}</td>
                    <td>{file.type}</td>
                    <td>{Math.round(file.size / 1024)} KB</td>
                    <td>{new Date(file.uploaded_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataInput;
