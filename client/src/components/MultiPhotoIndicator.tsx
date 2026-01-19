import React from 'react';

interface MultiPhotoIndicatorProps {
  count: number;
}

const MultiPhotoIndicator: React.FC<MultiPhotoIndicatorProps> = ({ count }) => {
  if (count <= 1) return null;
  return (
    <div className="multi-photo-indicator" title={`${count} photos`}>
      <span className="eky-icon eky-photo-stack" style={{ marginRight: 4 }}></span>
      <span>{count}</span>
    </div>
  );
};

export default MultiPhotoIndicator;
