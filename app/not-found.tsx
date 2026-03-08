'use client'
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 bg-background">

            <Image
                src="/AtomicTestLogo.png"
                width={200}
                height={200}
                alt="Atomic Test logo"
                priority
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 object-contain mb-6"
            />

            <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-md text-center space-y-3">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground">404</h1>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Page Not Found</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Could not find the requested page. It may have been moved or doesn't exist.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <Link href="/" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">Back to Home</Button>
                    </Link>
                    <Link href="/api/dashboard" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto">Dashboard</Button>
                    </Link>
                </div>
            </div>

        </div>
    );
}

export default NotFoundPage;