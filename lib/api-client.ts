// /lib/api-client.ts
export const apiClient = {
  login: async (username: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Login error:", error);
      throw error;  // إعادة الخطأ
    }
  }
};

