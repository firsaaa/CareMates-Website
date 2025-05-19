"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_telepon: "",
    password: "",
    role: "caregiver", 
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registrasi gagal");
        return;
      }

      setSuccess("Registrasi berhasil! Silakan login.");
      setTimeout(() => router.push("/auth/login"), 2000);
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

      <h1 style={{ marginTop: "1rem", fontWeight: "bold" }}>Register</h1>

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
          name="nama"
          type="text"
          placeholder="Nama"
          value={form.nama}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <input
          name="no_telepon"
          type="text"
          placeholder="No Telepon"
          value={form.no_telepon}
          onChange={handleChange}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />

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
          Register
        </button>

        <button
        onClick={() => router.push("/auth/login")}
        style={{
          marginTop: "0rem",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid white",
          background: "transparent",
          color: "white",
          cursor: "pointer",
          width: "300px",
        }}
      >
        Login
      </button>
      </form>
    </div>
  );
}