import { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import './Console.css';

function Console() {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('all'); // all, info, warn, error
    const [autoScroll, setAutoScroll] = useState(true);
    const consoleRef = useRef(null);

    useEffect(() => {
        // Listen for log events from Rust backend
        const unlistenLog = listen('app-log', (event) => {
            const { level, message, timestamp } = event.payload;
            setLogs(prev => [...prev.slice(-500), { // Keep last 500 logs
                id: Date.now() + Math.random(),
                level,
                message,
                timestamp: timestamp || new Date().toISOString()
            }]);
        });

        // Listen for download progress events
        const unlistenProgress = listen('download-progress', (event) => {
            const { stage, percentage } = event.payload;
            setLogs(prev => [...prev.slice(-500), {
                id: Date.now() + Math.random(),
                level: 'info',
                message: `[Download] ${stage} (${percentage}%)`,
                timestamp: new Date().toISOString()
            }]);
        });

        // Add initial log
        setLogs([{
            id: Date.now(),
            level: 'info',
            message: 'Console initialized. Logs will appear here.',
            timestamp: new Date().toISOString()
        }]);

        return () => {
            unlistenLog.then(fn => fn());
            unlistenProgress.then(fn => fn());
        };
    }, []);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (autoScroll && consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        return log.level === filter;
    });

    const clearLogs = () => {
        setLogs([{
            id: Date.now(),
            level: 'info',
            message: 'Console cleared.',
            timestamp: new Date().toISOString()
        }]);
    };

    const exportLogs = () => {
        const logText = logs.map(log =>
            `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
        ).join('\n');

        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `palethea-logs-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const testLog = async () => {
        // Trigger a test action to generate some logs
        try {
            await invoke('get_instances');
            setLogs(prev => [...prev, {
                id: Date.now(),
                level: 'info',
                message: 'Successfully loaded instances',
                timestamp: new Date().toISOString()
            }]);
        } catch (err) {
            setLogs(prev => [...prev, {
                id: Date.now(),
                level: 'error',
                message: `Error: ${err}`,
                timestamp: new Date().toISOString()
            }]);
        }
    };

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', { hour12: false });
        } catch {
            return timestamp;
        }
    };

    return (
        <div className="console-page">
            <div className="console-header">
                <h1>Console</h1>
                <div className="console-controls">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="console-filter"
                    >
                        <option value="all">All Logs</option>
                        <option value="info">Info</option>
                        <option value="warn">Warnings</option>
                        <option value="error">Errors</option>
                    </select>
                    <label className="auto-scroll-toggle">
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                        />
                        Auto-scroll
                    </label>
                    <button className="btn btn-secondary" onClick={testLog}>
                        Test
                    </button>
                    <button className="btn btn-secondary" onClick={exportLogs}>
                        Export
                    </button>
                    <button className="btn btn-secondary" onClick={clearLogs}>
                        Clear
                    </button>
                </div>
            </div>

            <div className="console-output" ref={consoleRef}>
                {filteredLogs.length === 0 ? (
                    <div className="console-empty">No logs to display</div>
                ) : (
                    filteredLogs.map(log => (
                        <div key={log.id} className={`console-line console-${log.level}`}>
                            <span className="console-time">{formatTime(log.timestamp)}</span>
                            <span className={`console-level level-${log.level}`}>
                                {log.level.toUpperCase()}
                            </span>
                            <span className="console-message">{log.message}</span>
                        </div>
                    ))
                )}
            </div>

            <div className="console-footer">
                <span className="log-count">{logs.length} total logs</span>
                <span className="filter-info">
                    Showing {filteredLogs.length} {filter !== 'all' ? filter : ''} logs
                </span>
            </div>
        </div>
    );
}

export default Console;
