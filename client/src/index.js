import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import "./sass/index.scss";
import './i18n';
import { AuthProvider } from './contexts/AuthContext';
import App from "./App";
import './css/modal.css';
import './css/mobile-fixes.css';
import './css/doglist-details-modal.css';

ReactDOM.render(
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>,
  document.getElementById("root")
);