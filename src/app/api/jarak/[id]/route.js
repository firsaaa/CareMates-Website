import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../../lib/auth';
import { jarakSchema } from '../../../../lib/validation';
import { UserRole } from '../../../../lib/constants';

export async function GET(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const jarakId = parseInt(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has access to this distance
    let query;
    let queryParams = [jarakId];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = `
        SELECT j.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM jarak j
        JOIN users u ON j.id_caregiver = u.id
        JOIN patients p ON j.id_patient = p.id
        WHERE j.id = $1
      `;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT j.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM jarak j
        JOIN users u ON j.id_caregiver = u.id
        JOIN patients p ON j.id_patient = p.id
        WHERE j.id = $1 AND j.id_caregiver = $2
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
        { error: 'Distance not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting distance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const jarakId = parseInt(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get current distance
    const currentDistance = await pool.query(
      'SELECT * FROM jarak WHERE id = $1',
      [jarakId]
    );
    
    if (currentDistance.rows.length === 0) {
      return NextResponse.json(
        { error: 'Distance not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update this distance
    if (user.role === UserRole.CAREGIVER && user.id !== currentDistance.rows[0].id_caregiver) {
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
    
    // If caregiver is updating, they can only update for themselves
    if (user.role === UserRole.CAREGIVER && user.id !== id_caregiver) {
      return NextResponse.json(
        { error: 'Anda hanya dapat mengupdate jarak untuk diri sendiri' },
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
    
    // Update distance
    const result = await pool.query(
      'UPDATE jarak SET id_caregiver = $1, id_patient = $2, jarak_terakhir = $3, waktu_pengukuran = $4 WHERE id = $5 RETURNING *',
      [id_caregiver, id_patient, jarak_terakhir, waktu_pengukuran, jarakId]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating distance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const jarakId = parseInt(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admin can delete distances
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete distance
    const result = await pool.query(
      'DELETE FROM jarak WHERE id = $1 RETURNING id',
      [jarakId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Distance not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Distance deleted successfully' });
  } catch (error) {
    console.error('Error deleting distance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}