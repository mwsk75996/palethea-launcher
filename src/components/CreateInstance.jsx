import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './CreateInstance.css';

function CreateInstance({ onClose, onCreate, isLoading, mode = 'page' }) {
  const [name, setName] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [modLoader, setModLoader] = useState('vanilla');
  const [step, setStep] = useState(0);
  const [loaderVersions, setLoaderVersions] = useState([]);
  const [loaderLoading, setLoaderLoading] = useState(false);
  const [loaderError, setLoaderError] = useState('');
  const [selectedLoaderVersion, setSelectedLoaderVersion] = useState('');
  const [versions, setVersions] = useState([]);
  const [filter, setFilter] = useState('release');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingVersions, setLoadingVersions] = useState(true);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const result = await invoke('get_versions');
      setVersions(result);
      
      // Select latest release by default
      const latest = await invoke('get_latest_release');
      setSelectedVersion(latest);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
    setLoadingVersions(false);
  };

  const filteredVersions = versions.filter((version) => {
    const matchesFilter = filter === 'all' || version.version_type === filter;
    const matchesSearch = version.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    const loadLoaderVersions = async () => {
      if (modLoader === 'vanilla' || !selectedVersion) {
        setLoaderVersions([]);
        setSelectedLoaderVersion('');
        setLoaderError('');
        setLoaderLoading(false);
        return;
      }

      setLoaderLoading(true);
      setLoaderError('');
      try {
        const result = await invoke('get_loader_versions', {
          loader: modLoader,
          gameVersion: selectedVersion,
        });
        const versionsList = Array.isArray(result) ? result : [];
        setLoaderVersions(versionsList);
        setSelectedLoaderVersion(versionsList[0] || '');
      } catch (error) {
        console.error('Failed to load loader versions:', error);
        setLoaderVersions([]);
        setSelectedLoaderVersion('');
        setLoaderError('Failed to load loader versions');
      }
      setLoaderLoading(false);
    };

    loadLoaderVersions();
  }, [modLoader, selectedVersion]);

  const handleCreate = () => {
    if (name.trim() && selectedVersion) {
      onCreate(name.trim(), selectedVersion, modLoader, selectedLoaderVersion || null);
    }
  };

  const canNextFromName = name.trim().length > 0;
  const canNextFromVersion = !!selectedVersion;
  const canCreate = name.trim() && selectedVersion && (modLoader === 'vanilla' || selectedLoaderVersion);

  const isPage = mode === 'page';

  const content = (
    <div className={isPage ? 'create-page' : 'modal'} onClick={(e) => e.stopPropagation()}>
      <div className={isPage ? 'create-header' : 'modal-header'}>
        <h2>Create New Instance</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="create-steps">
        <div className={`create-step ${step === 0 ? 'active' : ''}`}>Name</div>
        <div className={`create-step ${step === 1 ? 'active' : ''}`}>Version</div>
        <div className={`create-step ${step === 2 ? 'active' : ''}`}>Mod Loader</div>
      </div>
      
      <div className={isPage ? 'create-body' : 'modal-body'}>
        {step === 0 && (
          <div className="form-group">
            <label>Instance Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Minecraft Instance"
              autoFocus
            />
          </div>
        )}
        
        {step === 1 && (
          <div className="form-group">
            <label>Minecraft Version</label>
            <div className="version-selector">
              <div className="version-filters">
                {['release', 'snapshot', 'all'].map((type) => (
                  <button
                    key={type}
                    className={`filter-btn ${filter === type ? 'active' : ''}`}
                    onClick={() => setFilter(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              
              <input
                type="text"
                className="version-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search versions..."
              />
              
              {loadingVersions ? (
                <div className="version-loading">Loading versions...</div>
              ) : (
                <div className="version-list">
                  {filteredVersions.slice(0, 50).map((version) => (
                    <button
                      key={version.id}
                      className={`version-option ${selectedVersion === version.id ? 'selected' : ''}`}
                      onClick={() => setSelectedVersion(version.id)}
                    >
                      <span className="version-name">{version.id}</span>
                      <span className={`version-badge ${version.version_type}`}>
                        {version.version_type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="form-group">
            <label>Mod Loader</label>
            <div className="mod-loader-selector">
              {['vanilla', 'fabric', 'forge', 'neoforge'].map((loader) => (
                <button
                  key={loader}
                  className={`loader-btn ${modLoader === loader ? 'active' : ''}`}
                  onClick={() => setModLoader(loader)}
                >
                  {loader.charAt(0).toUpperCase() + loader.slice(1)}
                </button>
              ))}
            </div>
            {modLoader !== 'vanilla' && (
              <div className="loader-versions">
                <label>Mod Loader Version</label>
                {loaderLoading ? (
                  <div className="loader-loading">Loading versions...</div>
                ) : loaderError ? (
                  <div className="loader-error">{loaderError}</div>
                ) : (
                  <select
                    className="loader-select"
                    value={selectedLoaderVersion}
                    onChange={(e) => setSelectedLoaderVersion(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a version
                    </option>
                    {loaderVersions.map((version) => (
                      <option key={version} value={version}>{version}</option>
                    ))}
                  </select>
                )}
                <p className="loader-note">
                  Choose the exact {modLoader} version you want to install.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={isPage ? 'create-footer' : 'modal-footer'}>
        <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </button>
        {step > 0 && (
          <button
            className="btn btn-secondary"
            onClick={() => setStep(step - 1)}
            disabled={isLoading}
          >
            Back
          </button>
        )}
        {step < 2 ? (
          <button
            className="btn btn-primary"
            onClick={() => setStep(step + 1)}
            disabled={isLoading || (step === 0 && !canNextFromName) || (step === 1 && !canNextFromVersion)}
          >
            Next
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!canCreate || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Instance'}
          </button>
        )}
      </div>
    </div>
  );

  return isPage ? (
    <div className="create-page-container">
      {content}
    </div>
  ) : (
    <div className="modal-overlay" onClick={onClose}>
      {content}
    </div>
  );
}

export default CreateInstance;
