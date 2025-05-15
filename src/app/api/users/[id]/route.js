import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { getUserFromRequest, isAuthorized, hashPassword } from '../../../lib/auth';
import { UserRole } from '../../../lib/constants';

export async function GET(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const userId = parseInt(params.id);
    
    // Users can only access their own data unless they're admin
    if (user.id !== userId && !isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const result = await pool.query(
      'SELECT id, nama, email, no_telepon, role, patient_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const userId = parseInt(params.id);
    
    // Users can only update their own data unless they're admin
    if (user.id !== userId && !isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { nama, no_telepon, password } = body;
    
    // Build update query dynamically
    let updateFields = [];
    let queryParams = [];
    let paramCounter = 1;
    
    if (nama !== undefined) {
      updateFields.push(`nama = $${paramCounter++}`);
      queryParams.push(nama);
    }
    
    if (no_telepon !== undefined) {
      updateFields.push(`no_telepon = $${paramCounter++}`);
      queryParams.push(no_telepon);
    }
    
    if (password !== undefined) {
      const password_hash = await hashPassword(password);
      updateFields.push(`password_hash = $${paramCounter++}`);
      queryParams.push(password_hash);
    }
    
    // If no fields to update
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // Add userId as the last parameter
    queryParams.push(userId);
    
    // Update user
    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING id, nama, email, no_telepon, role`,
      queryParams
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const userId = parseInt(params.id);
    
    // Only admin can delete users
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete user
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}