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
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      remember: false
    }
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
    <main style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <h2 style={{ margin: 0 }}>{t('login.title')}</h2>
      <form 
        id="login-form" 
        onSubmit={handleSubmit(onSubmit)}
        style={{ marginTop: 0 }}
      >
        {loginError && (
          <div className="error" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', border: '1px solid #e57373', borderRadius: '4px' }}>
            {loginError}
          </div>
        )}
        
        <label htmlFor="login-email">{t('register.email')}</label>
        <input type="email" id="login-email" name="email" autoComplete="email" placeholder={t('register.email')} autoFocus {...register('email')} />
        <p className="error">{errors.email?.message as string}</p>

        <label htmlFor="login-password">{t('register.password')}</label>
        <input type="password" id="login-password" name="password" autoComplete="current-password" placeholder={t('register.password')} {...register('password')} />
        <p className="error">{errors.password?.message as string}</p>

        <label htmlFor="login-remember" style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '0.5rem',
          marginBottom: '1rem'
        }}>
          <input 
            type="checkbox" 
            id="login-remember" 
            name="remember" 
            checked={watch('remember') === true}
            onChange={(e) => setValue('remember', e.target.checked)}
            autoComplete="off" 
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              accentColor: '#1976d2'
            }}
          />
          <span style={{ cursor: 'pointer', fontSize: '1rem' }}>{t('login.remember')}</span>
        </label>

        {/* Action buttons side by side */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            id="login" 
            type="submit" 
            disabled={isSubmitting}
            style={{
              flex: '2.5',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#388e3c';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#4caf50';
            }}
          >
            {isSubmitting ? (t('button.submitting') || 'Submitting...') : (t('button.login') || 'Login')}
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/registracija')}
            style={{
              flex: '3',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#75171a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#5c1114';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#75171a';
            }}
          >
            {t('button.register')}
          </button>
        </div>
      </form>
      {/* ...removed alternative social login... */}
    </main>
  );
};

export default LoginForm;