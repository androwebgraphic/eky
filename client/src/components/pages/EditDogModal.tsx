import React, { useEffect } from 'react';
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
  vaccinated?: boolean;
  neutered?: boolean;
  images?: string[];
}

interface EditDogModalProps {
  dog: any;
  isSingleDog: boolean;
  onSave: (dog: any) => void;
}

const EditDogModal: React.FC<EditDogModalProps> = ({ dog, isSingleDog, onSave }) => {
  const { t } = useTranslation();
    const { register, handleSubmit, reset, watch } = useForm<EditDogFormData>({
      defaultValues: {
        ...dog,
        gender: dog.gender === 'female' ? 'female' : 'male',
        vaccinated: dog.vaccinated === true ? 'true' : 'false',
        neutered: dog.neutered === true ? 'true' : 'false',
      }
    });

    const genderValue = watch('gender');
    const vaccinatedValue = watch('vaccinated');
    const neuteredValue = watch('neutered');

    useEffect(() => {
      reset({
        ...dog,
        gender: dog.gender === 'female' ? 'female' : 'male',
        vaccinated: dog.vaccinated === true ? 'true' : 'false',
        neutered: dog.neutered === true ? 'true' : 'false',
      });
    }, [dog, reset]);
  // Removed unused window resize effect

  useEffect(() => {
    console.log('[EditDogModal] Mounted with dog:', dog);
  }, [dog]);

  const onSubmit: SubmitHandler<EditDogFormData> = fields => {
    // Convert string values to correct types for health fields
    const updatedFields = {
      ...fields,
      vaccinated: String(fields.vaccinated) === 'true',
      neutered: String(fields.neutered) === 'true',
      gender: fields.gender === 'male' ? 'male' : 'female',
    };
    console.log('[EditDogModal] onSubmit called with fields:', updatedFields);
    onSave({ ...dog, ...updatedFields });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,255,0.2)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto',
    }}>
      <div style={{ position: 'relative', minWidth: '320px', minHeight: '220px', maxWidth: '90vw', maxHeight: '90vh' }}>
        {/* Force user-select:auto for all radios/checkboxes in modal */}
        <style>{`
          .editdog-modal-override input[type="radio"],
          .editdog-modal-override input[type="checkbox"],
          .editdog-modal-override label {
            user-select: auto !important;
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            -ms-user-select: auto !important;
            pointer-events: auto !important;
          }
        `}</style>
        {/* Minimal radio test for debugging */}
        <div style={{ padding: 20, background: '#fff', zIndex: 9999999, position: 'relative', marginBottom: 20 }}>
          <h4>Test Radio (in Modal)</h4>
          <label style={{ userSelect: 'auto', pointerEvents: 'auto' }}>
            <input type="radio" name="modaltestgender" value="male" style={{ userSelect: 'auto', pointerEvents: 'auto' }} /> Male
          </label>
          <label style={{ userSelect: 'auto', pointerEvents: 'auto', marginLeft: 20 }}>
            <input type="radio" name="modaltestgender" value="female" style={{ userSelect: 'auto', pointerEvents: 'auto' }} /> Female
          </label>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('closeEditDogModal'));
            }
          }}
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
            gap: '1.2rem',
            fontSize: '1rem',
            background: 'white',
            border: '2px solid #3498db',
            borderRadius: 12,
            padding: '2rem',
            minWidth: '320px',
            minHeight: '220px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            zIndex: 9999999,
            boxSizing: 'border-box',
            overflow: 'auto',
          }}
        >
          <label>{t('adddog.name')}</label>
          <input
            {...register('name')}
            defaultValue={dog.name || ''}
            required
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem', marginBottom: '1rem' }}
          />
          <label>{t('adddog.breed')}</label>
          <input
            {...register('breed')}
            defaultValue={dog.breed || ''}
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem', marginBottom: '1rem' }}
          />
          <label>{t('adddog.age') || 'Age'}</label>
          <input type="number" {...register('age')} defaultValue={dog.age || ''} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem', marginBottom: '1rem' }} />
          <label>{t('adddog.color') || 'Color'}</label>
          <input {...register('color')} defaultValue={dog.color || ''} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem', marginBottom: '1rem' }} />
          <label>{t('adddog.description') || 'Description'}</label>
          <textarea {...register('description')} defaultValue={dog.description || ''} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem', marginBottom: '1rem' }} />
          <label>{t('adddog.size') || 'Size'}</label>
          <input {...register('size')} defaultValue={dog.size || ''} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem', marginBottom: '1rem' }} />
          <label>{t('adddog.gender') || 'Gender'}</label>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'auto', zIndex: 9999999 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="male"
                  {...register('gender')}
                  style={{ accentColor: '#3498db', width: 20, height: 20, marginRight: 6, background: '#fff', border: '2px solid #3498db', pointerEvents: 'auto', zIndex: 9999999, userSelect: 'auto' }}
                />
                Male
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="female"
                  {...register('gender')}
                  style={{ accentColor: '#e74c3c', width: 20, height: 20, marginRight: 6, background: '#fff', border: '2px solid #e74c3c', pointerEvents: 'auto', zIndex: 9999999, userSelect: 'auto' }}
                />
                Female
              </label>
            </div>
          </div>
          {/* Health radio buttons */}
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'auto', zIndex: 9999999 }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Vaccinated:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="true"
                  {...register('vaccinated')}
                  style={{ accentColor: '#27ae60', width: 20, height: 20, marginRight: 6, background: '#fff', border: '2px solid #27ae60', pointerEvents: 'auto', zIndex: 9999999, userSelect: 'auto' }}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="false"
                  {...register('vaccinated')}
                  style={{ accentColor: '#e74c3c', width: 20, height: 20, marginRight: 6, background: '#fff', border: '2px solid #e74c3c', pointerEvents: 'auto', zIndex: 9999999, userSelect: 'auto' }}
                />
                No
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'auto', zIndex: 9999999 }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Neutered:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="true"
                  {...register('neutered')}
                  style={{ accentColor: '#27ae60', width: 20, height: 20, marginRight: 6, background: '#fff', border: '2px solid #27ae60', pointerEvents: 'auto', zIndex: 9999999, userSelect: 'auto' }}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'auto' }}>
                <input
                  type="radio"
                  value="false"
                  {...register('neutered')}
                  style={{ accentColor: '#e74c3c', width: 20, height: 20, marginRight: 6, background: '#fff', border: '2px solid #e74c3c', pointerEvents: 'auto', zIndex: 9999999, userSelect: 'auto' }}
                />
                No
              </label>
            </div>
          </div>
          {/* Image upload */}
          <label style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Images</label>
          <input type="file" multiple accept="image/*" {...register('images')} style={{ marginBottom: '1rem' }} />
          <div className="editdog-modal-override" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '1.5rem',
            position: 'sticky',
            bottom: 0,
            background: 'white',
            zIndex: 10,
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
    </div>
  );
};

export default EditDogModal;




