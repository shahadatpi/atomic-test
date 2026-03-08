import React from 'react'
import {Sheet, SheetContent, SheetTrigger, SheetClose} from "@/components/ui/sheet";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {X,Menu} from "lucide-react";

export default function ModeToggler() {
    const [mobileOpen, setMobileOpen] = React.useState(false)
    return (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open menu"
                >
                    {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
            </SheetTrigger>

            {/* Sheet content (slide-over menu) */}
            <SheetContent side="right" className="p-6 bg-background dark:bg-gray-800">
                {/* Close Button inside the Sheet */}
                <SheetClose asChild>
                    <Button variant="link" className="absolute top-4 right-4">
                        Close
                    </Button>
                </SheetClose>

                <div className="space-y-4">
                    <Link href="/products/analytics" onClick={() => setMobileOpen(false)}>
                        <Button variant="link" className="w-full text-left">Analytics</Button>
                    </Link>
                    <Link href="/products/automation" onClick={() => setMobileOpen(false)}>
                        <Button variant="link" className="w-full text-left">Automation</Button>
                    </Link>
                    <Link href="/products/integrations" onClick={() => setMobileOpen(false)}>
                        <Button variant="link" className="w-full text-left">Integrations</Button>
                    </Link>
                    <Link href="/products/security" onClick={() => setMobileOpen(false)}>
                        <Button variant="link" className="w-full text-left">Security</Button>
                    </Link>

                    <div className="my-4 border-t border-gray-700"></div>

                    <Link href={'/pricing'} onClick={() => setMobileOpen(false)}>
                        <Button variant="link" className="w-full text-left">Pricing</Button>
                    </Link>
                    <Link href="/docs" onClick={() => setMobileOpen(false)}>
                        <Button variant="link" className="w-full text-left">Docs</Button>
                    </Link>
                    <Link href="/contact" onClick={() => setMobileOpen(false)}>
                        <Button variant="link" className="w-full text-left">Contact</Button>
                    </Link>

                    <Link href="/api/sign-up" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full">Sign Up</Button>
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    )
}
