import {
    NavigationMenu, NavigationMenuContent,
    NavigationMenuItem, NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger, navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import MenuCard from "@/components/shared/header/menu-card";

export const AtomicMenu = () => {
    return (
        <div className="hidden lg:block">
            <NavigationMenu className="relative z-[60]">
                <NavigationMenuList className="gap-1">
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Classes</NavigationMenuTrigger>
                        <NavigationMenuContent className="z-[70]">
                            <div className="w-[520px] p-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <MenuCard href="/products/higherSecondary" title="Class 12" desc="Physics, Chemistry, Mathematics" />
                                    <MenuCard href="/products/automation" title="Class 9 or 10" desc="Physics, Chemistry, Mathematics" />
                                    <MenuCard href="/products/integrations" title="Core Engineering" desc="CSE, EEE, ME, CE, IPE" />
                                    <MenuCard href="/products/security" title="Professional Skills" desc="Data Science" />
                                </div>
                            </div>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="">Pricing</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/docs">Docs</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/contact">Contact</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                </NavigationMenuList>
            </NavigationMenu>
        </div>
    );
};