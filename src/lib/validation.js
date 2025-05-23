import { z } from 'zod';
import { UserRole, NotifType, JadwalStatus } from './constants';

export const userSchema = z.object({
  nama: z.string().min(1, "Nama tidak boleh kosong"),
  email: z.string().email("Email tidak valid"),
  no_telepon: z.string().optional(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum([UserRole.ADMIN, UserRole.CAREGIVER, UserRole.PATIENT]),
  patient_id: z.number().optional(),
});

export const patientSchema = z.object({
  nama: z.string().min(1, "Nama tidak boleh kosong"),
  alamat: z.string().optional(),
  tanggal_lahir: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  jenis_kelamin: z.string().optional(),
  penyakit: z.string().optional(),
  device_id: z.number().optional(),
})

export const deviceSchema = z.object({
  serial_number: z.string().min(1, "Serial number tidak boleh kosong"),
  tipe: z.string().min(1, "Tipe tidak boleh kosong"),
  status: z.string().min(1, "Status tidak boleh kosong"),
  last_synced_at: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export const assignmentSchema = z.object({
  caregiver_id: z.number(),
  patient_id: z.number(),
  tanggal_mulai: z.string().transform(val => new Date(val)),
  tanggal_akhir: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export const jadwalSchema = z.object({
  caregiver_id: z.number(),
  patient_id: z.number(),
  tanggal: z.string().transform(val => new Date(val)),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
  tugas: z.string(),
  status: z.enum([JadwalStatus.TERJADWAL, JadwalStatus.SELESAI, JadwalStatus.DIBATALKAN]),
});

export const notifikasiSchema = z.object({
  pasien_id: z.number(),
  caregiver_id: z.number(),
  jenis: z.enum([NotifType.JADWAL, NotifType.DARURAT, NotifType.SISTEM]),
  pesan: z.string(),
  waktu_dikirim: z.string().optional().transform(val => val ? new Date(val) : new Date()),
  status_baca: z.boolean().optional().default(false),
});

export const jarakSchema = z.object({
  id_caregiver: z.number(),
  id_patient: z.number(),
  jarak_terakhir: z.number(),
  waktu_pengukuran: z.string().optional().transform(val => val ? new Date(val) : new Date()),
});

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

export const registerSchema = z.object({
  nama: z.string().min(2, "Nama harus minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  no_telepon: z.string().optional(),
  password: z.string().min(6, "Password harus minimal 6 karakter"),
  admin_key: z.string().min(1, "Admin key wajib diisi"),
})
