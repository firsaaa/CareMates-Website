import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../lib/auth';
import { patientSchema } from '../../../lib/validation';
import { UserRole } from '../../../lib/constants';

export async function GET(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const patientId = parseInt(params.id);
    
    // Check if user has access to this patient
    let hasAccess = false;
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      hasAccess = true;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      const assignment = await pool.query(
        'SELECT * FROM caregiver_assignments WHERE caregiver_id = $1 AND patient_id = $2',
        [user.id, patientId]
      );
      
      hasAccess = assignment.rows.length > 0;
    }
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const result = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [patientId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const patientId = parseInt(params.id);
    
    // Only admin can update patients
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate input
    const validationResult = patientSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { nama, alamat, tanggal_lahir, jenis_kelamin, penyakit, device_id } = validationResult.data;
    
    // Update patient
    const result = await pool.query(
      'UPDATE patients SET nama = $1, alamat = $2, tanggal_lahir = $3, jenis_kelamin = $4, penyakit = $5, device_id = $6 WHERE id = $7 RETURNING *',
      [nama, alamat, tanggal_lahir, jenis_kelamin, penyakit, device_id, patientId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const patientId = parseInt(params.id);
    
    // Only admin can delete patients
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete patient
    const result = await pool.query(
      'DELETE FROM patients WHERE id = $1 RETURNING id',
      [patientId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}