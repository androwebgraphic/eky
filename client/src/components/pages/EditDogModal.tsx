import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface EditDogFormData {
  name: string;
  breed?: string;
}

interface EditDogModalProps {
  dog: any;
  isSingleDog: boolean;
  onSave: (dog: any) => void;
}

const EditDogModal: React.FC<EditDogModalProps> = ({ dog, isSingleDog, onSave }) => {
  const { t } = useTranslation();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const { register, handleSubmit } = useForm<EditDogFormData>({ defaultValues: dog });
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onSubmit: SubmitHandler<EditDogFormData> = fields => {
    onSave({ ...dog, ...fields });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isSingleDog ? '0.08rem' : '1rem',
        fontSize: isSingleDog ? '0.7rem' : undefined,
      }}
    >
      {(isSingleDog && windowSize.width > 768) ? (
        <>
          <label>{t('adddog.name')}</label>
          <input
            {...register('name')}
            defaultValue={dog.name || ''}
            required
            style={{ padding: '0.05rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.7rem' }}
          />
          <label>{t('adddog.breed')}</label>
          <input
            {...register('breed')}
            defaultValue={dog.breed || ''}
            style={{ padding: '0.05rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.7rem' }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 1,
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
                padding: '0.08rem 0.2rem',
                fontWeight: 'bold',
                fontSize: '0.6rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(52,152,219,0.08)'
              }}
            >
              {t('editdog.save').replace('editdog.', '').replace('adddog.', '') || 'Save'}
            </button>
          </div>
        </>
      ) : null}
    </form>
  );
};

export default EditDogModal;




