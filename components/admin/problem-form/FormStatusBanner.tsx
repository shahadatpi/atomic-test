import { CheckCircle, AlertCircle } from "lucide-react"

interface FormStatusBannerProps {
  status: "idle" | "success" | "error"
  errorMessage?: string
}

export function FormStatusBanner({ status, errorMessage }: FormStatusBannerProps) {
  if (status === "success") {
    return (
      <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-400/30
                      rounded-xl px-4 py-3 text-violet-400 text-sm">
        <CheckCircle className="w-4 h-4 shrink-0" />
        Problem saved successfully!
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/30
                      rounded-xl px-4 py-3 text-red-400 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {errorMessage}
      </div>
    )
  }

  return null
}
