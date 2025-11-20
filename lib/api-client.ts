// /lib/api-client.ts
export const apiClient = {
  login: async (username: string, password: string) => {
    try {
      // استخدام البيئة المتغيرة لعنوان API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-railway-url';

      // إرسال الطلب عبر HTTPS
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // التحقق من حالة الاستجابة
      if (!response.ok) {
        throw new Error(`Login failed with status: ${response.status}`);
      }

      // جلب البيانات من الاستجابة
      const data = await response.json();

      // إذا كان هناك رمز توثيق (JWT)، نقوم بتخزينه في localStorage أو الكوكيز (حسب الحاجة)
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);

      // في حالة وجود خطأ، يتم إعادة الخطأ ليمكن معالجته في الجزء الذي يستدعي الدالة
      throw error;
    }
  },

  // دالة لتسجيل الخروج وحذف رمز المصادقة
  logout: () => {
    localStorage.removeItem('authToken');
    console.log('User logged out');
  },

  // دالة للحصول على معلومات المستخدم من الخادم باستخدام JWT المخزن في localStorage
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('authToken');

      // التأكد من وجود الرمز في localStorage
      if (!token) {
        throw new Error('Token not found. Please log in.');
      }

      // استخدام الرمز المميز لطلب بيانات المستخدم من API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/current-user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // التحقق من حالة الاستجابة
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // دالة للتحقق من صلاحية رمز JWT
  validateToken: async () => {
    try {
      const token = localStorage.getItem('authToken');

      // التأكد من وجود الرمز في localStorage
      if (!token) {
        throw new Error('Token not found. Please log in.');
      }

      // التحقق من صحة الرمز عبر الـ API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validate-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      return await response.json();
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  },
};
