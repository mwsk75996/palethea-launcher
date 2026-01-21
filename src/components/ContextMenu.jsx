import './ContextMenu.css';

function ContextMenu({ x, y, instance, onAction }) {
  // Adjust position to stay within viewport
  const menuWidth = 180;
  const menuHeight = instance ? 300 : 60;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div 
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      {instance ? (
        <>
          <div className="context-menu-header">{instance.name}</div>
          <div className="context-menu-divider" />
          <button className="context-menu-item" onClick={() => onAction('play')}>
            Play
          </button>
          <button className="context-menu-item" onClick={() => onAction('edit')}>
            Edit Instance
          </button>
          <button className="context-menu-item" onClick={() => onAction('clone')}>
            Clone Instance
          </button>
          <button className="context-menu-item" onClick={() => onAction('openFolder')}>
            Open Folder
          </button>
          <div className="context-menu-divider" />
          <div className="context-menu-label">Set Color</div>
          <div className="color-quick-select">
            {['#ff6b6b', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa', '#ffffff'].map(color => (
              <button
                key={color}
                className="color-swatch"
                style={{ backgroundColor: color }}
                onClick={() => onAction('setColor', color)}
              />
            ))}
          </div>
          <div className="context-menu-divider" />
          <button className="context-menu-item danger" onClick={() => onAction('delete')}>
            Delete Instance
          </button>
        </>
      ) : (
        <>
          <button className="context-menu-item" onClick={() => onAction('create')}>
            New Instance
          </button>
        </>
      )}
    </div>
  );
}

export default ContextMenu;
