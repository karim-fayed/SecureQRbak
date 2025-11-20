import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // محاولة تحميل المستخدم من الكوكيز إذا كان قد تم تسجيل الدخول مسبقًا
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const storedUser = await apiClient.getCurrentUser();
        setUser(storedUser);
      } catch (err) {
        console.error("Error loading user:", err);
        setError("خطأ في تحميل بيانات المستخدم. يرجى تسجيل الدخول.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // دالة تسجيل الدخول
  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null); // إعادة تعيين الأخطاء السابقة
    try {
      if (!username || !password) {
        throw new Error("اسم المستخدم وكلمة المرور مطلوبان");
      }

      const result = await apiClient.login(username, password);

      if (result.success && result.user) {
        setUser(result.user);

        // تخزين بيانات المستخدم في localStorage أو الكوكيز
        localStorage.setItem('user', JSON.stringify(result.user));

        // تخزين الـ token في الكوكيز أو sessionStorage
        if (result.token) {
          document.cookie = `authToken=${result.token}; path=/; secure; HttpOnly; SameSite=Lax`;
        }

        return result;
      } else {
        throw new Error(result.error || "حدث خطأ أثناء تسجيل الدخول");
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // دالة تسجيل الخروج
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    document.cookie = 'authToken=; Max-Age=0; path=/; secure; HttpOnly; SameSite=Lax';
  };

  return { user, login, logout, loading, error };
};
