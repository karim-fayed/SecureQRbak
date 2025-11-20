import { useState } from 'react';
import { apiClient } from "@/lib/api-client";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const result = await apiClient.login(username, password);
      setUser(result.user);
      return result;
    } finally {
      setLoading(false);
    }
  };

  return { user, login, loading };
};
