import React, { useState } from 'react';
import axios from 'axios';
import './SignupPage.css';
import { API_URL, DASHBOARD_URL } from '../../config';

const SignupPage = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSuccess = (data) => {
    // Store on this origin
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    // Pass token via URL to dashboard (different origin = separate localStorage)
    const userEncoded = encodeURIComponent(JSON.stringify(data));
    window.location.assign(
      `${DASHBOARD_URL}?token=${data.token}&user=${userEncoded}`
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, loginData);
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect email or password.');
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, signupData);
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fh-auth-page">
      <div className={`fh-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">

        {/* ── SIGN UP FORM ─────────────────────────────────────── */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignup}>
            <h1>Create Account</h1>
            <span>Use your email for registration</span>

            {error && isRightPanelActive && (
              <p className="fh-error">{error}</p>
            )}

            <input
              type="text" placeholder="Full Name" required
              value={signupData.name}
              onChange={e => setSignupData({ ...signupData, name: e.target.value })}
            />
            <input
              type="email" placeholder="Email" required
              value={signupData.email}
              onChange={e => setSignupData({ ...signupData, email: e.target.value })}
            />
            <input
              type="password" placeholder="Password" required
              value={signupData.password}
              onChange={e => setSignupData({ ...signupData, password: e.target.value })}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* ── SIGN IN FORM ─────────────────────────────────────── */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <h1>Sign In</h1>
            <span>Use your account</span>

            {error && !isRightPanelActive && (
              <p className="fh-error">{error}</p>
            )}

            <input
              type="email" placeholder="Email" required
              value={loginData.email}
              onChange={e => setLoginData({ ...loginData, email: e.target.value })}
            />
            <input
              type="password" placeholder="Password" required
              value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* ── SLIDING OVERLAY ───────────────────────────────────── */}
        <div className="overlay-container">
          <div className="overlay">

            {/* Left overlay panel (shown when right-panel-active → user on sign-up, wants to go back to sign-in) */}
            <div className="overlay-panel overlay-left">
              <img src="/assets/FINANCEHUB.png" alt="FinanceHub" className="overlay-logo" />
              <p>Already have an account? Sign in and pick up where you left off.</p>
              <button className="ghost" onClick={() => { setIsRightPanelActive(false); setError(''); }}>
                Sign In
              </button>
            </div>

            {/* Right overlay panel (shown by default → invite user to sign up) */}
            <div className="overlay-panel overlay-right">
              <img src="/assets/FINANCEHUB.png" alt="FinanceHub" className="overlay-logo" />
              <p>New here? Join FinanceHub and start tracking your investments today.</p>
              <button className="ghost" onClick={() => { setIsRightPanelActive(true); setError(''); }}>
                Sign Up
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SignupPage;