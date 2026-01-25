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
  if (!images || images.length === 0) return null;

  // Responsive maxHeight: 480px on desktop, 320px on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const maxHeight = isMobile ? 320 : 480;

  return (
    <div className="dog-image-slider">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        loop={images.length > 1}
        pagination={{ clickable: true }}
        navigation={true}
        style={{ borderRadius: '1rem', maxHeight }}
      >
        {images.map((img, idx) => (
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