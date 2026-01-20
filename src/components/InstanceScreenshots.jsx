import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ConfirmModal from './ConfirmModal';

function InstanceScreenshots({ instance }) {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, screenshot: null });

  useEffect(() => {
    loadScreenshots();
  }, [instance.id]);

  const loadScreenshots = async () => {
    try {
      const ss = await invoke('get_instance_screenshots', { instanceId: instance.id });
      setScreenshots(ss);
    } catch (error) {
      console.error('Failed to load screenshots:', error);
    }
    setLoading(false);
  };

  const handleOpenFolder = async () => {
    try {
      await invoke('open_instance_folder', { 
        instanceId: instance.id,
        folderType: 'screenshots'
      });
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleDelete = async (screenshot) => {
    setDeleteConfirm({ show: true, screenshot });
  };

  const confirmDelete = async () => {
    const screenshot = deleteConfirm.screenshot;
    setDeleteConfirm({ show: false, screenshot: null });
    
    try {
      await invoke('delete_instance_screenshot', { 
        instanceId: instance.id, 
        filename: screenshot.filename 
      });
      await loadScreenshots();
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="screenshots-tab">
        <p>Loading screenshots...</p>
      </div>
    );
  }

  return (
    <div className="screenshots-tab">
      <div className="console-actions">
        <button className="open-btn" onClick={handleOpenFolder}>
          Open Screenshots Folder
        </button>
      </div>

      {screenshots.length === 0 ? (
        <div className="empty-state">
          <h4>No screenshots yet</h4>
          <p>Press F2 in-game to take screenshots.</p>
        </div>
      ) : (
        <div className="screenshots-grid">
          {screenshots.map((ss) => (
            <div key={ss.filename} className="screenshot-card">
              <img 
                src={ss.path} 
                alt={ss.filename}
                className="screenshot-image"
                onClick={() => setSelectedImage(ss)}
              />
              <div className="screenshot-info">
                <span>{formatDate(ss.created)}</span>
                <button className="delete-btn" onClick={() => handleDelete(ss)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div 
          className="screenshot-modal"
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
        >
          <img 
            src={selectedImage.path} 
            alt={selectedImage.filename}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.show}
        title="Delete Screenshot"
        message={`Are you sure you want to delete "${deleteConfirm.screenshot?.filename}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, screenshot: null })}
      />
    </div>
  );
}

export default InstanceScreenshots;
