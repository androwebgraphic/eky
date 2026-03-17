import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ButtonProps {
  text: string;
}

const Button: React.FC<ButtonProps> = ({ text }) => {
  const navigate = useNavigate();
  return (
    <button name="go" value="submit" id="start_btn" className="sharedog-icon sharedog-Paw" onClick={() => navigate('/psi')}>
      {text}
    </button>
  );
};

export default Button;
