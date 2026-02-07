import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import About from './pages/About';
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import AdddogForm from './pages/AdddogForm';
import DogList from './pages/DogList';
import AuthCallback from './pages/AuthCallback';
import AdoptionRequests from './AdoptionRequests';

const Navbar: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<About />} />
      <Route path="/logiranje" element={<LoginForm />} />
      <Route path="/registracija" element={<RegisterForm />} />
      <Route path="/psi/*" element={<DogList />} />
      <Route path="/dogs/*" element={<Navigate to="/psi" replace />} />
      <Route path="/dodajpsa" element={<AdddogForm />} />
      <Route path="/zahtjevi-za-posvajanjem" element={<AdoptionRequests />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
};

export default Navbar;
