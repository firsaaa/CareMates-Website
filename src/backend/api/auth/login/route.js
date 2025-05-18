import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { loginSchema } from '../../../../lib/validation';
import { comparePassword, generateToken } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { email, password } = validationResult.data;
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    return NextResponse.json({
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}