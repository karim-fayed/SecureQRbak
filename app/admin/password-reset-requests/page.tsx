"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, Mail, User } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface PasswordResetRequest {
  _id: string
  userName: string
  userEmail: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requestedAt: string
  approvedAt?: string
  approvedBy?: string
  notes?: string
}

export default function PasswordResetRequests() {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/password-reset-requests')
      if (!response.ok) {
        throw new Error('فشل في جلب طلبات إعادة تعيين كلمة المرور')
      }
      const data = await response.json()
      setRequests(data.requests)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const response = await fetch(`/api/admin/password-reset-requests/${requestId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('فشل في الموافقة على الطلب')
      }

      // Refresh the list
      await fetchRequests()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const response = await fetch(`/api/admin/password-reset-requests/${requestId}/reject`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('فشل في رفض الطلب')
      }

      // Refresh the list
      await fetchRequests()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />معلق</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />موافق عليه</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />مرفوض</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />مكتمل</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">طلبات إعادة تعيين كلمة المرور</h1>
        <p className="text-slate-600 mt-2">مراجعة وإدارة طلبات إعادة تعيين كلمة المرور من المستخدمين</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">لا توجد طلبات</h3>
              <p className="text-slate-500 text-center">لم يتم العثور على أي طلبات إعادة تعيين كلمة مرور</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-slate-500" />
                    <div>
                      <CardTitle className="text-lg">{request.userName}</CardTitle>
                      <CardDescription>{request.userEmail}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>تاريخ الطلب:</span>
                    <span>{format(new Date(request.requestedAt), 'PPP', { locale: ar })}</span>
                  </div>

                  {request.approvedAt && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>تاريخ الموافقة:</span>
                      <span>{format(new Date(request.approvedAt), 'PPP', { locale: ar })}</span>
                    </div>
                  )}

                  {request.notes && (
                    <div className="bg-slate-50 p-3 rounded-md">
                      <p className="text-sm text-slate-700">{request.notes}</p>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={() => handleApprove(request._id)}
                        disabled={processingId === request._id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === request._id ? 'جاري المعالجة...' : 'الموافقة وإعادة التعيين'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject(request._id)}
                        disabled={processingId === request._id}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        رفض الطلب
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
