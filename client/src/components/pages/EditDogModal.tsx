import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface EditDogFormData {
  name: string;
  breed?: string;
  age?: number;
  color?: string;
  description?: string;
  size?: string;
  gender?: 'male' | 'female';
  vaccinated?: boolean | string;
  neutered?: boolean | string;
  images?: string[];
}

interface EditDogModalProps {
  dog: any;
  isSingleDog: boolean;
  onSave: (dog: any) => void;
  onClose: () => void;
}

const EditDogModal: React.FC<EditDogModalProps> = ({ dog, isSingleDog, onSave, onClose }) => {
  const { t } = useTranslation();
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<EditDogFormData>({
      defaultValues: {
        ...dog,
        gender: dog.gender === 'female' ? 'female' : 'male',
        vaccinated: dog.vaccinated === true ? 'true' : 'false',
        neutered: dog.neutered === true ? 'true' : 'false',
        images: [],
      }
    });

  // Reset form when dog changes
  React.useEffect(() => {
    reset({
      ...dog,
      gender: dog.gender === 'female' ? 'female' : 'male',
      vaccinated: dog.vaccinated === true ? 'true' : 'false',
      neutered: dog.neutered === true ? 'true' : 'false',
      images: [],
    });
  }, [dog, reset]);

  // Image upload and preview
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setValue('images', filesArr as any, { shouldValidate: true });
      // Generate previews
      const readers = filesArr.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(readers).then(setImagePreviews);
    }
  };


  // Removed useEffect for reset and mount log

  const onSubmit: SubmitHandler<EditDogFormData> = fields => {
    // Convert string values to correct types for health fields
    const updatedFields = {
      ...fields,
      vaccinated: String(fields.vaccinated) === 'true',
      neutered: String(fields.neutered) === 'true',
      gender: fields.gender === 'male' ? 'male' : 'female',
      images: fields.images || [],
    };
    onSave({ ...dog, ...updatedFields });
  };



  return (
    <>
      <div
        className="editdog-modal-container"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: '320px',
          minHeight: '80px',
          maxWidth: '98vw',
          width: '100%',
          maxHeight: '80vh',
          boxSizing: 'border-box',
          padding: '0',
          background: 'white',
          border: '3px solid #3498db',
          borderRadius: 16,
          zIndex: 999999,
          pointerEvents: 'auto',
        }}
      >
        {/* Responsive style for desktop: make modal much wider and more comfortable */}
        <style>{`
          @media (min-width: 900px) {
            .editdog-modal-container {
              max-width: 640px !important;
              min-width: 420px !important;
              padding: 0 !important;
            }
            .editdog-modal-container form {
              padding: 2rem 2.5rem !important;
              font-size: 1.13rem !important;
            }
          }
          .editdog-modal-container input,
          .editdog-modal-container textarea {
            font-size: 1.15rem !important;
            padding: 0.7rem 1rem !important;
            border-radius: 8px !important;
            border: 1.5px solid #bbb !important;
            margin-bottom: 1.2rem !important;
            width: 100%;
            box-sizing: border-box;
          }
          .editdog-modal-container input[type="radio"],
          .editdog-modal-container input[type="checkbox"] {
            width: 26px !important;
            height: 26px !important;
            min-width: 26px !important;
            min-height: 26px !important;
            accent-color: #3498db !important;
            cursor: pointer !important;
            z-index: 2 !important;
            position: relative;
          }
          .editdog-modal-container label {
            font-size: 1.13rem !important;
            cursor: pointer !important;
          }
        `}</style>
        {/* Force user-select:auto for all radios/checkboxes in modal */}
        <style>{`
          .editdog-modal-override input[type="radio"],
          .editdog-modal-override input[type="checkbox"],
          .editdog-modal-override label {
            user-select: auto !important;
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            -ms-user-select: auto !important;
          }
        `}</style>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            background: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 1000000,
          }}
          aria-label="Close"
          title="Close"
        >
          ×
        </button>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.7rem',
            fontSize: '1.05rem',
            background: 'white',
            border: '2px solid #3498db',
            borderRadius: 12,
            padding: '1.2rem 1.5rem',
            minWidth: '0',
            minHeight: '0',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '55vh',
            zIndex: 9999999,
            boxSizing: 'border-box',
            overflow: 'auto',
          }}
        >
          <label>{t('adddog.name')}</label>
          <input {...register('name', { required: true })} />
          {errors.name && <span style={{ color: 'red', fontSize: '0.95rem' }}>{t('adddog.name')} is required</span>}

          <label>{t('adddog.breed')}</label>
          <input {...register('breed')} />

          <label>{t('adddog.age') || 'Age'}</label>
          <input type="number" {...register('age')} />

          <label>{t('adddog.color') || 'Color'}</label>
          <input {...register('color')} />

          <label>{t('adddog.description') || 'Description'}</label>
          <textarea {...register('description')} />

          <label>{t('adddog.size') || 'Size'}</label>
          <input {...register('size')} />

          <label>{t('adddog.gender') || 'Gender'}</label>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="male"
                  {...register('gender', { required: true })}
                />
                Male
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="female"
                  {...register('gender')}
                />
                Female
              </label>
              {errors.gender && <span style={{ color: 'red', fontSize: '0.95rem' }}>{t('adddog.gender')} is required</span>}
            </div>
          </div>

          {/* Health radio buttons */}
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Vaccinated:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="true"
                  {...register('vaccinated', { required: true })}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="false"
                  {...register('vaccinated')}
                />
                No
              </label>
              {errors.vaccinated && <span style={{ color: 'red', fontSize: '0.95rem' }}>Vaccinated is required</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Neutered:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="true"
                  {...register('neutered', { required: true })}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="false"
                  {...register('neutered')}
                />
                No
              </label>
              {errors.neutered && <span style={{ color: 'red', fontSize: '0.95rem' }}>Neutered is required</span>}
            </div>
          </div>

          {/* Image upload */}
          <label style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Images</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ marginBottom: '1rem', fontSize: '1.1rem', padding: '0.5rem 0.7rem' }} />
          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {imagePreviews.map((src, idx) => (
                <img key={idx} src={src} alt={`preview-${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
              ))}
            </div>
          )}

          {/* Debug output removed */}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '1.5rem',
            position: 'sticky',
            bottom: 0,
            background: 'white',
            paddingBottom: 1
          }}>
            <button
              type="submit"
              style={{
                background: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.5rem 1.2rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(52,152,219,0.08)'
              }}
            >
              {t('editdog.save').replace('editdog.', '').replace('adddog.', '') || 'Save'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditDogModal;




