import React, { useState } from "react";
import { X, Database, Edit3 } from "lucide-react";

function CollectionModal({ onClose, onSubmit }) {
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (collectionName.trim()) {
      onSubmit(collectionName.trim(), description.trim());
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Create New Collection</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="collectionName" className="form-label">
              Collection Name *
            </label>
            <div className="input-with-icon">
              <Database size={20} className="input-icon" />
              <input
                type="text"
                id="collectionName"
                className="form-input"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g., GitHub, AWS, Google"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description (optional)
            </label>
            <div className="input-with-icon">
              <Edit3 size={20} className="input-icon" />
              <textarea
                id="description"
                className="form-input form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Backup codes for GitHub account"
                rows="3"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!collectionName.trim()}
            >
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CollectionModal;


