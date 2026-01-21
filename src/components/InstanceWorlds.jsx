import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ConfirmModal from './ConfirmModal';
import WorldDatapacks from './WorldDatapacks';

function InstanceWorlds({ instance }) {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, world: null });
  const [selectedWorld, setSelectedWorld] = useState(null);

  useEffect(() => {
    loadWorlds();
  }, [instance.id]);

  const loadWorlds = async () => {
    try {
      const w = await invoke('get_instance_worlds', { instanceId: instance.id });
      setWorlds(w);
    } catch (error) {
      console.error('Failed to load worlds:', error);
    }
    setLoading(false);
  };

  const handleOpenFolder = async () => {
    try {
      await invoke('open_instance_folder', {
        instanceId: instance.id,
        folderType: 'saves'
      });
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleDeleteWorld = async (world) => {
    setDeleteConfirm({ show: true, world });
  };

  const confirmDelete = async () => {
    const world = deleteConfirm.world;
    setDeleteConfirm({ show: false, world: null });

    try {
      await invoke('delete_instance_world', {
        instanceId: instance.id,
        worldName: world.folder_name
      });
      await loadWorlds();
    } catch (error) {
      console.error('Failed to delete world:', error);
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

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' B';
  };

  const getGameModeIcon = (gamemode) => {
    switch (gamemode) {
      case 0: return 'Survival';
      case 1: return 'Creative';
      case 2: return 'Adventure';
      case 3: return 'Spectator';
      default: return 'Unknown Mode';
    }
  };

  if (loading) {
    return (
      <div className="worlds-tab">
        <p>Loading worlds...</p>
      </div>
    );
  }

  if (selectedWorld) {
    return (
      <WorldDatapacks
        instance={instance}
        world={selectedWorld}
        onBack={() => setSelectedWorld(null)}
      />
    );
  }

  return (
    <div className="worlds-tab">
      <div className="console-actions">
        <button className="open-btn" onClick={handleOpenFolder}>
          Open Saves Folder
        </button>
      </div>

      {worlds.length === 0 ? (
        <div className="empty-state">
          <h4>No worlds yet</h4>
          <p>Play the game to create worlds, or add existing worlds to the saves folder.</p>
        </div>
      ) : (
        worlds.map((world) => (
          <div key={world.folder_name} className="world-card">
            <div className="world-icon">
              {world.icon ? (
                <img
                  src={`data:image/png;base64,${world.icon}`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                />
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>W</span>
              )}
            </div>
            <div className="world-info">
              <h4>{world.name}</h4>
              <div className="world-meta">
                <span>{getGameModeIcon(world.game_mode)}</span>
                <span>{formatSize(world.size)}</span>
                <span>Last played: {formatDate(world.last_played)}</span>
              </div>
            </div>
            <div className="world-actions">
              <button
                className="open-btn"
                onClick={() => setSelectedWorld(world)}
                style={{ background: 'rgba(232, 156, 136, 0.1)', color: 'var(--accent)', border: '1px solid rgba(232, 156, 136, 0.2)' }}
              >
                Datapacks
              </button>
              <button className="delete-btn" onClick={() => handleDeleteWorld(world)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      <ConfirmModal
        isOpen={deleteConfirm.show}
        title="Delete World"
        message={`Are you sure you want to delete world "${deleteConfirm.world?.name}"? This cannot be undone!`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, world: null })}
      />
    </div>
  );
}

export default InstanceWorlds;
