import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../lib/auth';
import { notifikasiSchema } from '../../../lib/validation';
import { UserRole } from '../../../lib/constants';

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Admin can see all notifications, caregivers can only see their own notifications
    let query;
    let params = [];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = `
        SELECT n.*, p.nama as pasien_nama, u.nama as caregiver_nama 
        FROM notifikasi n
        JOIN patients p ON n.pasien_id = p.id
        JOIN users u ON n.caregiver_id = u.id
      `;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT n.*, p.nama as pasien_nama, u.nama as caregiver_nama 
        FROM notifikasi n
        JOIN patients p ON n.pasien_id = p.id
        JOIN users u ON n.caregiver_id = u.id
        WHERE n.caregiver_id = $1
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
    console.error('Error getting notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Admin and system can create notifications
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate input
    const validationResult = notifikasiSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { pasien_id, caregiver_id, jenis, pesan, waktu_dikirim, status_baca } = validationResult.data;
    
    // Check if caregiver is assigned to patient
    const assignmentResult = await pool.query(
      'SELECT * FROM caregiver_assignments WHERE caregiver_id = $1 AND patient_id = $2',
      [caregiver_id, pasien_id]
    );
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Caregiver tidak ditugaskan untuk pasien ini' },
        { status: 400 }
      );
    }
    
    // Insert new notification
    const result = await pool.query(
      'INSERT INTO notifikasi (pasien_id, caregiver_id, jenis, pesan, waktu_dikirim, status_baca) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [pasien_id, caregiver_id, jenis, pesan, waktu_dikirim, status_baca]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}