
// Fixing the missing zoom functions by adding them back
const handleZoomIn = () => {
  setZoomLevel(prev => Math.min(prev + 0.25, 3));
};

const handleZoomOut = () => {
  setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
};

const handleResetZoom = () => {
  setZoomLevel(1);
};
