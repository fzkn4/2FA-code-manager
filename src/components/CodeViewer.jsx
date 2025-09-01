import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";

function CodeViewer({ code, onClose }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Silent fail for copy errors
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Code Used Successfully</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div
            style={{
              background: "#f8f9fa",
              border: "2px solid #e9ecef",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: "700",
                color: "#333",
                fontFamily: "Courier New, monospace",
                letterSpacing: "1.5px",
                marginBottom: "8px",
              }}
            >
              {code.code}
            </div>
            <div
              style={{
                fontSize: "0.95rem",
                color: "#6c757d",
                marginBottom: "4px",
              }}
            >
              {code.label}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "#adb5bd",
              }}
            >
              Used at {new Date(code.usedAt).toLocaleString()}
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <p style={{ color: "#6c757d", marginBottom: "8px" }}>
              This code has been marked as used and will be removed when you
              clean up used codes.
            </p>
          </div>

          <div
            style={{ display: "flex", gap: "8px", justifyContent: "center" }}
          >
            <button
              className="btn btn-primary"
              onClick={copyToClipboard}
              style={{ minWidth: "100px" }}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy Code
                </>
              )}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeViewer;
