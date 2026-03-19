"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        companyName,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grid">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
            ⛓
          </div>
          <span className="text-xl font-bold gradient-text">ChainReaction</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="pulse-dot bg-success" />
          <span className="text-sm text-foreground/50">IoT + Web3</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-16 px-8 py-12 max-w-7xl mx-auto min-h-[calc(100vh-100px)]">
        {/* Left: Hero */}
        <div className="flex-1 max-w-xl fade-in-up">
          <div className="badge badge-success mb-6">
            <span className="pulse-dot bg-success" />
            Workshop Edition
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="gradient-text">IoT Meets</span>
            <br />
            <span className="text-foreground">Blockchain</span>
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed mb-8">
            Monitor CO₂ emissions from your IoT sensors in real-time.
            When levels exceed the threshold, smart contracts are triggered
            automatically on-chain — enabling <strong className="text-primary-light">transparent</strong>, <strong className="text-accent">decentralized</strong> environmental compliance.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-foreground/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Next.js + Prisma
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Ethers.js + Web3
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              ESP32 Sensor API
            </div>
          </div>
        </div>

        {/* Right: Auth Form */}
        <div className="w-full max-w-md fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="glass-card p-8">
            {/* Tab switch */}
            <div className="flex mb-8 bg-surface/50 rounded-xl p-1">
              <button
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isLogin ? "bg-primary text-white shadow-lg" : "text-foreground/50 hover:text-foreground/80"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                  !isLogin ? "bg-primary text-white shadow-lg" : "text-foreground/50 hover:text-foreground/80"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground/60 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  id="company-name-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Industries"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/60 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                id="auth-submit-btn"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-foreground/30">
              {isLogin
                ? "New here? Switch to Sign Up to create an account."
                : "Already have an account? Switch to Sign In."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
