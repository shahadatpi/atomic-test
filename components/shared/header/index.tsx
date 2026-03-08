"use client";
import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import { AtomicMenu } from "@/components/shared/header/menu";
import ModeToggler from "@/components/shared/header/ModeToggler";
import MenuRight from "@/components/shared/header/menu-right";

export default function Header() {

    return (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                {/* Brand */}
                <Link href="/" className="text-lg font-semibold tracking-tight">
                    <Image src="/AtomicTestLogo.png" alt="Atomic Test" width={80} height={80} loading={'eager'} priority={true}/>
                </Link>

                <AtomicMenu />
                <MenuRight />
            </div>
        </header>
    );
}