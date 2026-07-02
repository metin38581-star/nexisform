"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Modal } from "@/components/Modal";
import type { Gender, SessionUser } from "@/lib/types";

type AuthMode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: SessionUser) => Promise<void> | void;
  initialMode?: AuthMode;
}

export function AuthModal({
  open,
  onClose,
  onSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender>("kadin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setGender("kadin");
    setError(null);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("E-posta ve şifre zorunludur.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (mode === "register" && !username.trim()) {
      setError("Kullanıcı adı zorunludur.");
      return;
    }

    setLoading(true);
    try {
      const auth = await import("@/lib/auth");

      if (mode === "login") {
        const user = await auth.signIn(email, password);
        await onSuccess(user);
        resetForm();
        onClose();
        return;
      }

      const user = await auth.signUp({
        username: username.trim(),
        email: email.trim(),
        password,
        gender,
      });

      await onSuccess(user);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
    >
      <div className="mb-5 flex rounded-xl bg-slate-900/60 p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "login"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Giriş Yap
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "register"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Kayıt Ol
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label
              htmlFor="auth-username"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Kullanıcı Adı
            </label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="örn. ayse42"
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
              autoComplete="username"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="auth-email"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            E-posta
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Şifre
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="En az 6 karakter"
            className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        </div>

        {mode === "register" && (
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Cinsiyet
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender("kadin")}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  gender === "kadin"
                    ? "border-pink-500/50 bg-pink-500/10 text-pink-300"
                    : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600"
                }`}
              >
                Kadın
              </button>
              <button
                type="button"
                onClick={() => setGender("erkek")}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  gender === "erkek"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                    : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600"
                }`}
              >
                Erkek
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
        </button>
      </form>
    </Modal>
  );
}
