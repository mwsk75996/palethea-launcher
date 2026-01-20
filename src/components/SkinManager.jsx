import { useState, useEffect, useRef } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import SkinViewer3D from './SkinViewer3D';
import './SkinManager.css';

function SkinManager({ activeAccount, showNotification, onSkinChange, onPreviewChange }) {
  const viewer3dRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [library, setLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveVariant, setSaveVariant] = useState('classic');
  const [lastSelectedPath, setLastSelectedPath] = useState('');
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [justUploadedUrl, setJustUploadedUrl] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeAccount?.isLoggedIn) {
      loadProfile();
    }
    loadLibrary();
  }, [activeAccount]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await invoke('get_mc_profile_full');
      setProfile(data);
      // Force preview image refresh
      setRefreshKey(Date.now());
      setJustUploadedUrl(null);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err);
      showNotification(`Failed to load skin profile: ${err}`, 'error');
    }
    setIsLoading(false);
  };

  const loadLibrary = async () => {
    try {
      const items = await invoke('get_skin_collection');
      // Pre-resolve all file paths for the images
      const itemsWithSrc = await Promise.all(items.map(async item => {
        const path = await invoke('get_skin_file_path', { filename: item.filename });
        return { ...item, src: convertFileSrc(path) };
      }));
      setLibrary(itemsWithSrc);
    } catch (error) {
      console.error('Failed to load library:', error);
    }
  };

  const currentSkinUrl = profile?.skins?.find(s => s.state === 'ACTIVE')?.url;

  const handleUploadSkin = async (variant) => {
    if (!activeAccount?.isLoggedIn) {
      showNotification('You must be logged in with a Microsoft account to change skins', 'error');
      return;
    }

    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Image',
          extensions: ['png']
        }]
      });

      if (selected) {
        const localUrl = convertFileSrc(selected);
        setLastSelectedPath(selected);
        setJustUploadedUrl(localUrl);
        setSaveVariant(variant);
        
        // Ensure local render is immediate
        showNotification('Updating preview...', 'info');
        
        // Ask if user wants to save to library too
        setShowSaveDialog(true);
        
        setIsUploading(true);
        await invoke('upload_skin', { 
          filePath: selected, 
          variant: variant // 'classic' or 'slim'
        });
        showNotification('Skin uploaded successfully!', 'success');
        if (onSkinChange) onSkinChange(localUrl);
        // Wait longer before profile refresh to let Mojang process, 
        // but keep our local preview until then
        setTimeout(loadProfile, 8000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      showNotification(`Upload failed: ${error}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!saveName.trim()) {
      showNotification('Please enter a name for the skin', 'error');
      return;
    }

    try {
      await invoke('add_to_skin_collection', {
        name: saveName,
        sourcePath: lastSelectedPath || currentSkinUrl,
        variant: saveVariant
      });
      showNotification('Added to library!', 'success');
      loadLibrary();
      setShowSaveDialog(false);
      setSaveName('');
    } catch (error) {
      showNotification(`Failed to save: ${error}`, 'error');
    }
  };

  const handleUseFromLibrary = async (skin) => {
    if (!activeAccount?.isLoggedIn) {
      showNotification('You must be logged in to change skins', 'error');
      return;
    }

    try {
      setIsUploading(true);
      setJustUploadedUrl(skin.src); // Immediate feedback
      const filePath = await invoke('get_skin_file_path', { filename: skin.filename });
      await invoke('upload_skin', { 
        filePath, 
        variant: skin.variant 
      });
      showNotification(`Applied skin "${skin.name}"`, 'success');
      if (onSkinChange) onSkinChange(skin.src);
      setTimeout(loadProfile, 3000);
    } catch (error) {
      showNotification(`Failed to apply skin: ${error}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFromLibrary = async (id) => {
    try {
      await invoke('delete_skin_from_collection', { id });
      loadLibrary();
    } catch (error) {
      showNotification(`Delete failed: ${error}`, 'error');
    }
  };

  const handleResetSkin = async () => {
    try {
      setIsUploading(true);
      await invoke('reset_skin');
      showNotification('Skin reset to default', 'success');
      if (onSkinChange) onSkinChange();
      setTimeout(loadProfile, 2000);
    } catch (error) {
      showNotification(`Reset failed: ${error}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const SkinCharacter2D = ({ src }) => (
    <div className="skin-character-2d">
      <div className="skin-part head" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part head-ov" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part body" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part body-ov" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part arm-l" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part arm-l-ov" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part arm-r" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part arm-r-ov" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part leg-l" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part leg-l-ov" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part leg-r" style={{ backgroundImage: `url("${src}")` }}></div>
      <div className="skin-part leg-r-ov" style={{ backgroundImage: `url("${src}")` }}></div>
    </div>
  );

  if (!activeAccount?.isLoggedIn && library.length === 0) {
    return (
      <div className="skin-manager empty">
        <div className="skin-empty-card">
          <h2>Microsoft Account Required</h2>
          <p>You need to be logged in with a Microsoft account to manage your Minecraft skin.</p>
        </div>
      </div>
    );
  }

  const activePreviewUrl = justUploadedUrl || currentSkinUrl;
  const activeSkin = profile?.skins?.find(s => s.state === 'ACTIVE');
  const activeVariant = justUploadedUrl ? saveVariant : (activeSkin?.variant?.toLowerCase() || 'classic');

  useEffect(() => {
    if (onPreviewChange && activePreviewUrl) {
      onPreviewChange(activePreviewUrl);
    }
  }, [activePreviewUrl, onPreviewChange]);

  return (
    <div className="skin-manager">
      <div className="skin-header">
        <h1>Skin Manager</h1>
        <p className="subtitle">Customize your in-game appearance</p>
      </div>

      <div className="skin-top-row">
        <div className="skin-preview-container">
          {isLoading ? (
            <div className="skin-loader">
              <div className="spinner"></div>
              <span>Loading preview...</span>
            </div>
          ) : activePreviewUrl ? (
            <div className="skin-view">
              <SkinViewer3D 
                ref={viewer3dRef}
                src={activePreviewUrl} 
                variant={activeVariant}
                width={280}
                height={400} 
                autoRotate={autoRotate}
              />
              <button 
                className={`btn-toggle-rotate ${autoRotate ? 'active' : ''}`}
                title={autoRotate ? "Pause Rotation" : "Resume Rotation"}
                onClick={() => setAutoRotate(!autoRotate)}
              >
                {autoRotate ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.83 6.72 2.24M21 3v5h-5" />
                  </svg>
                )}
              </button>
            </div>
          ) : error ? (
            <div className="skin-none error">
              <p>Failed to load profile</p>
              <button className="btn btn-secondary btn-sm" onClick={loadProfile}>Retry</button>
            </div>
          ) : (
            <div className="skin-none">No skin found</div>
          )}
        </div>

        <div className="skin-info-panels">
          <div className="skin-details">
            <div className="details-header">
              <h3>Current Profile</h3>
              <span className="skin-badge">Active</span>
            </div>
            <p className="active-name">{profile?.name || activeAccount?.username || 'Steve'}</p>
            
            <button 
              className="btn btn-secondary btn-add-library" 
              onClick={() => {
                const activeSkin = profile?.skins?.find(s => s.state === 'ACTIVE');
                setSaveName(activeAccount?.username || 'Current Skin');
                setSaveVariant(activeSkin?.variant?.toLowerCase() || 'classic');
                setLastSelectedPath(''); 
                setShowSaveDialog(true);
              }}
            >
              Add this skin to library
            </button>
          </div>

          <div className="action-card">
            <h3>Upload New Skin</h3>
            <p>Select a PNG file from your computer.</p>
            <div className="upload-buttons">
              <button 
                className="btn btn-primary btn-upload" 
                onClick={() => handleUploadSkin('classic')}
                disabled={isUploading || isLoading}
              >
                {isUploading ? 'Uploading...' : 'Upload Classic'}
              </button>
              <button 
                className="btn btn-secondary btn-upload" 
                onClick={() => handleUploadSkin('slim')}
                disabled={isUploading || isLoading}
              >
                Upload Slim
              </button>
            </div>
          </div>

          <div className="action-card secondary">
            <h3>Maintenance</h3>
            <p>Reset to default or refresh preview.</p>
            <div className="maintenance-buttons">
              <button 
                className="btn-reset" 
                onClick={handleResetSkin}
                disabled={isUploading || isLoading}
              >
                Reset
              </button>
              <button 
                className="btn-refresh" 
                onClick={() => {
                  setRefreshKey(Date.now());
                  loadProfile();
                }}
                disabled={isLoading}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="skin-bottom-row">
        <div className="skin-library">
          <div className="library-header">
            <h3>Skin Collection</h3>
            <span className="library-count">{library.length} skins saved</span>
          </div>
          
          {library.length === 0 ? (
            <div className="library-empty">
              <p>Your collection is empty.</p>
              <small>Upload a skin to add it to your library.</small>
            </div>
          ) : (
            <div className="library-grid">
              {library.map(skin => (
                <div key={skin.id} className="library-item" onClick={() => handleUseFromLibrary(skin)}>
                  <div className="library-preview">
                    <SkinCharacter2D src={skin.src} />
                  </div>
                  <div className="item-info">
                    <span className="item-name" title={skin.name}>{skin.name}</span>
                    <button 
                      className="btn-delete-small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFromLibrary(skin.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add to Collection?</h3>
            <p>Would you like to save this skin to your library for easy swapping later?</p>
            <input 
              type="text" 
              placeholder="Skin name (e.g. Red Hoodie)" 
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveToLibrary();
                if (e.key === 'Escape') setShowSaveDialog(false);
              }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveToLibrary}>Save to Library</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SkinManager;

