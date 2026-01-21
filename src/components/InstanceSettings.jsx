import { useState, useEffect } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { join } from '@tauri-apps/api/path';
import VersionSelector from './VersionSelector';

function InstanceSettings({ instance, onSave, onInstanceUpdated }) {
  const [name, setName] = useState(instance.name);
  const [versionId, setVersionId] = useState(instance.version_id);
  const [colorAccent, setColorAccent] = useState(instance.color_accent || '#ffffff');
  const [modLoader, setModLoader] = useState(instance.mod_loader || 'Vanilla');
  const [modLoaderVersion, setModLoaderVersion] = useState(instance.mod_loader_version || '');
  const [javaPath, setJavaPath] = useState(instance.java_path || '');
  const [javaDownloadVersion, setJavaDownloadVersion] = useState('21');
  const [javaDownloading, setJavaDownloading] = useState(false);
  const [javaDownloadError, setJavaDownloadError] = useState('');
  const [memory, setMemory] = useState(instance.memory_max || 4096);
  const [jvmArgs, setJvmArgs] = useState(instance.jvm_args || '');
  const [versions, setVersions] = useState([]);
  const [loaderVersions, setLoaderVersions] = useState([]);
  const [loadingLoaders, setLoadingLoaders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoUpdating, setLogoUpdating] = useState(false);

  useEffect(() => {
    loadVersions();
  }, []);

  useEffect(() => {
    if (modLoader !== 'Vanilla') {
      loadLoaderVersions(modLoader);
    } else {
      setLoaderVersions([]);
      setModLoaderVersion('');
    }
  }, [modLoader, versionId]);

  useEffect(() => {
    checkChanges();
  }, [name, versionId, colorAccent, modLoader, modLoaderVersion, javaPath, memory, jvmArgs]);

  useEffect(() => {
    let cancelled = false;

    const loadLogo = async () => {
      try {
        const baseDir = await invoke('get_data_directory');
        const filename = instance.logo_filename || 'minecraft_logo.png';
        const logoPath = await join(baseDir, 'instance_logos', filename);
        if (!cancelled) {
          setLogoSrc(convertFileSrc(logoPath));
        }
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    };

    loadLogo();

    return () => {
      cancelled = true;
    };
  }, [instance.id, instance.logo_filename]);

  const loadVersions = async () => {
    try {
      const vers = await invoke('get_versions');
      setVersions(vers);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const loadLoaderVersions = async (loader) => {
    setLoadingLoaders(true);
    try {
      const vers = await invoke('get_loader_versions', {
        loader: loader.toLowerCase(),
        gameVersion: versionId
      });
      setLoaderVersions(vers);
      if (vers.length > 0 && !modLoaderVersion) {
        setModLoaderVersion(vers[0]);
      }
    } catch (error) {
      console.error('Failed to load loader versions:', error);
      setLoaderVersions([]);
    }
    setLoadingLoaders(false);
  };

  const checkChanges = () => {
    const changed =
      name !== instance.name ||
      versionId !== instance.version_id ||
      colorAccent !== (instance.color_accent || '#ffffff') ||
      modLoader !== (instance.mod_loader || 'Vanilla') ||
      modLoaderVersion !== (instance.mod_loader_version || '') ||
      javaPath !== (instance.java_path || '') ||
      memory !== (instance.memory_max || 4096) ||
      jvmArgs !== (instance.jvm_args || '');
    setHasChanges(changed);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // If mod loader changed to Fabric, install it first
      if (modLoader === 'Fabric' && modLoaderVersion &&
        (modLoader !== instance.mod_loader || modLoaderVersion !== instance.mod_loader_version)) {
        try {
          await invoke('install_fabric', {
            instanceId: instance.id,
            loaderVersion: modLoaderVersion
          });
        } catch (error) {
          console.error('Failed to install Fabric:', error);
          alert('Failed to install Fabric: ' + error);
          setSaving(false);
          return;
        }
      }

      const updatedInstance = {
        ...instance,
        name,
        version_id: versionId,
        color_accent: colorAccent || null,
        mod_loader: modLoader,
        mod_loader_version: modLoaderVersion || null,
        java_path: javaPath || null,
        memory_max: memory,
        jvm_args: jvmArgs || null,
      };
      await onSave(updatedInstance);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
    }
    setSaving(false);
  };

  const handleDownloadJava = async () => {
    setJavaDownloading(true);
    setJavaDownloadError('');
    try {
      const updated = await invoke('download_java_for_instance', {
        instanceId: instance.id,
        version: parseInt(javaDownloadVersion, 10),
      });
      if (updated?.java_path) {
        setJavaPath(updated.java_path);
      }
      if (onInstanceUpdated) {
        onInstanceUpdated(updated);
      }
    } catch (error) {
      console.error('Failed to download Java:', error);
      setJavaDownloadError('Failed to download Java');
    }
    setJavaDownloading(false);
  };

  const handleOpenFolder = async () => {
    try {
      await invoke('open_instance_folder', { instanceId: instance.id, folderType: 'root' });
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleChooseLogo = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'PNG Image', extensions: ['png'] }],
      });

      if (!selected) return;

      setLogoUpdating(true);
      const updated = await invoke('set_instance_logo', {
        instanceId: instance.id,
        sourcePath: selected,
      });
      if (onInstanceUpdated) {
        onInstanceUpdated(updated);
      }
    } catch (error) {
      console.error('Failed to set logo:', error);
    }
    setLogoUpdating(false);
  };

  const handleClearLogo = async () => {
    try {
      setLogoUpdating(true);
      const updated = await invoke('clear_instance_logo', { instanceId: instance.id });
      if (onInstanceUpdated) {
        onInstanceUpdated(updated);
      }
    } catch (error) {
      console.error('Failed to clear logo:', error);
    }
    setLogoUpdating(false);
  };

  const loaders = ['Vanilla', 'Fabric', 'Forge', 'NeoForge'];

  return (
    <div className="settings-tab">
      <div className="settings-section">
        <h2>General</h2>
        <div className="setting-row">
          <label>Instance Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="setting-row-vertical">
          <label>Game Version</label>
          <VersionSelector
            versions={versions}
            selectedVersion={versionId}
            onSelect={setVersionId}
            onRefresh={loadVersions}
          />
        </div>
        <div className="setting-row logo-row">
          <label>Instance Logo</label>
          <div className="logo-controls">
            <div className="logo-preview">
              {logoSrc ? <img src={logoSrc} alt="" /> : <div className="logo-preview-fallback" />}
            </div>
            <div className="logo-actions">
              <button className="btn btn-secondary" onClick={handleChooseLogo} disabled={logoUpdating}>
                {logoUpdating ? 'Updating...' : 'Choose PNG'}
              </button>
              <button className="btn btn-secondary" onClick={handleClearLogo} disabled={logoUpdating || !instance.logo_filename}>
                Clear
              </button>
              <span className="logo-hint">PNG only. Recommended 256×256.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Mod Loader</h2>
        <div className="mod-loader-section">
          <div className="mod-loader-options">
            {loaders.map((loader) => (
              <button
                key={loader}
                className={`loader-option ${modLoader === loader ? 'active' : ''}`}
                onClick={() => setModLoader(loader)}
              >
                {loader}
              </button>
            ))}
          </div>
          {modLoader !== 'Vanilla' && (
            <div className="loader-version-select">
              <div className="setting-row-vertical">
                <label>{modLoader} Version</label>
                <VersionSelector
                  versions={loaderVersions}
                  selectedVersion={modLoaderVersion}
                  onSelect={setModLoaderVersion}
                  loading={loadingLoaders}
                  showFilters={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h2>Java Settings</h2>
        <div className="setting-row">
          <label>Quick Java Install</label>
          <div className="java-download-actions">
            <select
              value={javaDownloadVersion}
              onChange={(e) => setJavaDownloadVersion(e.target.value)}
            >
              <option value="8">Java 8 (Legacy)</option>
              <option value="17">Java 17</option>
              <option value="21">Java 21 (Recommended)</option>
            </select>
            <button
              className="btn btn-secondary"
              onClick={handleDownloadJava}
              disabled={javaDownloading}
            >
              {javaDownloading ? 'Downloading...' : 'Download'}
            </button>
          </div>
        </div>
        {javaDownloadError && (
          <div className="java-download-error">{javaDownloadError}</div>
        )}
        <div className="setting-row">
          <label>Java Path</label>
          <input
            type="text"
            value={javaPath}
            onChange={(e) => setJavaPath(e.target.value)}
            placeholder="Use global setting"
          />
        </div>
        <div className="setting-row">
          <label>Memory (MB)</label>
          <input
            type="number"
            value={memory}
            onChange={(e) => setMemory(parseInt(e.target.value) || 4096)}
            min={512}
            max={32768}
            step={512}
          />
        </div>
        <div className="setting-row">
          <label>JVM Arguments</label>
          <input
            type="text"
            value={jvmArgs}
            onChange={(e) => setJvmArgs(e.target.value)}
            placeholder="-XX:+UseG1GC"
          />
        </div>
      </div>


      <div className="setting-actions">
        <button className="save-btn" onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button className="open-btn" onClick={handleOpenFolder}>
          Open Folder
        </button>
      </div>
    </div>
  );
}

export default InstanceSettings;
