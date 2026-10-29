import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) { setError('Please fill in all fields.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    const res = register(name.trim(), email.trim(), password);
    if (res.ok) navigate('/dashboard');
    else setError(res.error ?? 'Registration failed.');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="inline-block bg-accent-600 text-white px-3 py-1 rounded text-lg font-bold mb-2">AC</span>
          <h1 className="text-2xl font-bold text-gray-800">ACare</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Register</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Name</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Confirm password</label>
              <input type="password" className="form-input" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center">Create account</button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
