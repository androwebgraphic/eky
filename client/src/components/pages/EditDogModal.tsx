import React, { useEffect, useState } from 'react';
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

const API_URL = process.env.REACT_APP_API_URL || '';

function EditDogModal({ dog, onClose, onSave, modalPosition }: EditDogModalProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(dog.images ? [...dog.images] : []);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditDogFormData>({ defaultValues: dog });

  useEffect(() => {
    Object.entries(dog).forEach(([key, value]) => {
      setValue(key as any, value);
    });
    setExistingImages(dog.images ? [...dog.images] : []);
  }, [dog, setValue]);

  const onSubmit: SubmitHandler<EditDogFormData> = async (fields) => {
    try {
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
        mediaFiles.forEach((file, idx) => {
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
          setSubmitError('Failed to upload images. Please check your connection or try again.');
          setSubmitting(false);
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
      const updatedDog = await resp.json();
      setMediaFiles([]);
      setMediaPreviews([]);
      try {
        const freshResp = await fetch(`${API_URL}/api/dogs/${dog._id}`);
        if (freshResp.ok) {
          const freshDog = await freshResp.json();
          onSave(freshDog);
        } else {
          onSave(updatedDog);
        }
      } catch (e) {
        onSave(updatedDog);
      }
      onClose();
    } catch (err: any) {
      if (mediaFiles.length > 0 && (err.message === 'Failed to fetch' || err.message === 'NetworkError when attempting to fetch resource.')) {
        setSubmitError('Failed to upload images. Please check your connection or try again.');
      } else {
        setSubmitError(err.message || 'Failed to update dog');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="edit-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: window.innerWidth > 768 ? 'center' : 'stretch',
        justifyContent: 'center',
        padding: window.innerWidth > 768 ? '2rem' : '0',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: window.innerWidth > 768 ? '12px' : '0',
          padding: '1.5rem',
          paddingTop: window.innerWidth > 768 ? '1.5rem' : '3.5rem',
          paddingBottom: window.innerWidth > 768 ? '1.5rem' : '6rem',
          width: window.innerWidth > 768 ? '100%' : '100vw',
          height: window.innerWidth > 768 ? 'auto' : '100vh',
          maxWidth: window.innerWidth > 768 ? '600px' : '100vw',
          maxHeight: window.innerWidth > 768 ? '90vh' : '100vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          zIndex: 2147483647,
        }}
      >
        {/* ...existing code for modal content and form... */}
      </div>
    </div>
    );
  }
  export default EditDogModal;
