"use client";

import Link from "next/link";

export default function Navbar({ user, onLogout }) {
  return (
    <header className="glass border-b border-white/10 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center font-bold">
          M
        </div>
        <span className="font-semibold text-lg">MemoryTalk</span>
      </Link>
      <nav className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-white/70 hidden sm:inline">
              {user.name}
            </span>
            <Link href="/chat" className="btn-ghost text-sm">
              Chat
            </Link>
            <button onClick={onLogout} className="btn-primary text-sm">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn-ghost text-sm">
              Login
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
