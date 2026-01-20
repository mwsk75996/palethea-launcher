import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

function InstanceServers({ instance }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, [instance.id]);

  const loadServers = async () => {
    try {
      const s = await invoke('get_instance_servers', { instanceId: instance.id });
      setServers(s);
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
    setLoading(false);
  };

  const handleOpenFolder = async () => {
    try {
      await invoke('open_instance_folder', { 
        instanceId: instance.id,
        folderType: 'root'
      });
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  if (loading) {
    return (
      <div className="servers-tab">
        <p>Loading servers...</p>
      </div>
    );
  }

  return (
    <div className="servers-tab">
      {servers.length === 0 ? (
        <div className="empty-state">
          <h4>No servers added</h4>
          <p>Servers you add in-game will appear here.</p>
          <p className="hint">The servers.dat file is stored in the instance folder.</p>
        </div>
      ) : (
        <div className="servers-list">
          {servers.map((server, index) => (
            <div key={index} className="server-item">
              <div className="server-icon">
                {server.icon ? (
                  <img src={`data:image/png;base64,${server.icon}`} alt="" />
                ) : (
                  <div className="default-icon">🖥️</div>
                )}
              </div>
              <div className="server-info">
                <h4>{server.name || 'Unnamed Server'}</h4>
                <span className="server-ip">{server.ip}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstanceServers;
