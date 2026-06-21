import Link from "next/link";
import { ModeToggle, ModeToggleMobile } from "@/components/ThemeToggle";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { MenuIcon } from "lucide-react";
import { auth, signOut } from "@/auth";

export default async function Header() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

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
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg">
              <MenuIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/about">ブログについて</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/admin">管理用</Link>
              </DropdownMenuItem>
              {isLoggedIn ? (
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full text-left">
                      ログアウト
                    </button>
                  </DropdownMenuItem>
                </form>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/login">ログイン</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <ModeToggleMobile />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
