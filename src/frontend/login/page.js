"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }

      // Simpan token di localStorage
      localStorage.setItem("token", data.token);

      // Redirect ke dashboard (bisa sesuaikan path)
      router.push("/dashboard");
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi.");
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#7b42f6",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        padding: "20px",
      }}
    >
      <Image src="/logo.png" alt="CareMates Logo" width={100} height={100} />

      <h1 style={{ marginTop: "1rem", fontWeight: "bold" }}>CareMates</h1>
      <p>Connect with your loved ones</p>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: "2rem",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "300px",
          gap: "1rem",
        }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />

        {error && (
          <p style={{ color: "#ffbaba", fontSize: "0.9rem", marginTop: "-0.5rem" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            backgroundColor: "#40e0d0",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            color: "#333",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>

      <button
        onClick={() => router.push("/auth/register")}
        style={{
          marginTop: "1rem",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid white",
          background: "transparent",
          color: "white",
          cursor: "pointer",
          width: "300px",
        }}
      >
        Register
      </button>
    </div>
  );
}