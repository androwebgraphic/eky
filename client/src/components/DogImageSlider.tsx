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
  console.log('[DogImageSlider] Received images:', images.length);
  console.log('[DogImageSlider] Image URLs:', images.map((img, i) => `${i}: ${img.url}`));
  
  if (!images || images.length === 0) return null;

  // Note: Deduplication is done in DogDetails component before passing images here
  // Additional deduplication here as a safety net
  const uniqueImages: { url: string; width?: number }[] = [];
  const seenUrls = new Set<string>();
  
  for (const img of images) {
    const urlWithoutCache = img.url.split('?')[0];
    if (!seenUrls.has(urlWithoutCache)) {
      seenUrls.add(urlWithoutCache);
      uniqueImages.push(img);
    } else {
      console.log('[DogImageSlider] Skipping duplicate image:', img.url);
    }
  }
  
  console.log('[DogImageSlider] After deduplication:', uniqueImages.length, 'images');

  // Responsive maxHeight: 240px on desktop, 150px on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const maxHeight = isMobile ? 150 : 240;

  return (
    <div className="dog-image-slider">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        loop={uniqueImages.length > 1}
        pagination={uniqueImages.length > 1 ? { clickable: true } : false}
        navigation={uniqueImages.length > 1}
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