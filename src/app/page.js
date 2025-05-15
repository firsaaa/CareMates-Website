// File: src/app/page.js
import React from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Caremates System</h1>
        <p className="text-xl mb-4">Sistem Manajemen Perawatan Pasien</p>
        <div className="mb-8">
          <p>Sistem ini menyediakan:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Manajemen pengguna (caregiver, pasien, admin)</li>
            <li>Manajemen pasien</li>
            <li>Penjadwalan perawatan</li>
            <li>Penugasan caregiver</li>
            <li>Pelacakan perangkat</li>
            <li>Sistem notifikasi</li>
            <li>Monitoring jarak</li>
          </ul>
        </div>
        
        <div className="border p-4 rounded-md bg-gray-50">
          <h2 className="text-2xl font-semibold mb-3">API Endpoints</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold">Users</h3>
              <ul className="list-disc pl-6">
                <li>GET /api/users</li>
                <li>POST /api/users</li>
                <li>GET /api/users/{'{id}'}</li>
                <li>PUT /api/users/{'{id}'}</li>
                <li>DELETE /api/users/{'{id}'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Patients</h3>
              <ul className="list-disc pl-6">
                <li>GET /api/patients</li>
                <li>POST /api/patients</li>
                <li>GET /api/patients/{'{id}'}</li>
                <li>PUT /api/patients/{'{id}'}</li>
                <li>DELETE /api/patients/{'{id}'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Devices</h3>
              <ul className="list-disc pl-6">
                <li>GET /api/devices</li>
                <li>POST /api/devices</li>
                <li>GET /api/devices/{'{id}'}</li>
                <li>PUT /api/devices/{'{id}'}</li>
                <li>DELETE /api/devices/{'{id}'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Assignments</h3>
              <ul className="list-disc pl-6">
                <li>GET /api/assignments</li>
                <li>POST /api/assignments</li>
                <li>GET /api/assignments/{'{id}'}</li>
                <li>PUT /api/assignments/{'{id}'}</li>
                <li>DELETE /api/assignments/{'{id}'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Jadwal</h3>
              <ul className="list-disc pl-6">
                <li>GET /api/jadwal</li>
                <li>POST /api/jadwal</li>
                <li>GET /api/jadwal/{'{id}'}</li>
                <li>PUT /api/jadwal/{'{id}'}</li>
                <li>DELETE /api/jadwal/{'{id}'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Notifikasi</h3>
              <ul className="list-disc pl-6">
                <li>GET /api/notifikasi</li>
                <li>POST /api/notifikasi</li>
                <li>GET /api/notifikasi/{'{id}'}</li>
                <li>PUT /api/notifikasi/{'{id}'}</li>
                <li>DELETE /api/notifikasi/{'{id}'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Jarak</h3>
              <ul className="list-disc pl-6">
                <li>GET /api/jarak</li>
                <li>POST /api/jarak</li>
                <li>GET /api/jarak/{'{id}'}</li>
                <li>PUT /api/jarak/{'{id}'}</li>
                <li>DELETE /api/jarak/{'{id}'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Auth</h3>
              <ul className="list-disc pl-6">
                <li>POST /api/auth/signin</li>
                <li>GET /api/auth/signout</li>
                <li>GET /api/auth/session</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}