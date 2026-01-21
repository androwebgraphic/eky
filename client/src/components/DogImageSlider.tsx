import React from 'react';
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';

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

  // Responsive maxHeight: 480px on desktop, 320px on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const maxHeight = isMobile ? 320 : 480;
  const cld = new Cloudinary({ cloud: { cloudName: 'dtqzrm4by' } });

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
        {images.map((img, idx) => {
          // Extract public ID from URL if possible, otherwise use full URL
          let publicId = img.url;
          // If the URL is a Cloudinary URL, extract the public ID
          const cloudinaryMatch = img.url.match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/([^\.]+)(\.[a-zA-Z]+)?$/);
          if (cloudinaryMatch) {
            publicId = cloudinaryMatch[1];
          }
          const cldImg = cld.image(publicId).format('auto').quality('auto');
          return (
            <SwiperSlide key={img.url}>
              <AdvancedImage
                cldImg={cldImg}
                alt={alt || `dog-image-${idx + 1}`}
                style={{ width: '100%', height: 'auto', borderRadius: '1rem', objectFit: 'cover', maxHeight }}
              />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default DogImageSlider;
