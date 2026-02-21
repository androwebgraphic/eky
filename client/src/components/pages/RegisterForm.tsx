import React, { useState } from 'react';
import TermsModal from '../TermsModal';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
// import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormData {
  person: 'private' | 'organization';
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  passwordAgain: string;
  remember?: boolean;
}

const RegisterForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // const { register: registerUser } = useAuth();

  const schema = yup.object().shape({
    name: yup.string().required(t('register.name') + ' ' + t('validation.emailRequired')),
    email: yup.string().email(t('validation.emailInvalid')).required(t('validation.emailRequired')),
    username: yup.string().required(t('register.username')),
    phone: yup.string().required(t('register.phone') + ' ' + t('validation.required')),
    password: yup.string().min(6, t('validation.passwordMin', { min: 6 })).max(20).required(t('validation.passwordRequired')),
    passwordAgain: yup.string().oneOf([yup.ref('password'), null], t('register.passwordAgain')).required(t('register.passwordAgain')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    if (!acceptedTerms) {
      setShowTerms(true);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      // Remove passwordAgain from data before sending to server
      const { passwordAgain, remember, ...registrationData } = data;
      const response = await fetch('http://localhost:3001/api/users/registracija', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      const result = await response.json();
      if (response.ok) {
        navigate('/logiranje');
      } else {
        setSubmitError(result.message || 'Registration failed');
      }
    } catch (error) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h2>{t('register.register') || t('nav.register')}</h2>

      <form id="register-form" onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <div className="error" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', border: '1px solid #e57373', borderRadius: '4px' }}>
            {submitError}
          </div>
        )}
        
        <label htmlFor="register-person">{t('register.person')}</label>
        <select {...register('person')} name="person" id="register-person" autoComplete="off" autoFocus>
          <option value="private">{t('registerOptions.private')}</option>
          <option value="organization">{t('registerOptions.organization')}</option>
        </select>

        <label htmlFor="register-name">{t('register.name')}</label>
        <input type="text" id="register-name" name="name" autoComplete="name" placeholder={t('register.name')} {...register('name')} />
        <p className="error">{errors.name?.message as string}</p>

        <label htmlFor="register-username">{t('register.username')}</label>
        <input type="text" id="register-username" name="username" autoComplete="username" placeholder={t('register.username')} {...register('username')} />
        <p className="error">{errors.username?.message as string}</p>

        <label htmlFor="register-email">{t('register.email')}</label>
        <input type="email" id="register-email" name="email" autoComplete="email" placeholder={t('register.email')} {...register('email')} />
        <p className="error">{errors.email?.message as string}</p>

        <label htmlFor="register-phone">{t('register.phone')}</label>
        <input type="tel" id="register-phone" name="phone" autoComplete="tel" placeholder={t('register.phone')} {...register('phone')} />
        <p className="error">{errors.phone?.message as string}</p>

        <label htmlFor="register-password">{t('register.password')}</label>
        <input type="password" id="register-password" name="password" autoComplete="new-password" placeholder={t('register.password')} {...register('password')} />
        <p className="error">{errors.password?.message as string}</p>

        <label htmlFor="register-passwordAgain">{t('register.passwordAgain')}</label>
        <input type="password" id="register-passwordAgain" name="passwordAgain" autoComplete="new-password" placeholder={t('register.passwordAgain')} {...register('passwordAgain')} />
        <p className="error">{errors.passwordAgain?.message as string}</p>

        <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="register-remember" style={{ cursor: 'pointer', fontSize: '1rem' }}>
            <input 
              type="checkbox" 
              id="register-remember" 
              name="remember" 
              autoComplete="off" 
              {...register('remember')}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                accentColor: '#1976d2'
              }}
            />
            <span style={{ marginLeft: '0.5rem', cursor: 'pointer' }}>{t('register.remember')}</span>
          </label>
        </div>

        <div style={{ margin: '1rem 0' }}>
          <p style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>
            <strong>{t('register.already')}</strong>
          </p>
          <p 
            className="log" 
            onClick={() => { navigate('/logiranje'); }}
            style={{ margin: 0, cursor: 'pointer', color: '#1976d2' }}
          >
            {t('nav.login')}...
          </p>
        </div>

        <div style={{ margin: '1rem 0' }}>
          <input
            type="checkbox"
            id="register-acceptTerms"
            name="acceptTerms"
            checked={acceptedTerms}
            onChange={e => setAcceptedTerms(e.target.checked)}
          />
          <label htmlFor="register-acceptTerms" style={{ marginLeft: 8 }}>
            <span style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }} onClick={e => { e.preventDefault(); setShowTerms(true); }}>
              {t('terms_of_use_title')}
            </span>
          </label>
        </div>
        <button 
          type="submit" 
          id="register" 
          name="register" 
          className="details" 
          disabled={isSubmitting || !acceptedTerms}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: isSubmitting || !acceptedTerms ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            if (!isSubmitting && acceptedTerms) {
              e.currentTarget.style.backgroundColor = '#388e3c';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4caf50';
          }}
        >
          {isSubmitting ? (t('button.submitting') || 'Submitting...') : (t('button.register') || 'Register')}
        </button>
      </form>
      <TermsModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setAcceptedTerms(true);
          setShowTerms(false);
        }}
      />

      {/* ...removed alternative social register... */}
    </main>
  );
};

export default RegisterForm;