// src/components/Auth/LoginModal.tsx
import React, { useState } from 'react';
import { useAuth } from '@site/src/contexts/AuthContext';
import styles from './Auth.module.css';

type Props = {
  onClose: () => void;
};

export default function LoginModal({ onClose }: Props): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd verify the password. Here we just log in with the email as the name.
    login(email);
    onClose(); // Close modal after login
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <h2 className={styles.modalTitle}>Login with BetterAuth</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className={styles.submitButton}>Log In</button>
        </form>
      </div>
    </div>
  );
}
