import React from "react";
import { parseMessageContent } from "../utils/messageParser";
import {
  extractFileReferences,
  hasFileReferences,
} from "../utils/fileReferenceParser";
import CodeBlock from "./CodeBlock";
import DiffViewer from "./DiffViewer";
import FileReference from "./FileReference";
import { ChatMessage } from "../types/messages";
import { FileReference as FileReferenceType } from "../types/api";

interface MessageItemProps {
  message: ChatMessage;
  onOpenFile?: (filePath: string, lineNumber?: number) => void;
  onPreviewFile?: (filePath: string) => Promise<string>;
  onContextMenu?: (event: React.MouseEvent) => void;
  // Add new prop for media file handling
  onHandleMediaOperation?: (
    filePath: string,
    operation: "preview" | "convert" | "metadata",
  ) => void;
}

function MessageItem({
  message,
  onOpenFile,
  onPreviewFile,
  onContextMenu,
  onHandleMediaOperation,
}: MessageItemProps) {
  // Render content with file references
  const renderContentWithFileReferences = (content: string) => {
    const fileReferences = extractFileReferences(content);

    if (fileReferences.length === 0) {
      return (
        <span
          dangerouslySetInnerHTML={{ __html: parseMessageContent(content) }}
        />
      );
    }

    // Split content by file references and render with FileReference components
    let parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let currentContent = content;

    fileReferences.forEach((ref, index) => {
      const fullPath = ref.line ? `${ref.path}:${ref.line}` : ref.path;
      const refIndex = currentContent.indexOf(fullPath, lastIndex);

      if (refIndex !== -1) {
        // Add content before the file reference
        if (refIndex > lastIndex) {
          const beforeContent = currentContent.substring(lastIndex, refIndex);
          parts.push(
            <span
              key={`text-${index}`}
              dangerouslySetInnerHTML={{
                __html: parseMessageContent(beforeContent),
              }}
            />,
          );
        }

        // Add the file reference component
        parts.push(
          <FileReference
            key={`file-ref-${index}`}
            reference={ref}
            onOpenFile={onOpenFile}
            onPreviewFile={onPreviewFile}
          />,
        );

        lastIndex = refIndex + fullPath.length;
      }
    });

    // Add remaining content after last file reference
    if (lastIndex < currentContent.length) {
      const remainingContent = currentContent.substring(lastIndex);
      parts.push(
        <span
          key="text-end"
          dangerouslySetInnerHTML={{
            __html: parseMessageContent(remainingContent),
          }}
        />,
      );
    }

    return <span>{parts}</span>;
  };

  const extractFilePaths = (content: string): string[] => {
    // Legacy function - now using extractFileReferences instead
    return extractFileReferences(content).map((ref) => ref.path);
  };

  const hasCodeBlocks = (content: string): boolean => {
    // Check if the content includes code blocks
    return /```([\s\S]*?)```/.test(content);
  };

  const renderContent = () => {
    if (!message.content) return null;

    // If it's a media file response, handle accordingly
    if (message.content.includes("media_file")) {
      try {
        const parsedContent = JSON.parse(message.content);

        if (parsedContent.type === "image") {
          return (
            <div className="media-content">
              <h4>Image Preview</h4>
              <img
                src={parsedContent.data}
                alt={`Thumbnail of ${parsedContent.fileName}`}
                className="thumbnail"
                onClick={() =>
                  onHandleMediaOperation &&
                  onHandleMediaOperation(parsedContent.filePath, "preview")
                }
              />
            </div>
          );
        } else if (
          parsedContent.type === "pdf" ||
          parsedContent.type === "csv"
        ) {
          return (
            <div className="media-content">
              <h4>File Analysis</h4>
              <p>{parsedContent.content}</p>
              {parsedContent.summary && (
                <div className="file-summary">
                  <p>
                    Rows: {parsedContent.summary.rowCount}, Columns:{" "}
                    {parsedContent.summary.columnCount}
                  </p>
                  <button
                    onClick={() =>
                      onHandleMediaOperation &&
                      onHandleMediaOperation(parsedContent.filePath, "convert")
                    }
                    className="action-button"
                  >
                    Convert to Text/JSON
                  </button>
                </div>
              )}
            </div>
          );
        }
      } catch (e) {
        // If it's not valid JSON, treat as regular markdown content
      }
    }

    // Render code blocks if present
    const hasCode = hasCodeBlocks(message.content);
    if (hasCode) {
      // Extract code blocks from content
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const matches = [...message.content.matchAll(codeBlockRegex)];

      return (
        <div className="message-content">
          {renderContentWithFileReferences(message.content)}
          {matches.map((match, index) => (
            <CodeBlock
              key={index}
              code={match[2] || ""}
              language={match[1] || "text"}
              onApplyChange={undefined}
              changeId={undefined}
            />
          ))}
        </div>
      );
    }

    // Render regular markdown content with file references
    return (
      <div className="message-content">
        {renderContentWithFileReferences(message.content)}
      </div>
    );
  };

  // Extract file paths from the message content
  const filePaths = extractFilePaths(message.content);

  return (
    <div
      className={`message-item ${message.role} interactive-element`}
      onContextMenu={onContextMenu}
    >
      {renderContent()}

      {/* File References Section */}
      {message.fileReferences && message.fileReferences.length > 0 && (
        <div className="file-references-section">
          <div className="file-references-header">
            <span
              className="file-references-icon"
              role="img"
              aria-hidden="true"
            >
              📁
            </span>
            <span className="file-references-title">Referenced Files</span>
          </div>
          <div className="file-references-list">
            {message.fileReferences.map((ref, index) => (
              <FileReference
                key={`msg-ref-${index}`}
                reference={ref}
                onOpenFile={onOpenFile}
                onPreviewFile={onPreviewFile}
                className="file-reference-compact"
              />
            ))}
          </div>
        </div>
      )}

      {/* Add action buttons for media files */}
      {filePaths.length > 0 && onHandleMediaOperation && (
        <div className="media-actions">
          {filePaths.map((filePath, index) => (
            <button
              key={index}
              onClick={() => onHandleMediaOperation(filePath, "metadata")}
              className="action-button"
            >
              View Metadata
            </button>
          ))}
        </div>
      )}

      {/* Add diff viewer if it's a file change */}
      {message.content.includes("diff") && (
        <DiffViewer originalContent={message.content} proposedContent="" />
      )}
    </div>
  );
}

export default MessageItem;
