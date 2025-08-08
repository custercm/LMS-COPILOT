import React, { useState, useEffect } from "react";
import { MediaFile } from "../types/media";
import FileThumbnail from "./FileThumbnail";
import MediaViewer from "./MediaViewer";
import BatchOperations from "./BatchOperations";
import "./MediaFileGrid.css";

interface MediaFileGridProps {
  files: MediaFile[];
  onFileSelect?: (file: MediaFile) => void;
  onBatchOperations?: () => void;
  viewMode?: "grid" | "list";
  showBatchControls?: boolean;
  className?: string;
}

const MediaFileGrid: React.FC<MediaFileGridProps> = ({
  files,
  onFileSelect,
  onBatchOperations,
  viewMode = "grid",
  showBatchControls = true,
  className = "",
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentFile, setCurrentFile] = useState<MediaFile | null>(null);
  const [showBatchOps, setShowBatchOps] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "size" | "date" | "type">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterType, setFilterType] = useState<
    "all" | "image" | "document" | "data"
  >("all");

  useEffect(() => {
    // Reset selection when files change
    setSelectedFiles(new Set());
  }, [files]);

  const handleFileClick = (file: MediaFile) => {
    onFileSelect?.(file);
  };

  const handleFileDoubleClick = (file: MediaFile) => {
    setCurrentFile(file);
  };

  const handleFileSelection = (file: MediaFile, selected: boolean) => {
    const newSelection = new Set(selectedFiles);
    if (selected) {
      newSelection.add(file.path);
    } else {
      newSelection.delete(file.path);
    }
    setSelectedFiles(newSelection);
  };

  const handleSelectAll = () => {
    setSelectedFiles(new Set(filteredAndSortedFiles.map((f) => f.path)));
  };

  const handleSelectNone = () => {
    setSelectedFiles(new Set());
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getFilteredFiles = (): MediaFile[] => {
    if (filterType === "all") return files;

    return files.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      switch (filterType) {
        case "image":
          return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
        case "document":
          return ["pdf", "doc", "docx", "txt", "md"].includes(ext);
        case "data":
          return ["csv", "json", "xml", "xlsx"].includes(ext);
        default:
          return true;
      }
    });
  };

  const getSortedFiles = (filesToSort: MediaFile[]): MediaFile[] => {
    return [...filesToSort].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "size":
          aValue = a.size;
          bValue = b.size;
          break;
        case "date":
          aValue = a.lastModified;
          bValue = b.lastModified;
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredAndSortedFiles = getSortedFiles(getFilteredFiles());

  const renderGridView = () => (
    <div className="media-grid">
      {filteredAndSortedFiles.map((file) => (
        <div key={file.path} className="grid-item">
          <FileThumbnail
            file={file}
            size="medium"
            onClick={() => handleFileClick(file)}
            onDoubleClick={() => handleFileDoubleClick(file)}
            className={selectedFiles.has(file.path) ? "selected" : ""}
          />
          {showBatchControls && (
            <input
              type="checkbox"
              checked={selectedFiles.has(file.path)}
              onChange={(e) => handleFileSelection(file, e.target.checked)}
              className="file-selection-checkbox"
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="media-list">
      <div className="list-header">
        <div className="header-cell" onClick={() => handleSort("name")}>
          Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
        </div>
        <div className="header-cell" onClick={() => handleSort("size")}>
          Size {sortBy === "size" && (sortOrder === "asc" ? "↑" : "↓")}
        </div>
        <div className="header-cell" onClick={() => handleSort("type")}>
          Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
        </div>
        <div className="header-cell" onClick={() => handleSort("date")}>
          Modified {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
        </div>
      </div>

      {filteredAndSortedFiles.map((file) => (
        <div
          key={file.path}
          className={`list-item ${selectedFiles.has(file.path) ? "selected" : ""}`}
          onClick={() => handleFileClick(file)}
          onDoubleClick={() => handleFileDoubleClick(file)}
        >
          {showBatchControls && (
            <input
              type="checkbox"
              checked={selectedFiles.has(file.path)}
              onChange={(e) => handleFileSelection(file, e.target.checked)}
              className="file-selection-checkbox"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <FileThumbnail file={file} size="small" showMetadata={false} />
          <div className="file-details">
            <div className="file-name">{file.name}</div>
            <div className="file-info">
              <span className="file-size">{formatFileSize(file.size)}</span>
              <span className="file-type">{file.type}</span>
              <span className="file-date">
                {new Date(file.lastModified).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className={`media-file-grid ${className}`}>
      <div className="grid-controls">
        <div className="view-controls">
          <button
            className={`view-button ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => {}}
            title="Grid view"
          >
            ⊞
          </button>
          <button
            className={`view-button ${viewMode === "list" ? "active" : ""}`}
            onClick={() => {}}
            title="List view"
          >
            ☰
          </button>
        </div>

        <div className="filter-controls">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="data">Data Files</option>
          </select>
        </div>

        {showBatchControls && (
          <div className="batch-controls">
            <span className="selection-count">
              {selectedFiles.size} of {filteredAndSortedFiles.length} selected
            </span>
            <button onClick={handleSelectAll} className="select-button">
              Select All
            </button>
            <button onClick={handleSelectNone} className="select-button">
              Select None
            </button>
            <button
              onClick={() => setShowBatchOps(true)}
              disabled={selectedFiles.size === 0}
              className="batch-button"
            >
              Batch Operations
            </button>
          </div>
        )}
      </div>

      <div className="file-count">
        {filteredAndSortedFiles.length} files
        {filterType !== "all" && ` (${filterType})`}
      </div>

      <div className="grid-content">
        {viewMode === "grid" ? renderGridView() : renderListView()}
      </div>

      {filteredAndSortedFiles.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No files found</h3>
          <p>Try adjusting your filter or add some files to this directory.</p>
        </div>
      )}

      {currentFile && (
        <MediaViewer
          file={currentFile}
          onClose={() => setCurrentFile(null)}
          onConvert={(from, to) => {
            console.log(`Convert ${currentFile.name} from ${from} to ${to}`);
          }}
          onAnalyze={() => {
            console.log(`Analyze ${currentFile.name}`);
          }}
        />
      )}

      {showBatchOps && selectedFiles.size > 0 && (
        <BatchOperations
          files={filteredAndSortedFiles.filter((f) =>
            selectedFiles.has(f.path),
          )}
          onClose={() => setShowBatchOps(false)}
          onOperationComplete={(operation) => {
            console.log("Batch operation completed:", operation);
            setShowBatchOps(false);
          }}
        />
      )}
    </div>
  );
};

export default MediaFileGrid;
