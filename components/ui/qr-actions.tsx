"use client"

import { Button } from "@/components/ui/button"
import { Download, Eye, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface QRActionsProps {
  qrCodeImage?: string
  verificationCode: string
  name: string
}

export function QRActions({ qrCodeImage, verificationCode, name }: QRActionsProps) {
  const { toast } = useToast()
  const [showPreview, setShowPreview] = useState(false)

  const handleDownload = () => {
    if (!qrCodeImage) return
    
    try {
      const link = document.createElement('a')
      link.href = qrCodeImage
      link.download = `${name}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "تم التنزيل!",
        description: "تم تنزيل رمز QR بنجاح."
      })
    } catch (error) {
      console.error("Error downloading QR code:", error)
      toast({
        variant: "destructive",
        title: "خطأ في التنزيل",
        description: "حدث خطأ أثناء تنزيل رمز QR."
      })
    }
  }

  const handleViewQR = () => {
    if (!qrCodeImage) return
    window.open(qrCodeImage, '_blank')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {qrCodeImage ? (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 w-9 min-w-[2.25rem] p-0" 
            title="تنزيل الرمز"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 w-9 min-w-[2.25rem] p-0" 
            title="عرض الرمز"
            onClick={handleViewQR}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" className="h-9 w-9 min-w-[2.25rem] p-0" title="تنزيل الرمز" disabled>
          <Download className="h-4 w-4" />
        </Button>
      )}
      <Link href={`/verify/${verificationCode}`} target="_blank">
        <Button variant="outline" size="sm" className="h-9 w-9 min-w-[2.25rem] p-0" title="التحقق من الرمز">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
} 