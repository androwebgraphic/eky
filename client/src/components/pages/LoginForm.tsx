import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string>('');

  const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (window.location.protocol === 'https:') {
      return `https://${window.location.hostname}`;
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return `http://172.20.10.2:3001`;
  };

  // ...removed social login handler...

  const schema = yup.object().shape({
    email: yup.string().email(t('validation.emailInvalid')).required(t('validation.emailRequired')),
    password: yup
      .string()
      .min(4, t('validation.passwordMin', { min: 4 }))
      .max(20)
      .required(t('validation.passwordRequired')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    console.log('🔐 LOGIN ATTEMPT:', data.email);
    setIsSubmitting(true);
    setLoginError('');
    
    try {
      const result = await login(data.email, data.password);
      console.log('🔐 LOGIN RESULT:', result);
      
      if (result.success) {
        console.log('✅ Login successful, navigating to home');
        navigate('/');
      } else {
        console.log('❌ Login failed:', result.error);
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      setLoginError('Network error. Please check your connection and try again.');
    } finally {
      console.log('🔐 Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h2>{t('login.title')}</h2>
      <form id="login-form" onSubmit={handleSubmit(onSubmit)}>
        {loginError && (
          <div className="error" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', border: '1px solid #e57373', borderRadius: '4px' }}>
            {loginError}
          </div>
        )}
        
        <label htmlFor="login-email">{t('register.email')}</label>
        <input type="email" id="login-email" name="email" autoComplete="email" placeholder={t('register.email')} {...register('email')} />
        <p className="error">{errors.email?.message as string}</p>

        <label htmlFor="login-password">{t('register.password')}</label>
        <input type="password" id="login-password" name="password" autoComplete="current-password" placeholder={t('register.password')} {...register('password')} />
        <p className="error">{errors.password?.message as string}</p>

        <button id="login" className="details" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (t('button.submitting') || 'Submitting...') : (t('button.login') || 'Login')}
        </button>
        
        {/* Debug button - Remove after testing */}
        <button 
          type="button" 
          onClick={() => {
            console.log('🔍 DEBUG: Current state - isSubmitting:', isSubmitting, 'loginError:', loginError);
            setIsSubmitting(false); // Force reset
          }}
          style={{ marginLeft: '10px', backgroundColor: '#ff9800', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px' }}
        >
          Reset Button
        </button>
      </form>

      <p>
        {t('login.remember')} <input type="checkbox" id="login-remember" name="remember" autoComplete="off" {...register('remember')} />
      </p>
      {/* ...removed alternative social login... */}
    </main>
  );
};

export default LoginForm;
