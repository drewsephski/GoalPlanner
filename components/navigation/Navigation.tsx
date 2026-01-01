'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserButton } from '@clerk/nextjs';
import { 
  Target, 
  LayoutDashboard, 
  Settings, 
  Plus,
  ClipboardList
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Create Goal', href: '/planner', icon: Plus },
  { name: 'Check In', href: '/check-in', icon: ClipboardList },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Goal Planner Pro</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="justify-start"
                    asChild
                  >
                    <span className="flex items-center">
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </span>
                  </Button>
                </Link>
              );
            })}
            <ThemeToggle />
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" asChild>
                <span className="flex items-center">
                  <LayoutDashboard className="h-5 w-5" />
                </span>
              </Button>
            </Link>
            <ThemeToggle />
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7",
                },
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
