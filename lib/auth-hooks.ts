// lib/auth-hooks.ts
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // محاولة تحميل المستخدم من التخزين المحلي إذا كان قد تم تسجيل الدخول مسبقًا
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // دالة تسجيل الدخول
  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null); // إعادة تعيين الأخطاء السابقة
    try {
      // تحقق من أن المدخلات غير فارغة
      if (!username || !password) {
        throw new Error("اسم المستخدم وكلمة المرور مطلوبان");
      }

      // إرسال طلب إلى الخادم لتسجيل الدخول
      const result = await apiClient.login(username, password);

      // التحقق من نتيجة الخادم
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user)); // تخزين البيانات في localStorage

        // تخزين الـ token في localStorage أو sessionStorage إذا لزم الأمر
        if (result.token) {
          localStorage.setItem('auth-token', result.token);
        }

        return result;
      } else {
        throw new Error(result.error || "حدث خطأ أثناء تسجيل الدخول");
      }
    } catch (err: any) {
      // التعامل مع الأخطاء
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // دالة تسجيل الخروج
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth-token');
  };

  return { user, login, logout, loading, error };
};
