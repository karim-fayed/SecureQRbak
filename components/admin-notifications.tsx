"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, User, Mail, CheckCircle, XCircle, Volume2, VolumeX } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  userName: string
  userEmail: string
}

interface NotificationStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

export function AdminNotifications({ showOnlyBadge = false }: { showOnlyBadge?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const previousPendingCount = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // If only showing badge, return just the count
  if (showOnlyBadge) {
    useEffect(() => {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications')
        if (!response.ok) {
          throw new Error('فشل في جلب الإشعارات')
        }
        const data = await response.json()
        setNotifications(data.notifications.passwordResetRequests || [])
        setStats(data.stats)
      } catch (err: any) {
        // Silent error for badge
      }
    }

    return <span>{stats.pending}</span>
  }

  useEffect(() => {
    fetchNotifications()
    // تحديث الإشعارات كل دقيقة
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // إشعار صوتي وشاشة عند وجود طلبات جديدة
    if (stats.pending > previousPendingCount.current && stats.pending > 0) {
      playNotificationSound()
      showBrowserNotification()
    }
    previousPendingCount.current = stats.pending
  }, [stats.pending])

  useEffect(() => {
    // إغلاق القائمة المنسدلة عند النقر خارجها
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const playNotificationSound = () => {
    if (soundEnabled) {
      // إنشاء صوت إشعار بسيط
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }
  }

  const showBrowserNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SecureQR - طلب جديد', {
        body: `لديك ${stats.pending} طلب إعادة تعيين كلمة مرور معلق`,
        icon: '/placeholder-logo.png',
        badge: '/placeholder-logo.png'
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('SecureQR - طلب جديد', {
            body: `لديك ${stats.pending} طلب إعادة تعيين كلمة مرور معلق`,
            icon: '/placeholder-logo.png',
            badge: '/placeholder-logo.png'
          })
        }
      })
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (!response.ok) {
        throw new Error('فشل في جلب الإشعارات')
      }
      const data = await response.json()
      setNotifications(data.notifications.passwordResetRequests || [])
      setStats(data.stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/password-reset-requests/${requestId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('فشل في الموافقة على الطلب')
      }

      // تحديث الإشعارات
      await fetchNotifications()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/password-reset-requests/${requestId}/reject`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('فشل في رفض الطلب')
      }

      // تحديث الإشعارات
      await fetchNotifications()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 ml-2 text-blue-600" />
            الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      {/* زر الجرس في الهيدر */}
      <div className="fixed top-4 left-4 z-50">
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            size="sm"
            className="relative bg-white shadow-lg hover:shadow-xl transition-all"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell className="h-4 w-4" />
            {stats.pending > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600"
              >
                {stats.pending}
              </Badge>
            )}
          </Button>

          {/* القائمة المنسدلة */}
          {showDropdown && (
            <Card className="absolute top-12 left-0 w-96 shadow-2xl border-2 z-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <Bell className="h-5 w-5 ml-2 text-blue-600" />
                      الإشعارات
                    </CardTitle>
                    <CardDescription>طلبات إعادة تعيين كلمة المرور المعلقة</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSound}
                    className="h-8 w-8 p-0"
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">لا توجد إشعارات</h3>
                    <p className="text-slate-500">جميع الطلبات تم التعامل معها</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 text-sm truncate">{notification.title}</h4>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
                              <div className="flex items-center mt-2 text-xs text-slate-500">
                                <Clock className="h-3 w-3 ml-1" />
                                {notification.timestamp ? format(new Date(notification.timestamp), 'PP', { locale: ar }) : 'تاريخ غير محدد'}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(notification.id)}
                              className="h-7 px-2 bg-green-600 hover:bg-green-700 text-xs"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(notification.id)}
                              className="h-7 px-2 border-red-300 text-red-600 hover:bg-red-50 text-xs"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                          عرض المزيد ({notifications.length - 5})
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* إحصائيات الإشعارات */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{stats.pending}</div>
                      <div className="text-xs text-slate-500">معلق</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{stats.approved}</div>
                      <div className="text-xs text-slate-500">موافق عليه</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{stats.rejected}</div>
                      <div className="text-xs text-slate-500">مرفوض</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* الإشعارات الكاملة في الداشبورد */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 ml-2 text-blue-600" />
                الإشعارات
              </CardTitle>
              <CardDescription>طلبات إعادة تعيين كلمة المرور المعلقة</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSound}
                className="h-8 w-8 p-0"
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-green-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                )}
              </Button>
              {stats.pending > 0 && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  {stats.pending} معلق
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">لا توجد إشعارات</h3>
              <p className="text-slate-500">جميع الطلبات تم التعامل معها</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{notification.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                        <div className="flex items-center mt-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3 ml-1" />
                          {notification.timestamp ? format(new Date(notification.timestamp), 'PPP', { locale: ar }) : 'تاريخ غير محدد'}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(notification.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-3 w-3 ml-1" />
                        موافقة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(notification.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3 ml-1" />
                        رفض
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* إحصائيات الإشعارات */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                <div className="text-xs text-slate-500">معلق</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-xs text-slate-500">موافق عليه</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-xs text-slate-500">مرفوض</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
