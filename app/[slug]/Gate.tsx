"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Gate({ slug, client }: { slug: string; client: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      setError("That password doesn’t match. Please check the one we sent you.");
    } catch {
      setError("Connection problem. Please try again.");
    }
    setBusy(false);
  }

  return (
    <main className="gate">
      <div className="gate-card">
        <div className="gate-mark">AC</div>
        <p className="caps muted">Private Gallery</p>
        <h1 className="display">{client}</h1>
        <div className="rule" />
        <form onSubmit={submit}>
          <label htmlFor="pw" className="caps muted" style={{ fontSize: 11 }}>
            Enter your access password
          </label>
          <input
            id="pw"
            type="password"
            autoComplete="current-password"
            autoCapitalize="characters"
            autoFocus
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Opening…" : "View photographs"}
          </button>
          <p className="error" role="alert">{error}</p>
        </form>
        <p className="gate-foot">
          Andrea Capitanacci · Visual Storyteller
          <br />
          Need help? <a href="mailto:hola@andreacapitanacci.com">hola@andreacapitanacci.com</a>
        </p>
      </div>
    </main>
  );
}
