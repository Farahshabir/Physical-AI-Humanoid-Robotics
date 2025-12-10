// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

type User = {
  name: string;
  softwareBackground: string;
  hardwareBackground: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
  signup: (details: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Simulate login
  const login = (name: string) => {
    // In a real app, you'd fetch user data after login.
    // Here, we'll just use some default data for the simulation.
    setUser({ 
        name, 
        softwareBackground: 'Intermediate', 
        hardwareBackground: 'Beginner' 
    });
    setIsAuthenticated(true);
  };

  // Simulate logout
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Simulate signup
  const signup = (details: User) => {
    // In a real app, this would be an API call.
    // Here, we'll just log the user in immediately after signup.
    console.log("Signing up with BetterAuth:", details);
    setUser(details);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
