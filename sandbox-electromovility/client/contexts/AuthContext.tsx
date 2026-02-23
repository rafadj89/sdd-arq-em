import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  company_name: string;
  country_code: string;
  party_id: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    company_name: string;
    country_code: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default test user
const DEFAULT_TEST_USER = {
  username: "sandbox-upme",
  password: "sandbox",
};

// Mock user database (in production, this would be a real backend)
const mockUsers: Record<string, { password: string; user: User }> = {
  "sandbox-upme": {
    password: "sandbox",
    user: {
      id: "user-001",
      username: "sandbox-upme",
      email: "developer@sandbox.upme.gov.co",
      company_name: "UPME Sandbox",
      country_code: "CO",
      party_id: "UPME",
      created_at: "2025-01-01T00:00:00Z",
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("upme_auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("upme_auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const userRecord = mockUsers[username];
      if (!userRecord || userRecord.password !== password) {
        throw new Error("Invalid username or password");
      }

      const userData = userRecord.user;
      setUser(userData);
      localStorage.setItem("upme_auth_user", JSON.stringify(userData));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    company_name: string;
    country_code: string;
  }) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if user already exists
      if (mockUsers[userData.username]) {
        throw new Error("Username already exists");
      }

      if (Object.values(mockUsers).some((u) => u.user.email === userData.email)) {
        throw new Error("Email already registered");
      }

      // Generate party_id from username
      const partyId = userData.username.substring(0, 3).toUpperCase();

      const newUser: User = {
        id: `user-${Date.now()}`,
        username: userData.username,
        email: userData.email,
        company_name: userData.company_name,
        country_code: userData.country_code,
        party_id: partyId,
        created_at: new Date().toISOString(),
      };

      // Add to mock database
      mockUsers[userData.username] = {
        password: userData.password,
        user: newUser,
      };

      setUser(newUser);
      localStorage.setItem("upme_auth_user", JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("upme_auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
