import { useState } from 'react';
import { ExternalLink, Maximize2, X } from 'lucide-react';
import './EditChoiceModal.css';

function EditChoiceModal({ onChoose, onCancel }) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  return (
    <div className="choice-overlay" onClick={onCancel}>
      <div className="choice-modal" onClick={(e) => e.stopPropagation()}>
        <button className="choice-close" onClick={onCancel} title="Close">
          <X size={20} />
        </button>

        <div className="choice-header">
          <h2>Instance Editor</h2>
          <p>Choose your preferred editing workspace</p>
        </div>
        
        <div className="choice-options">
          <button className="choice-card" onClick={() => onChoose('in-place', dontAskAgain)}>
            <div className="choice-icon">
              <Maximize2 size={24} />
            </div>
            <div className="choice-info">
              <h3>Same Window</h3>
              <p>Keep the editor inside the main launcher view.</p>
            </div>
          </button>

          <button className="choice-card" onClick={() => onChoose('pop-out', dontAskAgain)}>
            <div className="choice-icon">
              <ExternalLink size={24} />
            </div>
            <div className="choice-info">
              <h3>Pop-out</h3>
              <p>Launch a dedicated window for focused editing.</p>
            </div>
          </button>
        </div>

        <div className="choice-footer">
          <label className="dont-ask-label">
            <div className="checkbox-wrapper">
              <input 
                type="checkbox" 
                checked={dontAskAgain} 
                onChange={(e) => setDontAskAgain(e.target.checked)} 
              />
              <div className="custom-checkbox">
                {dontAskAgain && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
            <span>Always use this selection</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default EditChoiceModal;
