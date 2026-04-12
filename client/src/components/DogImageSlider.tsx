import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './dogImageSliderFix.css';

interface DogImageSliderProps {
  images: { url: string; width?: number }[];
  alt?: string;
}

  const DogImageSlider: React.FC<DogImageSliderProps> = ({ images, alt }) => {
  console.log('[DogImageSlider] === START ===');
  console.log('[DogImageSlider] Received images count:', images.length);
  console.log('[DogImageSlider] Received images:', images.map((img, i) => `${i}: ${img.url} (width: ${img.width})`));
  
  if (!images || images.length === 0) return null;

  // Note: Deduplication is done in DogDetails component before passing images here
  // Additional deduplication here as a safety net
  const uniqueImages: { url: string; width?: number }[] = [];
  const seenUrls = new Set<string>();
  
  for (const img of images) {
    const urlWithoutCache = img.url.split('?')[0];
    console.log('[DogImageSlider] Processing image:', img.url, '-> without cache:', urlWithoutCache);
    if (!seenUrls.has(urlWithoutCache)) {
      seenUrls.add(urlWithoutCache);
      uniqueImages.push(img);
      console.log('[DogImageSlider]   -> Added to uniqueImages');
    } else {
      console.log('[DogImageSlider]   -> SKIPPING duplicate');
    }
  }
  
  console.log('[DogImageSlider] After deduplication:', uniqueImages.length, 'unique images');
  console.log('[DogImageSlider] Unique images:', uniqueImages.map((img, i) => `${i}: ${img.url}`));

  // Responsive maxHeight: 240px on desktop, 150px on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const maxHeight = isMobile ? 150 : 240;

  // If there's only one unique image, display it directly without Swiper
  // This prevents Swiper from creating duplicate slides for loop/cloning
  if (uniqueImages.length === 1) {
    const img = uniqueImages[0];
    return (
      <div className="dog-image-slider">
        <img
          src={img.url}
          alt={alt || 'dog-image-1'}
          style={{ width: '100%', height: 'auto', borderRadius: '1rem', objectFit: 'contain', background: '#111', maxHeight }}
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/nany.jpg'; }}
        />
      </div>
    );
  }

  // For multiple images, use Swiper with full functionality
  return (
    <div className="dog-image-slider">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        loop={true}
        pagination={{ clickable: true }}
        navigation={true}
        style={{ borderRadius: '1rem', maxHeight }}
      >
        {uniqueImages.map((img, idx) => (
          <SwiperSlide key={img.url}>
            <img
              src={img.url}
              alt={alt || `dog-image-${idx + 1}`}
              style={{ width: '100%', height: 'auto', borderRadius: '1rem', objectFit: 'contain', background: '#111', maxHeight }}
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/nany.jpg'; }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default DogImageSlider;