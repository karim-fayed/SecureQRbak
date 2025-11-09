"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // تحديد الأيقونة واللون حسب نوع Toast
        const Icon = variant === "destructive" 
          ? XCircle 
          : CheckCircle2
        const iconColor = variant === "destructive"
          ? "text-red-600"
          : "text-green-600"
        const bgColor = variant === "destructive"
          ? "bg-red-50 border-red-200"
          : "bg-green-50 border-green-200"
        const textColor = variant === "destructive"
          ? "text-red-900"
          : "text-green-900"

        return (
          <Toast 
            key={id} 
            {...props}
            className={`${bgColor} ${textColor} shadow-xl border-2`}
          >
            <div className="flex items-start gap-3 w-full">
              <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <div className="flex-1 grid gap-1">
                {title && (
                  <ToastTitle className="font-semibold text-base">{title}</ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-sm opacity-90">
                    {description}
                  </ToastDescription>
                )}
              </div>
              {action}
              <ToastClose className={`${textColor} opacity-70 hover:opacity-100`} />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
