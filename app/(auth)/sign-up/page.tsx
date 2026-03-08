// app/sign-up/page.tsx
import { Suspense } from "react"
import {SignupForm} from "@/components/signup-form";

export default function SignUpPage() {
    return (
        <Suspense fallback={null}>
            <SignupForm />
        </Suspense>
    )
}
