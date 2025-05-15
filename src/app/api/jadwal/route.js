import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../lib/auth';
import { jadwalSchema } from '../../lib/validation';
import { UserRole } from '../../lib/constants';

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    
    // Admin can see all schedules, caregivers can only see their own schedules
    let query;
    let params = [];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = `
        SELECT j.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM jadwal j
        JOIN users u ON j.caregiver_id = u.id
        JOIN patients p ON j.patient_id = p.id
      `;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT j.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM jadwal j
        JOIN users u ON j.caregiver_id = u.id
        JOIN patients p ON j.patient_id = p.id
        WHERE j.caregiver_id = $1
      `;
      params = [user.id];
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const result = await pool.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error getting schedules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    
    // Admin and caregivers can create schedules
    if (!isAuthorized(user, [UserRole.ADMIN, UserRole.CAREGIVER])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate input
    const validationResult = jadwalSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { caregiver_id, patient_id, tanggal, jam_mulai, jam_selesai, tugas, status } = validationResult.data;
    
    // If caregiver is creating schedule, they can only create for themselves
    if (user.role === UserRole.CAREGIVER && user.id !== caregiver_id) {
      return NextResponse.json(
        { error: 'Anda hanya dapat membuat jadwal untuk diri sendiri' },
        { status: 403 }
      );
    }
    
    // Check if caregiver is assigned to patient
    const assignmentResult = await pool.query(
      'SELECT * FROM caregiver_assignments WHERE caregiver_id = $1 AND patient_id = $2',
      [caregiver_id, patient_id]
    );
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Caregiver tidak ditugaskan untuk pasien ini' },
        { status: 400 }
      );
    }
    
    // Insert new schedule
    const result = await pool.query(
      'INSERT INTO jadwal (caregiver_id, patient_id, tanggal, jam_mulai, jam_selesai, tugas, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [caregiver_id, patient_id, tanggal, jam_mulai, jam_selesai, tugas, status]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}