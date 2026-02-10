import { SignedIn, SignedOut } from "@clerk/nextjs";
import HomeView from "@/components/home/home";
import Dashboard from "@/components/dashboard/dashboard";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
      <SignedOut>
        <HomeView />
      </SignedOut>

      <SignedIn>
        <Dashboard />
      </SignedIn>
    </div>
  );
}
