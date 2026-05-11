import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const login = useCallback((data) => {
    // data: { token, role, name }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ name: data.name, role: data.role }));
    setToken(data.token);
    setUser({ name: data.name, role: data.role });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
