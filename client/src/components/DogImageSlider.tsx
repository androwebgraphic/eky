import React from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface DogImageSliderProps {
  images: { url: string; width?: number }[];
  alt?: string;
}

const DogImageSlider: React.FC<DogImageSliderProps> = ({ images, alt }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="dog-image-slider">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        loop={true}
        pagination={{ clickable: true }}
        navigation={true}
        style={{ borderRadius: '1rem', maxHeight: 320 }}
      >
        {images.map((img, idx) => (
          <SwiperSlide key={img.url}>
            <img
              src={img.url}
              alt={alt || `dog-image-${idx + 1}`}
              style={{ width: '100%', height: 'auto', borderRadius: '1rem', objectFit: 'cover', maxHeight: 320 }}
              loading="lazy"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default DogImageSlider;
