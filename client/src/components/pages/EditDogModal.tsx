import React from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface EditDogFormData {
  name: string;
  breed?: string;
  age?: number;
  color?: string;
  description?: string;
  size?: string;
  gender?: 'male' | 'female';
}

const EditDogModal = (props) => {
  // ...existing logic...
  return (
    <>
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
.custom-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  gap: 0.5rem;
}
.custom-checkbox input[type='checkbox'] {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
  left: 0;
  top: 0;
  margin: 0;
  z-index: 1;
}
.custom-checkbox .checkmark {
  width: 1.5em;
  height: 1.5em;
  border: 2.5px solid #75171a;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s;
  box-sizing: border-box;
}
.custom-checkbox input[type='checkbox']:checked + .checkmark {
  background: #75171a;
  border-color: #75171a;
}
.custom-checkbox input[type='checkbox']:checked + .checkmark::after {
  content: '';
  display: block;
  width: 0.7em;
  height: 0.7em;
  border-radius: 3px;
  background: #fff;
}
      `}</style>
      {/* ...existing modal JSX here... */}
    </>
  );
};

export default EditDogModal;
// ...existing code...
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
          <div className="gender-options" style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <style>{`
              .editdog-radio {
                appearance: none;
                -webkit-appearance: none;
                background-color: #fff;
                margin: 0;
                font: inherit;
                width: 1.5em;
                height: 1.5em;
                border: 2.5px solid #75171a;
                border-radius: 50%;
                display: grid;
                place-content: center;
                cursor: pointer;
                transition: border-color 0.2s;
                outline: none;
              }
              .editdog-radio:checked {
                border-color: #75171a;
                background-color: #75171a;
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
              }
              .editdog-radio:checked::before {
                content: '';
                display: block;
                width: 0.7em;
                height: 0.7em;
                border-radius: 50%;
                background: #fff;
                margin: auto;
              }
            `}</style>
            <label htmlFor="editdog-gender-male" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', userSelect: 'auto' }}>
              <input type="radio" className="editdog-radio" {...register('gender', { required: true })} id="editdog-gender-male" name="gender" value="male" />
              <span>{t('gender.male') || 'Male'}</span>
            </label>
            <label htmlFor="editdog-gender-female" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', userSelect: 'auto' }}>
              <input type="radio" className="editdog-radio" {...register('gender', { required: true })} id="editdog-gender-female" name="gender" value="female" />
              <span>{t('gender.female') || 'Female'}</span>
            </label>
            {errors.gender && <span style={{ color: 'red', fontSize: '0.95rem' }}>{t('adddog.gender')} is required</span>}
          </div>

          <div id="health" style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <style>{`
              .editdog-checkbox {
                accent-color: #75171a !important;
                width: 1.5em;
                height: 1.5em;
                cursor: pointer;
                margin: 0;
                vertical-align: middle;
              }
            `}</style>
              <style>{`
                .custom-checkbox {
                  position: relative;
                  display: inline-flex;
                  align-items: center;
                  cursor: pointer;
                  font-size: 1.1rem;
                  font-weight: bold;
                  gap: 0.5rem;
                }
                .custom-checkbox input[type='checkbox'] {
                  opacity: 0;
                  width: 0;
                  height: 0;
                  position: absolute;
                  left: 0;
                  top: 0;
                  margin: 0;
                  z-index: 1;
                }
                .custom-checkbox .checkmark {
                  width: 1.5em;
                  height: 1.5em;
                  border: 2.5px solid #75171a;
                  border-radius: 6px;
                  background: #fff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: background 0.2s, border-color 0.2s;
                  box-sizing: border-box;
                }
                .custom-checkbox input[type='checkbox']:checked + .checkmark {
                  background: #75171a;
                  border-color: #75171a;
                }
                .custom-checkbox input[type='checkbox']:checked + .checkmark::after {
                  content: '';
                  display: block;
                  width: 0.7em;
                  height: 0.7em;
                  border-radius: 3px;
                  background: #fff;
                }
              `}</style>
              <label htmlFor="editdog-vaccinated" className="custom-checkbox">
                <span>{t('adddog.vaccinated') || 'Vaccinated'}</span>
                <input
                  type="checkbox"
                  {...register('vaccinated')}
                  id="editdog-vaccinated"
                  name="vaccinated"
                />
                <span className="checkmark"></span>
              </label>
              <label htmlFor="editdog-neutered" className="custom-checkbox">
                <span>{t('adddog.neutered') || 'Neutered'}</span>
                <input
                  type="checkbox"
                  {...register('neutered')}
                  id="editdog-neutered"
                  name="neutered"
                />
                <span className="checkmark"></span>
              </label>
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




