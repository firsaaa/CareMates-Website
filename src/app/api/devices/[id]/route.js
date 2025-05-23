import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../../lib/auth';
import { deviceSchema } from '../../../../lib/validation';
import { UserRole } from '../../../../lib/constants';

export async function GET(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const deviceId = parseInt(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Try to use the API endpoint from the image
    try {
      const apiResponse = await fetch(`https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/devices/${deviceId}`, {
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
    
    // Check if user has access to this device
    let hasAccess = false;
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      hasAccess = true;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      const assignment = await pool.query(`
        SELECT * FROM caregiver_assignments ca
        JOIN patients p ON ca.patient_id = p.id
        WHERE ca.caregiver_id = $1 AND p.device_id = $2
      `, [user.id, deviceId]);
      
      hasAccess = assignment.rows.length > 0;
    }
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const result = await pool.query(
      'SELECT * FROM devices WHERE id = $1',
      [deviceId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const deviceId = parseInt(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admin can update devices
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
      const apiResponse = await fetch(`https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('authorization')
        },
        body: JSON.stringify(body)
      });
      
      if (apiResponse.ok) {
        return NextResponse.json(await apiResponse.json());
      }
    } catch (apiError) {
      console.error('Error using external API:', apiError);
      // Continue with direct database access if API fails
    }
    
    const { serial_number, tipe, status, last_synced_at } = validationResult.data;
    
    // Check if another device with the same serial number exists
    const existingDevice = await pool.query(
      'SELECT * FROM devices WHERE serial_number = $1 AND id != $2',
      [serial_number, deviceId]
    );
    
    if (existingDevice.rows.length > 0) {
      return NextResponse.json(
        { error: 'Device dengan serial number tersebut sudah terdaftar' },
        { status: 400 }
      );
    }
    
    // Update device
    const result = await pool.query(
      'UPDATE devices SET serial_number = $1, tipe = $2, status = $3, last_synced_at = $4 WHERE id = $5 RETURNING *',
      [serial_number, tipe, status, last_synced_at, deviceId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const deviceId = parseInt(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admin can delete devices
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Try to use the API endpoint from the image
    try {
      const apiResponse = await fetch(`https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/devices/${deviceId}`, {
        method: 'DELETE',
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
    
    // Check if device is assigned to any patient
    const assignedPatient = await pool.query(
      'SELECT * FROM patients WHERE device_id = $1',
      [deviceId]
    );
    
    if (assignedPatient.rows.length > 0) {
      return NextResponse.json(
        { error: 'Device masih digunakan oleh pasien' },
        { status: 400 }
      );
    }
    
    // Delete device
    const result = await pool.query(
      'DELETE FROM devices WHERE id = $1 RETURNING id',
      [deviceId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}