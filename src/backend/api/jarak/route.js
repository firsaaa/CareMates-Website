import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../lib/auth';
import { jarakSchema } from '../../lib/validation';
import { UserRole } from '../../lib/constants';

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    
    // Admin can see all distances, caregivers can only see their own distances
    let query;
    let params = [];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = `
        SELECT j.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM jarak j
        JOIN users u ON j.id_caregiver = u.id
        JOIN patients p ON j.id_patient = p.id
      `;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT j.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM jarak j
        JOIN users u ON j.id_caregiver = u.id
        JOIN patients p ON j.id_patient = p.id
        WHERE j.id_caregiver = $1
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
    console.error('Error getting distances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    
    // Admin and caregivers can create distances
    if (!isAuthorized(user, [UserRole.ADMIN, UserRole.CAREGIVER])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate input
    const validationResult = jarakSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { id_caregiver, id_patient, jarak_terakhir, waktu_pengukuran } = validationResult.data;
    
    // If caregiver is creating distance, they can only create for themselves
    if (user.role === UserRole.CAREGIVER && user.id !== id_caregiver) {
      return NextResponse.json(
        { error: 'Anda hanya dapat membuat jarak untuk diri sendiri' },
        { status: 403 }
      );
    }
    
    // Check if caregiver is assigned to patient
    const assignmentResult = await pool.query(
      'SELECT * FROM caregiver_assignments WHERE caregiver_id = $1 AND patient_id = $2',
      [id_caregiver, id_patient]
    );
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Caregiver tidak ditugaskan untuk pasien ini' },
        { status: 400 }
      );
    }
    
    // Insert new distance
    const result = await pool.query(
      'INSERT INTO jarak (id_caregiver, id_patient, jarak_terakhir, waktu_pengukuran) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_caregiver, id_patient, jarak_terakhir, waktu_pengukuran]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating distance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}