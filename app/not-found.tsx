import Link from "next/link"
import { Button } from "@/components/ui/button"
import { QrCode } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <QrCode className="h-24 w-24 mx-auto text-slate-400 mb-4" />
          <h1 className="text-6xl font-bold text-slate-800 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-slate-600 mb-4">الصفحة غير موجودة</h2>
          <p className="text-slate-500 mb-8">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">العودة للصفحة الرئيسية</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">لوحة التحكم</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

