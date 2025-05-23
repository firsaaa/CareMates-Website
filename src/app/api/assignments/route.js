import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../lib/auth';
import { assignmentSchema } from '../../../lib/validation';
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
    
    // Try to use the API endpoint from the image
    try {
      const apiResponse = await fetch('https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/caregiver/assignments/', {
        method: 'GET',
        headers: {
          'Authorization': req.headers.get('authorization')
        }
      });
      
      if (apiResponse.ok) {
        return NextResponse.json(await apiResponse.json());
      }
    } catch (apiError) {
      console.error('Error using external API:', apiError);
      // Continue with direct database access if API fails
    }
    
    // Admin can see all assignments, caregivers can only see their own assignments
    let query;
    let params = [];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = `
        SELECT ca.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM caregiver_assignments ca
        JOIN users u ON ca.caregiver_id = u.id
        JOIN patients p ON ca.patient_id = p.id
      `;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT ca.*, u.nama as caregiver_nama, p.nama as patient_nama 
        FROM caregiver_assignments ca
        JOIN users u ON ca.caregiver_id = u.id
        JOIN patients p ON ca.patient_id = p.id
        WHERE ca.caregiver_id = $1
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
    console.error('Error getting assignments:', error);
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
    
    // Only admin can create assignments
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
    
    // Try to use the API endpoint from the image
    try {
      const apiResponse = await fetch('https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/caregiver/assignments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('authorization')
        },
        body: JSON.stringify(body)
      });
      
      if (apiResponse.ok) {
        return NextResponse.json(await apiResponse.json(), { status: 201 });
      }
    } catch (apiError) {
      console.error('Error using external API:', apiError);
      // Continue with direct database access if API fails
    }
    
    const { caregiver_id, patient_id, tanggal_mulai, tanggal_akhir } = validationResult.data;
    
    // Check if caregiver exists and has caregiver role
    const caregiverResult = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND role = $2",
      [caregiver_id, UserRole.CAREGIVER]
    );
    
    if (caregiverResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Caregiver tidak ditemukan" },
        { status: 400 }
      );
    }
    
    // Check if patient exists
    const patientResult = await pool.query(
      "SELECT * FROM patients WHERE id = $1",
      [patient_id]
    );
    
    if (patientResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Pasien tidak ditemukan" },
        { status: 400 }
      );
    }
    
    // Insert new assignment
    const result = await pool.query(
      "INSERT INTO caregiver_assignments (caregiver_id, patient_id, tanggal_mulai, tanggal_akhir) VALUES ($1, $2, $3, $4) RETURNING *",
      [caregiver_id, patient_id, tanggal_mulai, tanggal_akhir]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}