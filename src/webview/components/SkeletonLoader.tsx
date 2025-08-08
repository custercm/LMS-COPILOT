import React from "react";
import "../styles/SkeletonLoader.css";

interface SkeletonLoaderProps {
  variant?: "text" | "rectangular" | "circular" | "message" | "code";
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: "pulse" | "wave" | "none";
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "text",
  width,
  height,
  lines = 1,
  animation = "pulse",
  className = "",
}) => {
  const getSkeletonStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === "number" ? `${width}px` : width;
    if (height)
      style.height = typeof height === "number" ? `${height}px` : height;
    return style;
  };

  if (variant === "message") {
    return (
      <div
        className={`skeleton-loader skeleton-message ${animation} ${className}`}
      >
        <div className="skeleton-avatar" />
        <div className="skeleton-message-content">
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
          <div className="skeleton-line medium" />
        </div>
      </div>
    );
  }

  if (variant === "code") {
    return (
      <div
        className={`skeleton-loader skeleton-code ${animation} ${className}`}
      >
        <div className="skeleton-code-header">
          <div className="skeleton-line short" />
          <div className="skeleton-copy-button" />
        </div>
        <div className="skeleton-code-content">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton-code-line">
              <div className="skeleton-line-number" />
              <div
                className={`skeleton-line ${index % 3 === 0 ? "short" : index % 3 === 1 ? "medium" : ""}`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (lines > 1) {
    return (
      <div className={`skeleton-loader ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`skeleton-line ${variant} ${animation} ${
              index === lines - 1 ? "short" : ""
            }`}
            style={getSkeletonStyle()}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton-loader skeleton-${variant} ${animation} ${className}`}
      style={getSkeletonStyle()}
      aria-label="Loading content..."
      role="progressbar"
      aria-valuetext="Loading"
    />
  );
};

export default SkeletonLoader;
