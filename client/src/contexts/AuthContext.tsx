import React, { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  username: string;
  stats: {
    totalPoints: number;
    winRate: number;
    // ... other stats
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  updatePoints: (newPoints: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = async (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updatePoints = (newPoints: number) => {
    if (user) {
      setUser({
        ...user,
        stats: {
          ...user.stats,
          totalPoints: user.stats.totalPoints + newPoints
        }
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        user,
        login,
        logout,
        updatePoints
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};