"use client";

import { UserButton, useUser} from "@clerk/nextjs";
import { Icons } from "../common/icons";
import Link from "next/link";

export default function Header() {
  const { user, isLoaded } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-rose-100/40 bg-white/80 backdrop-blur-md transition-all">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Logo Section - Clickable to go Home */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20 transition-all group-hover:shadow-rose-500/30 group-hover:scale-105">
            <Icons.fileText className="h-5 w-5 text-white" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Doc<span className="text-rose-600">Assistant</span>
          </h1>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
          ) : user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200/60">
               <span className="hidden text-sm font-medium text-slate-500 sm:inline-block">
                  Hi, {user.firstName}
               </span>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9 ring-2 ring-white hover:ring-rose-200 transition-all",
                    userButtonPopoverCard: "shadow-xl border border-rose-100",
                    userButtonPopoverActionButtonIcon: "text-rose-500",
                  },
                }}
              />
            </div>
          ) : (
             // Show nothing or a simple "Sign In" if they are logged out
             // (Optional: You can add a text Login button here if you want)
             <div />
          )}
        </div>
      </div>
    </header>
  );
}