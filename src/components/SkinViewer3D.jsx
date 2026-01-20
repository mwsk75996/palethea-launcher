import { useEffect, useRef, forwardRef } from 'react';
import * as skinview3d from 'skinview3d';

const SkinViewer3D = forwardRef(({ src, variant = 'classic', width = 280, height = 400, autoRotate = true }, ref) => {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize the viewer
    const viewer = new skinview3d.SkinViewer({
      canvas: canvasRef.current,
      width: width,
      height: height,
      skin: src
    });

    // Configure the viewer
    viewer.autoRotate = autoRotate;
    viewer.autoRotateSpeed = 0.5;
    viewer.controls.enableZoom = false; 

    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
    };
  }, [width, height]);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    if (viewerRef.current && src) {
      viewerRef.current.loadSkin(src, {
        model: variant === 'slim' ? 'slim' : 'classic'
      });
    }
  }, [src, variant]);

  return (
    <div className="skin-viewer-3d-container">
      <canvas ref={canvasRef} />
    </div>
  );
});

export default SkinViewer3D;
