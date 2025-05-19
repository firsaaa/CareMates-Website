import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../../lib/auth';
import { jadwalSchema } from '../../../../lib/validation';
import { UserRole } from '../../../../lib/constants';

export async function GET(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const jadwalId = parseInt(params.id);
    
    // Check if user has access to this schedule
    let query;
    let queryParams = [jadwalId];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = `
        SELECT j.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM jadwal j
        JOIN users u ON j.caregiver_id = u.id
        JOIN patients p ON j.patient_id = p.id
        WHERE j.id = $1
      `;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT j.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM jadwal j
        JOIN users u ON j.caregiver_id = u.id
        JOIN patients p ON j.patient_id = p.id
        WHERE j.id = $1 AND j.caregiver_id = $2
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
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const jadwalId = parseInt(params.id);
    
    // Get current schedule
    const currentSchedule = await pool.query(
      'SELECT * FROM jadwal WHERE id = $1',
      [jadwalId]
    );
    
    if (currentSchedule.rows.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update this schedule
    if (user.role === UserRole.CAREGIVER && user.id !== currentSchedule.rows[0].caregiver_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // If caregiver is updating, they can only update status
    if (user.role === UserRole.CAREGIVER) {
      const { status } = body;
      
      if (!status) {
        return NextResponse.json(
          { error: 'Status harus disertakan' },
          { status: 400 }
        );
      }
      
      // Update schedule status
      const result = await pool.query(
        'UPDATE jadwal SET status = $1 WHERE id = $2 RETURNING *',
        [status, jadwalId]
      );
      
      return NextResponse.json(result.rows[0]);
    }
    
    // Admin can update all fields
    // Validate input
    const validationResult = jadwalSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { caregiver_id, patient_id, tanggal, jam_mulai, jam_selesai, tugas, status } = validationResult.data;
    
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
    
    // Update schedule
    const result = await pool.query(
      'UPDATE jadwal SET caregiver_id = $1, patient_id = $2, tanggal = $3, jam_mulai = $4, jam_selesai = $5, tugas = $6, status = $7 WHERE id = $8 RETURNING *',
      [caregiver_id, patient_id, tanggal, jam_mulai, jam_selesai, tugas, status, jadwalId]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const jadwalId = parseInt(params.id);
    
    // Only admin can delete schedules
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete schedule
    const result = await pool.query(
      'DELETE FROM jadwal WHERE id = $1 RETURNING id',
      [jadwalId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}