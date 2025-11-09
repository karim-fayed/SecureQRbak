"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, User, Mail, CheckCircle, XCircle } from "lucide-react"
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

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
    // تحديث الإشعارات كل دقيقة
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
          {stats.pending > 0 && (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              {stats.pending} معلق
            </Badge>
          )}
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
                        {format(new Date(notification.timestamp), 'PPP', { locale: ar })}
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
  )
}
