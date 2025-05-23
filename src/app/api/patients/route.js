import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../lib/auth';
import { patientSchema } from '../../../lib/validation';
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
      const apiResponse = await fetch('https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/patients/', {
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
    
    // Admin can see all patients, caregivers can only see assigned patients
    let query;
    let params = [];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = 'SELECT * FROM patients';
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT p.* FROM patients p
        JOIN caregiver_assignments ca ON p.id = ca.patient_id
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
    console.error('Error getting patients:', error);
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
    
    // Only admin can create patients
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
    
    // Try to use the API endpoint from the image
    try {
      const apiResponse = await fetch('https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/patients/', {
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
    
    const { nama, alamat, tanggal_lahir, jenis_kelamin, penyakit, device_id } = validationResult.data;
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");
      
      let patientDeviceId = device_id;
      
      // If device_id is provided, check if it exists
      if (device_id) {
        const deviceExists = await client.query("SELECT * FROM devices WHERE id = $1", [device_id]);
        
        if (deviceExists.rows.length === 0) {
          // Device doesn't exist, create a default one
          const newDevice = await client.query(
            "INSERT INTO devices (serial_number, tipe, status) VALUES ($1, $2, $3) RETURNING id",
            [`AUTO-${Date.now()}`, "Default Device", "aktif"]
          );
          
          patientDeviceId = newDevice.rows[0].id;
        }
      }
      
      // Insert new patient
      const result = await client.query(
        "INSERT INTO patients (nama, alamat, tanggal_lahir, jenis_kelamin, penyakit, device_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [nama, alamat, tanggal_lahir, jenis_kelamin, penyakit, patientDeviceId]
      );
      
      await client.query("COMMIT");
      
      return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}