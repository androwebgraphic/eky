import React, { useState, useEffect } from 'react';
let EXIF: any;
try {
  EXIF = require('exif-js');
} catch (e) {
  EXIF = (window as any).EXIF;
}

function getOrientedImageUrl(imgUrl: string, callback: (url: string) => void) {
  const img = new window.Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function () {
    if (!EXIF || !EXIF.getData) {
      callback(imgUrl);
      return;
    }
    EXIF.getData(img, function () {
      const orientation = EXIF.getTag(this, 'Orientation');
      if (!orientation || orientation === 1) {
        callback(imgUrl);
        return;
      }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(imgUrl);
        return;
      }
      let width = img.width;
      let height = img.height;
      if ([5,6,7,8].includes(orientation)) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }
      switch (orientation) {
        case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
        case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
        case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
        case 7: ctx.transform(0, -1, -1, 0, height, width); break;
        case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
        default: break;
      }
      ctx.drawImage(img, 0, 0);
      callback(canvas.toDataURL());
    });
  };
  img.onerror = function () {
    callback(imgUrl);
  };
  img.src = imgUrl;
}

const OrientedImage: React.FC<{ src?: string; alt?: string; style?: React.CSSProperties; fallback?: string }> = ({ src, alt, style, fallback }) => {
  const [orientedUrl, setOrientedUrl] = useState<string | undefined>(src);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!src) return;
    getOrientedImageUrl(src, setOrientedUrl);
  }, [src]);
  if (!src) return null;
  if (error) return <img src={fallback} alt={alt} style={style} />;
  return <img src={orientedUrl} alt={alt} style={style} onError={() => setError(true)} />;
};

export default OrientedImage;