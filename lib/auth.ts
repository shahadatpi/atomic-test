import { betterAuth } from "better-auth"
import { Pool } from "pg"

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
    database: new Pool({
        connectionString: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: false }
    }),
    emailAndPassword: { enabled: true },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }
    }
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user