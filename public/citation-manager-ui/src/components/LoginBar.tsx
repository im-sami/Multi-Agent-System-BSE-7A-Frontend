import React, { useState } from 'react';
import { login, logout, me } from '../api/auth';

export function LoginBar() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password');
  const [status, setStatus] = useState<string>('Not authenticated');
  const [error, setError] = useState<string | null>(null);

  async function doLogin() {
    setError(null);
    try {
      const { user } = await login(email, password);
      setStatus(`Logged in as ${user?.email || 'unknown'}; token set`);
    } catch (e: any) {
      setError(e?.message || 'Login failed');
      setStatus('Login failed');
    }
  }

  async function doLogout() {
    setError(null);
    try {
      await logout();
      setStatus('Logged out; token cleared');
    } catch (e: any) {
      setError(e?.message || 'Logout failed');
    }
  }

  async function checkMe() {
    setError(null);
    try {
      const user = await me();
      setStatus(`Authenticated: ${user?.email || 'unknown'}`);
    } catch (e: any) {
      setError(e?.message || 'Not authenticated');
      setStatus('Not authenticated');
    }
  }

  return (
    <div className="cm-loginbar" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
      <input
        className="cm-input"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="email"
        style={{ width: 220 }}
      />
      <input
        className="cm-input"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="password"
        style={{ width: 160 }}
      />
      <button className="cm-btn cm-btn-secondary" onClick={doLogin}>Login</button>
      <button className="cm-btn cm-btn-secondary" onClick={doLogout}>Logout</button>
      <button className="cm-btn cm-btn-secondary" onClick={checkMe}>Check</button>
      <span className="cm-helper-text" style={{ marginLeft: 8 }}>{status}</span>
      {error && <span className="cm-error-text" style={{ marginLeft: 8 }}>{error}</span>}
    </div>
  );
}
