import { NextResponse } from "next/server"
import pool from "../../../lib/db"
import { userSchema } from "../../../lib/validation"
import { hashPassword } from "../../../lib/auth"

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = userSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { nama, email, no_telepon, password, role, patient_id } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }
    
    // Hash password
    const password_hash = await hashPassword(password);
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (nama, email, no_telepon, password_hash, role, patient_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nama, email, role',
      [nama, email, no_telepon, password_hash, role, patient_id]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}