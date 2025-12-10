// src/components/Auth/SignupModal.tsx
import React, { useState } from 'react';
import { useAuth } from '@site/src/contexts/AuthContext';
import styles from './Auth.module.css';

type Props = {
  onClose: () => void;
};

export default function SignupModal({ onClose }: Props): JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [software, setSoftware] = useState('Beginner');
  const [hardware, setHardware] = useState('Beginner');
  const { signup } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup({
      name,
      softwareBackground: software,
      hardwareBackground: hardware,
    });
    onClose(); // Close modal after signup
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <h2 className={styles.modalTitle}>Sign Up with BetterAuth</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label>What is your software background?</label>
            <select value={software} onChange={(e) => setSoftware(e.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Expert</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>What is your hardware background?</label>
            <select value={hardware} onChange={(e) => setHardware(e.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Expert</option>
            </select>
          </div>
          <button type="submit" className={styles.submitButton}>Create Account</button>
        </form>
      </div>
    </div>
  );
}
