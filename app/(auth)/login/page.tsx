// app/api/login/page.tsx
"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {LoginForm} from "@/components/login";

function LoginContent() {
    const searchParams = useSearchParams()
    // ... rest of your component that uses searchParams

    return <LoginForm/>
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    )
}