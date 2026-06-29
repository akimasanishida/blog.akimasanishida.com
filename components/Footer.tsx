import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-8 py-6 text-sm text-muted-foreground">
      <div className="mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-12">
        <ul className="list-none flex flex-wrap gap-x-4 gap-y-2 m-0 p-0 mb-3">
          <li>
            <Link href="/about" className="hover:underline">
              ブログについて
            </Link>
          </li>
          <li>
            <Link href="/" className="hover:underline">
              トップへ戻る
            </Link>
          </li>
          <li>
            <a
              href="https://x.com/akimasa_nishida"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              X (@akimasa_nishida)
            </a>
          </li>
          <li>
            <a
              href="https://github.com/akimasanishida"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              GitHub (@akimasanishida)
            </a>
          </li>
        </ul>
        <p className="m-0">© 2026 Akimasa NISHIDA. All rights reserved.</p>
      </div>
    </footer>
  );
}
