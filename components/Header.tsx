import Link from "next/link";
import { ModeToggle } from "@/components/ThemeToggle";

export default function Header() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-[var(--background)]/30 backdrop-blur-sm z-50 py-4 px-6 flex justify-between items-center text-sm shadow-sm">
      <div className="font-bold text-xl">
        <Link href="/">西田明正のブログ</Link>
      </div>
      <nav className="flex items-center space-x-4">
        <ul className="list-none flex flex-row m-0 p-0 items-center gap-4">
          <li className="md:mr-4">
            <Link href="/about">About</Link>
          </li>
          <li className="md:mr-4">
            <ModeToggle />
          </li>
        </ul>
      </nav>
    </nav>
  );
}
