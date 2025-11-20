export const apiClient = {
  // دالة لتسجيل الدخول
  login: async (username: string, password: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-railway-url';

      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(`Login failed with status: ${response.status}`);
      }

      const data = await response.json();

      // تخزين الـ token في الكوكيز وليس في localStorage
      if (data.token) {
        document.cookie = `authToken=${data.token}; path=/; secure; HttpOnly; SameSite=Lax`;
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // دالة لتسجيل الخروج
  logout: () => {
    document.cookie = 'authToken=; Max-Age=0; path=/; secure; HttpOnly; SameSite=Lax';
    console.log('User logged out');
  },

  // دالة للحصول على بيانات المستخدم باستخدام JWT من الكوكيز
  getCurrentUser: async () => {
    try {
      const token = getCookie('authToken');
      if (!token) throw new Error('Token not found. Please log in.');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/current-user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // دالة للتحقق من صحة رمز JWT
  validateToken: async () => {
    try {
      const token = getCookie('authToken');
      if (!token) throw new Error('Token not found. Please log in.');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validate-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) throw new Error('Invalid token');
      return await response.json();
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  },
};

// دالة للمساعدة في قراءة الكوكيز
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}
