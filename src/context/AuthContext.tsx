import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '../types';
import { userStorage, sessionStorage_ } from '../utils/storage';

interface AuthContextType {
  currentUser: UserProfile | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Restore session
    const id = sessionStorage_.getCurrentUserId();
    if (id) {
      const users = userStorage.getAll();
      const found = users.find(u => u.id === id);
      if (found) setCurrentUser(found);
    }
  }, []);

  function login(email: string, password: string): { ok: boolean; error?: string } {
    const user = userStorage.findByEmail(email);
    if (!user) return { ok: false, error: 'No account found with that email.' };
    if (user.passwordHash !== password) return { ok: false, error: 'Incorrect password.' };
    setCurrentUser(user);
    sessionStorage_.setCurrentUser(user.id);
    return { ok: true };
  }

  function register(name: string, email: string, password: string): { ok: boolean; error?: string } {
    if (userStorage.findByEmail(email)) return { ok: false, error: 'An account with this email already exists.' };
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash: password,
      tariffPerKwh: 6.5,
      createdAt: new Date().toISOString().split('T')[0],
    };
    userStorage.add(newUser);
    setCurrentUser(newUser);
    sessionStorage_.setCurrentUser(newUser.id);
    return { ok: true };
  }

  function logout() {
    setCurrentUser(null);
    sessionStorage_.clearCurrentUser();
  }

  function updateUser(user: UserProfile) {
    userStorage.update(user);
    setCurrentUser(user);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
