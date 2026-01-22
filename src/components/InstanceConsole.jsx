import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

function InstanceConsole({ instance, onInstanceUpdated, onShowNotification, clearOnMount }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(instance.console_auto_update || false);
  const consoleRef = useRef(null);

  useEffect(() => {
    setAutoUpdate(instance.console_auto_update || false);
  }, [instance.console_auto_update]);

  // ----------
  // Clear logs on mount if requested
  // Description: When launching, clears old logs instantly for a fresh start
  // ----------
  useEffect(() => {
    if (clearOnMount) {
      setLogs([]);
    }
    loadLogs(true);
  }, [instance.id, clearOnMount]);

  useEffect(() => {
    if (!autoUpdate) return;
    const interval = setInterval(() => {
      loadLogs(false);
    }, 2000);
    return () => clearInterval(interval);
  }, [autoUpdate, instance.id]);

  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const loadLogs = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const logContent = await invoke('get_instance_log', { instanceId: instance.id });
      if (logContent) {
        const lines = logContent.split('\n').map((line, index) => ({
          id: index,
          text: line,
          type: getLineType(line)
        }));
        setLogs(lines);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
    if (showLoading) setLoading(false);
  };

  const getLineType = (line) => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('[error]') || lowerLine.includes('exception') || lowerLine.includes('error:')) {
      return 'error';
    }
    if (lowerLine.includes('[warn]') || lowerLine.includes('warning')) {
      return 'warn';
    }
    if (lowerLine.includes('[info]')) {
      return 'info';
    }
    return '';
  };

  const handleOpenLogsFolder = async () => {
    try {
      await invoke('open_instance_folder', {
        instanceId: instance.id,
        folderType: 'logs'
      });
    } catch (error) {
      console.error('Failed to open folder:', error); if (onShowNotification) {
        onShowNotification(`Failed to open logs folder: ${error}`, 'error');
      }
    }
  };

  const handleAutoUpdateChange = async (checked) => {
    setAutoUpdate(checked);
    try {
      const updatedInstance = { ...instance, console_auto_update: checked };
      await invoke('update_instance', { instance: updatedInstance });
      if (onInstanceUpdated) onInstanceUpdated(updatedInstance);
    } catch (error) {
      console.error('Failed to update console setting:', error);
    }
  };

  const handleRefresh = () => {
    loadLogs(true);
  };

  const handleClear = () => {
    setLogs([]);
  };

  if (loading) {
    return (
      <div className="console-tab">
        <p>Loading logs...</p>
      </div>
    );
  }

  return (
    <div className="console-tab">
      <div className="console-actions">
        <button className="open-btn" onClick={handleRefresh}>
          Refresh
        </button>
        <button className="open-btn" onClick={handleClear}>
          Clear
        </button>
        <button className="open-btn" onClick={handleOpenLogsFolder}>
          Open Logs Folder
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(e) => handleAutoUpdateChange(e.target.checked)}
            />
            Auto-update
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
        </div>
      </div>

      <div className="console-output" ref={consoleRef}>
        {logs.length === 0 ? (
          <div className="no-logs">
            No logs available. Launch the game to see console output.
          </div>
        ) : (
          logs.map((line) => (
            <div key={line.id} className={`log-line ${line.type}`}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InstanceConsole;
