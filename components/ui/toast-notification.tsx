"use client"

import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react"
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function ToastNotification() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, ...props }) => {
        const Icon = variant === "destructive" 
          ? XCircle 
          : variant === "success"
          ? CheckCircle2
          : variant === "warning"
          ? AlertCircle
          : Info

        return (
          <Toast
            key={id}
            {...props}
            className={`${
              variant === "destructive"
                ? "border-red-500 bg-red-50 text-red-900"
                : variant === "success"
                ? "border-green-500 bg-green-50 text-green-900"
                : variant === "warning"
                ? "border-yellow-500 bg-yellow-50 text-yellow-900"
                : "border-blue-500 bg-blue-50 text-blue-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 mt-0.5 ${
                variant === "destructive"
                  ? "text-red-600"
                  : variant === "success"
                  ? "text-green-600"
                  : variant === "warning"
                  ? "text-yellow-600"
                  : "text-blue-600"
              }`} />
              <div className="flex-1">
                {title && (
                  <ToastTitle className="font-semibold text-base mb-1">{title}</ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-sm">{description}</ToastDescription>
                )}
              </div>
              <ToastClose className="text-slate-500 hover:text-slate-900" />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}


