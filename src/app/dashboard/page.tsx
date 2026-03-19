"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface SensorReading {
  id: number;
  co2Level: number;
  timestamp: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contractAddress, setContractAddress] = useState("");
  const [savedContract, setSavedContract] = useState("");
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const userId = (session?.user as { id?: string })?.id || "";

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch sensor data with polling
  const fetchSensorData = useCallback(async () => {
    try {
      const res = await fetch("/api/sensor-data");
      if (res.ok) {
        const data = await res.json();
        setSensorData(data.sensorData);
      }
    } catch (err) {
      console.error("Failed to fetch sensor data:", err);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchSensorData();
      const interval = setInterval(fetchSensorData, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [session, fetchSensorData]);

  // Fetch current contract address
  useEffect(() => {
    if (session) {
      fetch("/api/contract-info")
        .then((r) => r.json())
        .then((data) => {
          if (data.contractAddress) {
            setContractAddress(data.contractAddress);
            setSavedContract(data.contractAddress);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    showToast("Company ID copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContract = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedContract(data.contractAddress);
        showToast("Contract address saved successfully!", "success");
      } else {
        showToast(data.error || "Failed to save", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const getCo2Status = (level: number) => {
    if (level > 500) return { label: "⚠ HIGH", className: "badge-danger" };
    if (level > 300) return { label: "MODERATE", className: "badge-warning" };
    return { label: "NORMAL", className: "badge-success" };
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grid">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-grid relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg fade-in-up ${
            toast.type === "success"
              ? "bg-success/20 border border-success/30 text-success"
              : "bg-danger/20 border border-danger/30 text-danger"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-primary/10 bg-surface/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
              ⛓
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">ChainReaction</h1>
              <p className="text-xs text-foreground/40">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="pulse-dot bg-success" />
              <span className="text-sm text-foreground/60">
                {session.user?.name}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              id="sign-out-btn"
              className="btn-secondary !py-2 !px-4 text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in-up">
          {/* Company ID Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🏢</span>
              <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">
                Your Company ID
              </h2>
            </div>
            <p className="text-xs text-foreground/40 mb-3">
              Use this UUID in your ESP32 / Wokwi simulator payload as <code className="text-accent bg-accent/10 px-1 rounded">companyId</code>
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-surface/80 px-4 py-3 rounded-lg text-sm font-mono text-primary-light border border-primary/10 truncate">
                {userId}
              </code>
              <button
                onClick={handleCopyId}
                id="copy-company-id-btn"
                className={`btn-secondary !py-3 !px-4 text-sm whitespace-nowrap transition-all ${
                  copied ? "!bg-success/20 !text-success !border-success/30" : ""
                }`}
              >
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>
          </div>

          {/* Contract Address Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📄</span>
              <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">
                Smart Contract
              </h2>
            </div>
            <p className="text-xs text-foreground/40 mb-3">
              Deploy your <code className="text-accent bg-accent/10 px-1 rounded">checkEmissions</code> contract and paste the address below
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                id="contract-address-input"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x..."
                className="input-field font-mono text-sm"
              />
              <button
                onClick={handleSaveContract}
                id="save-contract-btn"
                disabled={saving || !contractAddress}
                className="btn-primary !py-3 !px-5 text-sm whitespace-nowrap disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save"}
              </button>
            </div>
            {savedContract && (
              <div className="mt-3 flex items-center gap-2">
                <span className="pulse-dot bg-success" />
                <span className="text-xs text-success">
                  Contract linked: {savedContract.slice(0, 8)}...{savedContract.slice(-6)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* API Endpoint Info */}
        <div className="glass-card p-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔗</span>
            <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">
              Sensor API Endpoint
            </h2>
          </div>
          <div className="bg-surface/80 rounded-lg p-4 border border-primary/10">
            <code className="text-sm text-foreground/80">
              <span className="text-success font-bold">POST</span>{" "}
              <span className="text-primary-light">{typeof window !== 'undefined' ? window.location.origin : ''}/api/sensor</span>
            </code>
            <pre className="mt-3 text-xs text-foreground/50 overflow-x-auto">
{`{
  "companyId": "${userId}",
  "co2_level": 600
}`}
            </pre>
          </div>
        </div>

        {/* Sensor Data Table */}
        <div className="glass-card p-6 fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">
                Sensor Data History
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="pulse-dot bg-accent" />
              <span className="text-xs text-foreground/40">Auto-refreshing every 5s</span>
            </div>
          </div>

          {sensorData.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 opacity-30">📡</div>
              <p className="text-foreground/40 text-sm">
                No sensor data yet. Send a POST request to the API endpoint above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>CO₂ Level (ppm)</th>
                    <th>Status</th>
                    <th>Web3 Trigger</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {sensorData.map((reading, index) => {
                    const status = getCo2Status(reading.co2Level);
                    return (
                      <tr key={reading.id}>
                        <td className="text-foreground/40 font-mono text-xs">
                          {sensorData.length - index}
                        </td>
                        <td className="font-mono font-semibold">
                          {reading.co2Level}
                        </td>
                        <td>
                          <span className={`badge ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          {reading.co2Level > 500 ? (
                            <span className="badge badge-danger">
                              🔗 Contract Called
                            </span>
                          ) : (
                            <span className="text-foreground/30 text-sm">—</span>
                          )}
                        </td>
                        <td className="text-foreground/50 text-sm">
                          {new Date(reading.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
