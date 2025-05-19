import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../../lib/auth';
import { assignmentSchema } from '../../../../lib/validation';
import { UserRole } from '../../../../lib/constants';

export async function GET(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const assignmentId = parseInt(params.id);
    
    // Check if user has access to this assignment
    let query;
    let queryParams = [assignmentId];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = `
        SELECT ca.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM caregiver_assignments ca
        JOIN users u ON ca.caregiver_id = u.id
        JOIN patients p ON ca.patient_id = p.id
        WHERE ca.id = $1
      `;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT ca.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM caregiver_assignments ca
        JOIN users u ON ca.caregiver_id = u.id
        JOIN patients p ON ca.patient_id = p.id
        WHERE ca.id = $1 AND ca.caregiver_id = $2
      `;
      queryParams.push(user.id);
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const result = await pool.query(query, queryParams);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const assignmentId = parseInt(params.id);
    
    // Only admin can update assignments
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate input
    const validationResult = assignmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { caregiver_id, patient_id, tanggal_mulai, tanggal_akhir } = validationResult.data;
    
    // Check if caregiver exists and has caregiver role
    const caregiverResult = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [caregiver_id, UserRole.CAREGIVER]
    );
    
    if (caregiverResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Caregiver tidak ditemukan' },
        { status: 400 }
      );
    }
    
    // Check if patient exists
    const patientResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [patient_id]
    );
    
    if (patientResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pasien tidak ditemukan' },
        { status: 400 }
      );
    }
    
    // Update assignment
    const result = await pool.query(
      'UPDATE caregiver_assignments SET caregiver_id = $1, patient_id = $2, tanggal_mulai = $3, tanggal_akhir = $4 WHERE id = $5 RETURNING *',
      [caregiver_id, patient_id, tanggal_mulai, tanggal_akhir, assignmentId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const assignmentId = parseInt(params.id);
    
    // Only admin can delete assignments
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete assignment
    const result = await pool.query(
      'DELETE FROM caregiver_assignments WHERE id = $1 RETURNING id',
      [assignmentId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}