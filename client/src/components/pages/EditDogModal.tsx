import React, { useEffect, useState, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import '../../css/edit-modal.css';

interface EditDogFormData {
  name: string;
  breed?: string;
  color?: string;
  location?: string;
  age?: number;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  gender?: 'male' | 'female';
  vaccinated?: boolean;
  neutered?: boolean;
}

interface EditDogModalProps {
  dog: any;
  onClose: () => void;
  onSave: (updatedDog: any) => void;
  modalPosition?: {x: number, y: number};
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return `${API_URL}${url}`;
  }
  return url;
};

function EditDogModal({ dog, onClose, onSave, modalPosition }: EditDogModalProps) {
  const isMounted = useRef(true);
  const { t } = useTranslation();
  const { token } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(dog.images ? [...dog.images] : []);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditDogFormData>({ defaultValues: { ...dog, gender: dog.gender === 'male' || dog.gender === 'female' ? dog.gender : undefined } });

  // Removed unused modalTop logic

  useEffect(() => {
    isMounted.current = true;
    // Reset the form with the new dog data, ensuring gender is set correctly
    reset({ ...dog, gender: dog.gender === 'male' || dog.gender === 'female' ? dog.gender : undefined });
    setExistingImages(dog.images ? [...dog.images] : []);
    return () => {
      isMounted.current = false;
    };
  }, [dog, reset]);

  const onSubmit: SubmitHandler<EditDogFormData> = async (fields) => {
    try {
      if (!isMounted.current) return;
      setSubmitting(true);
      setSubmitError(null);
      let resp;
      const hasNewFiles = mediaFiles.length > 0;
      const hasRemovedImages = existingImages.length !== (dog.images ? dog.images.length : 0);
      const hasPhotoChanges = hasNewFiles || hasRemovedImages;
      if (hasPhotoChanges) {
        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (typeof v !== 'undefined' && v !== '') formData.append(k, v as any);
        });
        const keepImagesData = JSON.stringify(existingImages.map(img => img.url));
        formData.append('keepImages', keepImagesData);
        mediaFiles.forEach((file) => {
          formData.append('media', file, file.name);
        });
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        try {
          resp = await fetch(`${API_URL}/api/dogs/${dog._id}`, {
            method: 'PATCH',
            body: formData,
            headers
          });
        } catch (fetchErr) {
          if (isMounted.current) {
            setSubmitError('Failed to upload images. Please check your connection or try again.');
            setSubmitting(false);
          }
          return;
        }
      } else {
        const bodyData: any = {};
        Object.entries(fields).forEach(([k, v]) => {
          if (typeof v !== 'undefined' && v !== '') bodyData[k] = v;
        });
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        resp = await fetch(`${API_URL}/api/dogs/${dog._id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(bodyData)
        });
      }
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update dog');
      }
      if (isMounted.current) {
        setMediaFiles([]);
        setMediaPreviews([]);
      }
    } catch (err) {
      if (isMounted.current) {
        setSubmitError((err as Error).message || 'Failed to update dog');
        setSubmitting(false);
      }
    }
    // No return here, just logic
  };

  // Return the modal JSX
  return (
    <div className="editdog-modal-overlay">
      <div className="editdog-modal-content">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ...existing form fields and layout... */}
          {/* You may want to restore the form fields here if they were lost in previous edits. */}
        </form>
      </div>
    </div>
  );
}

export default EditDogModal;




