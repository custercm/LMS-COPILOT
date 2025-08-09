import React, { useState, useEffect } from 'react';
import { ConversationMetadata } from '../../storage/ConversationStorage';
import { useConversationManager } from '../hooks/useConversationManager';
import './ConversationSidebar.css';

interface ConversationSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  storage?: any; // Will be properly typed when integrated
}

interface ConversationItemProps {
  conversation: ConversationMetadata;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      onRename(conversation.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={() => !isEditing && onSelect(conversation.id)}
    >
      <div className="conversation-header">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyPress}
            autoFocus
            className="conversation-title-input"
          />
        ) : (
          <h3 className="conversation-title" title={conversation.title}>
            {conversation.title}
          </h3>
        )}
        
        <div className="conversation-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="action-btn rename-btn"
            title="Rename conversation"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete conversation "${conversation.title}"?`)) {
                onDelete(conversation.id);
              }
            }}
            className="action-btn delete-btn"
            title="Delete conversation"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="conversation-preview">
        <p className="last-message">{conversation.lastMessage}</p>
        <div className="conversation-meta">
          <span className="message-count">{conversation.messageCount} messages</span>
          <span className="last-updated">
            {new Date(conversation.lastUpdated).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  isVisible,
  onToggle,
  storage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ConversationMetadata[] | null>(null);

  const {
    conversations,
    isLoading,
    error,
    loadConversations,
    searchConversations,
    createNewConversation,
    switchToConversation,
    deleteConversation,
    updateConversationTitle,
    clearError
  } = useConversationManager({
    storage,
    enablePersistence: true,
  });

  // Load conversations on mount
  useEffect(() => {
    if (isVisible && storage && loadConversations) {
      loadConversations();
    }
  }, [isVisible, storage, loadConversations]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      if (searchConversations && typeof searchConversations === 'function') {
        const results = await searchConversations(query);
        setSearchResults(results);
      }
    } catch (err) {
      console.warn('Search failed:', err);
      setSearchResults([]);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      if (switchToConversation && typeof switchToConversation === 'function') {
        await switchToConversation(conversationId);
      }
    } catch (err) {
      console.error('Failed to switch conversation:', err);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      if (deleteConversation && typeof deleteConversation === 'function') {
        await deleteConversation(conversationId);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      if (updateConversationTitle && typeof updateConversationTitle === 'function') {
        await updateConversationTitle(conversationId, newTitle);
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleNewConversation = async () => {
    try {
      if (createNewConversation && typeof createNewConversation === 'function') {
        await createNewConversation();
      }
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const displayConversations = searchResults !== null ? (searchResults || []) : (conversations || []);

  if (!isVisible) {
    return (
      <div className="sidebar-toggle">
        <button onClick={onToggle} className="toggle-btn" title="Show conversations">
          📋
        </button>
      </div>
    );
  }

  return (
    <div className="conversation-sidebar">
      <div className="sidebar-header">
        <h2>Conversations</h2>
        <div className="header-actions">
          <button onClick={handleNewConversation} className="new-conversation-btn" title="New conversation">
            ➕
          </button>
          <button onClick={onToggle} className="close-btn" title="Hide sidebar">
            ✖️
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={clearError} className="dismiss-error">×</button>
        </div>
      )}

      <div className="conversation-list">
        {isLoading ? (
          <div className="loading">Loading conversations...</div>
        ) : (!displayConversations || displayConversations.length === 0) ? (
          <div className="empty-state">
            {searchQuery ? 'No conversations match your search.' : 'No conversations yet. Start a new one!'}
          </div>
        ) : (
          (displayConversations || []).map((conversation: ConversationMetadata) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.isActive}
              onSelect={handleSelectConversation}
              onDelete={handleDeleteConversation}
              onRename={handleRenameConversation}
            />
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="conversation-stats">
          {(conversations || []).length} conversation{(conversations || []).length !== 1 ? 's' : ''}
        </div>
        <button onClick={loadConversations && typeof loadConversations === 'function' ? loadConversations : () => {}} className="refresh-btn" title="Refresh conversations">
          🔄
        </button>
      </div>
    </div>
  );
};

export default ConversationSidebar;
