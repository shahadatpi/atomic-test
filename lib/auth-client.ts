import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_ATOMIC_AUTH_BASE_URL_INTERNAL ?? "https://atomic-test.onrender.com",
})

export const { signIn, signOut, signUp, useSession } = authClient