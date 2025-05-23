import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../lib/auth';
import { deviceSchema } from '../../../lib/validation';
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
      const apiResponse = await fetch('https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/devices/', {
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
    
    // Admin can see all devices, caregivers can only see devices of assigned patients
    let query;
    let params = [];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = 'SELECT * FROM devices';
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT d.* FROM devices d
        JOIN patients p ON d.id = p.device_id
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
    console.error('Error getting devices:', error);
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
    
    // Only admin can create devices
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate input
    const validationResult = deviceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Try to use the API endpoint from the image
    try {
      const apiResponse = await fetch('https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/devices/', {
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
    
    const { serial_number, tipe, status, last_synced_at } = validationResult.data;
    
    // Check if device with serial number already exists
    const existingDevice = await pool.query(
      "SELECT * FROM devices WHERE serial_number = $1", 
      [serial_number]
    );
    
    if (existingDevice.rows.length > 0) {
      return NextResponse.json(
        { error: "Device dengan serial number tersebut sudah terdaftar" }, 
        { status: 400 }
      );
    }
    
    // Insert new device
    const result = await pool.query(
      "INSERT INTO devices (serial_number, tipe, status, last_synced_at) VALUES ($1, $2, $3, $4) RETURNING *",
      [serial_number, tipe, status, last_synced_at]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    );
  }
}