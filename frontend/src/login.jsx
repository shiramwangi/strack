// src/login.jsx
import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Sprout, Lock, Mail, Loader2, User, ShieldCheck } from 'lucide-react';

const AuthPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { email, password, confirmPassword, fullName } = formData;

    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      let userCredential;
      
      if (isRegistering) {
        // 1. Create the account
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // 2. Set the display name in Firebase
        await updateProfile(userCredential.user, { displayName: fullName });
      } else {
        // Login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      // 3. CAPTURE TOKEN IMMEDIATELY (The Redirect Fix)
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('shamba_token', token);
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err.code);
      if (err.code === 'auth/email-already-in-use') setError('Email already registered.');
      else if (err.code === 'auth/invalid-credential') setError('Wrong email or password.');
      else if (err.code === 'auth/weak-password') setError('Password is too weak.');
      else setError('Authentication error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ backgroundColor: isRegistering ? '#eff6ff' : '#f0fdf4', width: '64px', height: '64px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', transition: '0.3s' }}>
            {isRegistering ? <ShieldCheck size={32} color="#2563eb" /> : <Sprout size={32} color="#22c55e" />}
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.02em' }}>
            {isRegistering ? 'Join the Team' : 'Welcome Back'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            {isRegistering ? 'Create your agent profile to start tracking.' : 'Access your agriculture dashboard.'}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fff1f2', color: '#be123c', padding: '12px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px', textAlign: 'center', border: '1px solid #ffe4e6', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {isRegistering && (
            <div className="input-group">
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={iconStyle} />
                <input name="fullName" placeholder="Mwangi Chiira" required style={inputStyle} value={formData.fullName} onChange={handleInputChange} />
              </div>
            </div>
          )}

          <div className="input-group">
            <label style={labelStyle}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={iconStyle} />
              <input name="email" type="email" placeholder="mwngichiira@gmail.com" required style={inputStyle} value={formData.email} onChange={handleInputChange} />
            </div>
          </div>

          <div className="input-group">
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={iconStyle} />
              <input name="password" type="password" placeholder="••••••••" required style={inputStyle} value={formData.password} onChange={handleInputChange} />
            </div>
          </div>

          {isRegistering && (
            <div className="input-group">
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={iconStyle} />
                <input name="confirmPassword" type="password" placeholder="••••••••" required style={inputStyle} value={formData.confirmPassword} onChange={handleInputChange} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ 
            marginTop: '10px',
            backgroundColor: isRegistering ? '#2563eb' : '#22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            height: '48px', fontSize: '16px', fontWeight: '600'
          }}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : (isRegistering ? 'Create Agent Account' : 'Secure Login')}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {isRegistering ? 'Already have an account?' : "New to the platform?"}
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              style={{ background: 'none', border: 'none', color: isRegistering ? '#2563eb' : '#22c55e', fontWeight: '700', cursor: 'pointer', marginLeft: '6px' }}
            >
              {isRegistering ? 'Login instead' : 'Register here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Styles to keep the JSX clean
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.025em' };
const inputStyle = { width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' };
const iconStyle = { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };

export default AuthPage;