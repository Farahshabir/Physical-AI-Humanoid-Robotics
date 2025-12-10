// src/components/Auth/AuthButtons.tsx
import React, { useState } from 'react';
import { useAuth } from '@site/src/contexts/AuthContext';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import styles from './Auth.module.css';

export default function AuthButtons(): JSX.Element {
  const { isAuthenticated, user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  if (isAuthenticated) {
    return (
      <div className={styles.authButtonsContainer}>
        <span className={styles.welcomeMessage}>Welcome, {user?.name.split('@')[0]}</span>
        <button onClick={logout} className={styles.logoutButton}>Logout</button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.authButtonsContainer}>
        <button onClick={() => setShowLogin(true)} className={styles.authButton}>Login</button>
        <button onClick={() => setShowSignup(true)} className={`${styles.authButton} ${styles.signupButton}`}>Sign Up</button>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
    </>
  );
}
