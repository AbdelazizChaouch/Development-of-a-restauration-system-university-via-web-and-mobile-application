import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, login as loginApi, logout as logoutApi, isAuthenticated, getUser } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    if (isAuthenticated()) {
      setUser(getUser());
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const loggedInUser = await loginApi(email, password);
      setUser(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutApi();
    setUser(null);
  };

  const value = {
    user,
    isLoggedIn: !!user,
    login: handleLogin,
    logout: handleLogout,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 