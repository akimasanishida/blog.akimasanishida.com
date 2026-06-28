import Link from "next/link";
import { ModeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "./ui/button";
import { auth, signOut } from "@/auth";

export default async function Header() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-[var(--background)]/30 backdrop-blur-sm z-50 py-4 px-6 flex justify-between items-center text-sm shadow-sm">
      <div className="font-bold text-xl">
        <Link href="/">西田明正のブログ</Link>
      </div>

      {/* Desktop Navigation */}
      <nav className="flex items-center space-x-4 hidden md:block">
        <ul className="list-none flex flex-row m-0 p-0 items-center gap-4">
          <li>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">ブログについて</Link>
            </Button>
          </li>
          <li>
            <Button asChild variant="outline" size="lg">
              <Link href="/admin">管理用</Link>
            </Button>
          </li>
          <li>
            {isLoggedIn ? (
              <form action={signOutAction}>
                <Button variant="default" size="lg">
                  ログアウト
                </Button>
              </form>
            ) : (
              <Button asChild variant="outline" size="lg">
                <Link href="/login">ログイン</Link>
              </Button>
            )}
          </li>
          <li>
            <ModeToggle />
          </li>
        </ul>
      </nav>

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <MobileNav isLoggedIn={isLoggedIn} signOutAction={signOutAction} />
      </div>
    </nav>
  );
}
