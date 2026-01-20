import { useEffect, useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import './InstanceList.css';

function InstanceList({ instances, onLaunch, onStop, onDelete, onEdit, onCreate, onContextMenu, isLoading, runningInstances = [] }) {
  const [logoMap, setLogoMap] = useState({});
  
  // Create a stable key that only changes when logos actually change
  const logoKey = useMemo(() => {
    return instances.map(i => `${i.id}:${i.logo_filename || 'default'}`).join(',');
  }, [instances]);
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPlaytime = (seconds) => {
    if (!seconds || seconds === 0) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleContainerContextMenu = (e) => {
    // Right-click on empty area
    if (e.target.classList.contains('instance-list') || e.target.classList.contains('instances-grid')) {
      e.preventDefault();
      onContextMenu(e, null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadLogos = async () => {
      try {
        if (!instances || instances.length === 0) {
          setLogoMap({});
          return;
        }
        const baseDir = await invoke('get_data_directory');
        const entries = await Promise.all(
          instances.map(async (instance) => {
            const filename = instance.logo_filename || 'minecraft_logo.png';
            const logoPath = await join(baseDir, 'instance_logos', filename);
            return [instance.id, convertFileSrc(logoPath)];
          })
        );
        if (!cancelled) {
          setLogoMap(Object.fromEntries(entries));
        }
      } catch (error) {
        console.error('Failed to load instance logos:', error);
      }
    };

    loadLogos();

    return () => {
      cancelled = true;
    };
    // logoKey captures only id+logo_filename changes, so we don't reload on every instance update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoKey]);

  return (
    <div className="instance-list" onContextMenu={handleContainerContextMenu}>
      <div className="instance-header">
        <h1>Instances</h1>
        <button className="btn btn-primary" onClick={onCreate} disabled={isLoading}>
          + New Instance
        </button>
      </div>
      
      {instances.length === 0 ? (
        <div className="empty-state">
          <h2>No instances yet</h2>
          <p>Create your first Minecraft instance to get started.</p>
          <button className="btn btn-primary" onClick={onCreate}>
            Create Instance
          </button>
        </div>
      ) : (
        <div className="instances-grid">
          {instances.map((instance) => (
            <div 
              key={instance.id} 
              className="instance-card"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(e, instance);
              }}
            >
              <div className="instance-logo">
                {logoMap[instance.id] ? (
                  <img src={logoMap[instance.id]} alt="" />
                ) : (
                  <div className="instance-logo-fallback" />
                )}
              </div>
              <div className="instance-info">
                <div className="instance-title">
                  <h3 className="instance-name">{instance.name}</h3>
                  {instance.mod_loader && instance.mod_loader !== 'Vanilla' && (
                    <span className="loader-inline">{instance.mod_loader}</span>
                  )}
                </div>
                <div className="instance-meta">
                  <div className="meta-row">
                    <span className="version-pill">{instance.version_id}</span>
                    {formatPlaytime(instance.playtime_seconds) && (
                      <span className="time-pill">
                        <Clock className="meta-icon" size={12} />
                        {formatPlaytime(instance.playtime_seconds)}
                      </span>
                    )}
                    <span className="last-played-pill">
                      Last played: {formatDate(instance.last_played)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="instance-actions">
                {runningInstances.includes(instance.id) ? (
                  <button
                    className="btn btn-danger"
                    onClick={() => onStop(instance.id)}
                    disabled={isLoading}
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    className="btn btn-play"
                    onClick={() => onLaunch(instance.id)}
                    disabled={isLoading}
                  >
                    Play
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => onEdit(instance.id)}
                  disabled={isLoading}
                >
                  Edit
                </button>
                <button
                  className="delete-btn-standalone"
                  onClick={() => onDelete(instance.id)}
                  disabled={isLoading}
                  title="Delete instance"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstanceList;
