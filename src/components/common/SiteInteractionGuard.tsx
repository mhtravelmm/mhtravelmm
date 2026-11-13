import { useEffect } from 'react';

export function SiteInteractionGuard() {
  useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    const preventZoomKeys = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (['+', '=', '-', '_', '0'].includes(event.key)) event.preventDefault();
    };
    const preventWheelZoom = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventZoomKeys);
    document.addEventListener('wheel', preventWheelZoom, { passive: false });
    document.documentElement.style.touchAction = 'pan-x pan-y';
    document.documentElement.style.userSelect = 'auto';

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventZoomKeys);
      document.removeEventListener('wheel', preventWheelZoom);
      document.documentElement.style.touchAction = '';
      document.documentElement.style.userSelect = '';
    };
  }, []);

  return null;
}
