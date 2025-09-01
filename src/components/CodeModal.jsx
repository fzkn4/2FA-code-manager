import React, { useState } from "react";
import { X } from "lucide-react";

function CodeModal({ onClose, onSubmit, collectionName }) {
  const [codesText, setCodesText] = useState("");
  const [label, setLabel] = useState("2FA Code");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Parse codes from textarea - split by new lines and filter out empty lines
    const parsedCodes = codesText
      .split("\n")
      .map((code) => code.trim())
      .filter((code) => code.length > 0);

    if (parsedCodes.length > 0) {
      onSubmit(parsedCodes, label.trim() || "2FA Code");
    }
  };

  return (
    <div className="modal modal-right">
      <div className="modal-content modal-content-right">
        <div className="modal-header">
          <h3 className="modal-title">Add Codes to "{collectionName}"</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-split">
          <div className="modal-form-section">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="label" className="form-label">
                  Code Label (optional)
                </label>
                <input
                  type="text"
                  id="label"
                  className="form-input"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Backup Codes, Recovery Keys"
                />
              </div>

              <div className="form-group">
                <label htmlFor="codes" className="form-label">
                  2FA Codes (one per line)
                </label>
                <textarea
                  id="codes"
                  className="form-input form-textarea"
                  value={codesText}
                  onChange={(e) => setCodesText(e.target.value)}
                  placeholder="Enter your 2FA codes here, one per line:&#10;1710 1917&#10;0232 4747&#10;3766 5567"
                  rows={6}
                  style={{ fontFamily: "monospace" }}
                />
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "0.85rem",
                    color: "#a0a0a0",
                    fontStyle: "italic",
                  }}
                >
                  Enter one code per line. You can paste multiple codes at once.
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!codesText.trim()}
                >
                  Add{" "}
                  {codesText.split("\n").filter((code) => code.trim()).length}{" "}
                  Code
                  {codesText.split("\n").filter((code) => code.trim())
                    .length !== 1
                    ? "s"
                    : ""}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeModal;
