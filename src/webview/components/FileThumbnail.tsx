import React, { useState, useEffect, useRef } from 'react';
import { MediaFile, ThumbnailData, categorizeFile, getFileIcon } from '../types/media';
import './FileThumbnail.css';

interface FileThumbnailProps {
  file: MediaFile;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  onDoubleClick?: () => void;
  showMetadata?: boolean;
  className?: string;
}

const FileThumbnail: React.FC<FileThumbnailProps> = ({
  file,
  size = 'medium',
  onClick,
  onDoubleClick,
  showMetadata = true,
  className = ''
}) => {
  const [thumbnail, setThumbnail] = useState<ThumbnailData | null>(file.thumbnail || null);
  const [isLoading, setIsLoading] = useState(!file.thumbnail);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file.thumbnail && shouldGenerateThumbnail()) {
      generateThumbnail();
    }
  }, [file]);

  const shouldGenerateThumbnail = (): boolean => {
    const category = categorizeFile(file.type);
    return ['image', 'document', 'data'].includes(category);
  };

  const generateThumbnail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const category = categorizeFile(file.type);
      
      if (category === 'image') {
        await generateImageThumbnail();
      } else if (category === 'document') {
        await generateDocumentThumbnail();
      } else if (category === 'data') {
        await generateDataThumbnail();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate thumbnail');
    } finally {
      setIsLoading(false);
    }
  };

  const generateImageThumbnail = async () => {
    return new Promise<void>((resolve, reject) => {
      if (!file.dataUrl) {
        reject(new Error('No data URL available for image'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error('Canvas not available'));
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        const { width, height } = getThumbnailDimensions(img.width, img.height);
        
        canvas.width = width;
        canvas.height = height;

        // Clear canvas and draw image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        setThumbnail({
          dataUrl,
          width,
          height,
          quality: 0.8
        });

        resolve();
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = file.dataUrl;
    });
  };

  const generateDocumentThumbnail = async () => {
    // Generate a document preview thumbnail
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getThumbnailDimensions(210, 297); // A4 ratio
    canvas.width = width;
    canvas.height = height;

    // Draw document preview
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // Draw document icon
    ctx.fillStyle = '#666666';
    ctx.font = `${Math.min(width, height) * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📄', width / 2, height / 2);

    // Add file extension
    ctx.font = `${Math.min(width, height) * 0.15}px Arial`;
    ctx.fillStyle = '#333333';
    const extension = file.name.split('.').pop()?.toUpperCase() || '';
    ctx.fillText(extension, width / 2, height * 0.8);

    const dataUrl = canvas.toDataURL('image/png', 0.9);
    
    setThumbnail({
      dataUrl,
      width,
      height,
      quality: 0.9
    });
  };

  const generateDataThumbnail = async () => {
    // Generate a data visualization thumbnail
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getThumbnailDimensions(200, 150);
    canvas.width = width;
    canvas.height = height;

    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Draw chart-like visualization
    ctx.strokeStyle = '#007acc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const points = 8;
    const stepX = width / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = i * stepX;
      const y = height * 0.2 + Math.random() * height * 0.6;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();

    // Add data icon
    ctx.fillStyle = '#666666';
    ctx.font = `${Math.min(width, height) * 0.3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📊', width / 2, height * 0.2);

    const dataUrl = canvas.toDataURL('image/png', 0.9);
    
    setThumbnail({
      dataUrl,
      width,
      height,
      quality: 0.9
    });
  };

  const getThumbnailDimensions = (originalWidth: number, originalHeight: number) => {
    const sizeMap = {
      small: 64,
      medium: 128,
      large: 256
    };
    
    const maxSize = sizeMap[size];
    const aspectRatio = originalWidth / originalHeight;
    
    let width = maxSize;
    let height = maxSize;
    
    if (aspectRatio > 1) {
      height = maxSize / aspectRatio;
    } else {
      width = maxSize * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderThumbnailContent = () => {
    if (isLoading) {
      return (
        <div className="thumbnail-loading">
          <span className="loading-spinner">⏳</span>
        </div>
      );
    }

    if (error || !thumbnail) {
      const icon = getFileIcon(file.type, file.name);
      return (
        <div className="thumbnail-fallback">
          <span className="fallback-icon">{icon}</span>
        </div>
      );
    }

    return (
      <img
        src={thumbnail.dataUrl}
        alt={file.name}
        className="thumbnail-image"
        loading="lazy"
      />
    );
  };

  return (
    <div 
      className={`file-thumbnail ${size} ${className}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      
      <div className="thumbnail-container">
        {renderThumbnailContent()}
        
        <div className="thumbnail-overlay">
          <div className="file-extension">
            {file.name.split('.').pop()?.toUpperCase() || ''}
          </div>
        </div>
      </div>

      {showMetadata && (
        <div className="thumbnail-metadata">
          <div className="file-name" title={file.name}>
            {file.name.length > 20 ? 
              `${file.name.substring(0, 17)}...` : 
              file.name
            }
          </div>
          <div className="file-details">
            <span className="file-size">{formatFileSize(file.size)}</span>
            <span className="file-type">
              {categorizeFile(file.type)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileThumbnail;
