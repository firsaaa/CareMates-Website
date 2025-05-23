// import { NextResponse } from 'next/server';
// import pool from '../../../../lib/db';
// import { loginSchema } from '../../../../lib/validation';
// import { comparePassword, generateToken } from '../../../../lib/auth';

// export async function POST(req) {
//   try {
//     const body = await req.json();
    
//     // Validate input
//     const validationResult = loginSchema.safeParse(body);
//     if (!validationResult.success) {
//       return NextResponse.json(
//         { error: validationResult.error.errors },
//         { status: 400 }
//       );
//     }
    
//     // Try to use the API endpoint from the image
//     try {
//       const apiResponse = await fetch('https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/auth/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(body)
//       });
      
//       if (apiResponse.ok) {
//         return NextResponse.json(await apiResponse.json());
//       }
//     } catch (apiError) {
//       console.error('Error using external API:', apiError);
//       // Continue with direct database access if API fails
//     }
    
//     const { email, password } = validationResult.data;
    
//     // Find user
//     const result = await pool.query(
//       'SELECT * FROM users WHERE email = $1',
//       [email]
//     );
    
//     if (result.rows.length === 0) {
//       return NextResponse.json(
//         { error: 'Email atau password salah' },
//         { status: 401 }
//       );
//     }
    
//     const user = result.rows[0];
    
//     // Verify password
//     const isPasswordValid = await comparePassword(password, user.password_hash);
//     if (!isPasswordValid) {
//       return NextResponse.json(
//         { error: 'Email atau password salah' },
//         { status: 401 }
//       );
//     }
    
//     // Generate token
//     const token = generateToken({
//       id: user.id,
//       email: user.email,
//       role: user.role
//     });
    
//     return NextResponse.json({
//       user: {
//         id: user.id,
//         nama: user.nama,
//         email: user.email,
//         role: user.role
//       },
//       token
//     });
//   } catch (error) {
//     console.error('Error logging in:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server';
import { loginSchema } from '../../../../lib/validation';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('Validasi input gagal:', validationResult.error.errors);
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Censor password in logs
    const logSafeBody = { ...body, password: body.password ? '********' : undefined };
    console.log('Mencoba login dengan:', logSafeBody);
    
    // Use the external API
    try {
      console.log('Mencoba login melalui API eksternal...');
      
      const apiResponse = await fetch('https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000) // Timeout setelah 10 detik
      });
      
      console.log('API response status:', apiResponse.status);
      
      // Coba mendapatkan respons JSON
      let responseData;
      try {
        responseData = await apiResponse.json();
        console.log('API response data:', responseData);
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        return NextResponse.json(
          { error: 'Gagal memproses respons dari server' },
          { status: 500 }
        );
      }
      
      // Jika API merespons sukses
      if (apiResponse.ok) {
        console.log('Login berhasil melalui API eksternal');
        return NextResponse.json(responseData);
      }
      
      // Jika API merespons dengan error 401 Unauthorized
      if (apiResponse.status === 401) {
        console.log('Login gagal: Kredensial tidak valid');
        return NextResponse.json(
          { error: responseData.error || 'Email atau password salah' },
          { status: 401 }
        );
      }
      
      // Jika API merespons dengan error lain
      console.log('Login gagal dengan status:', apiResponse.status);
      return NextResponse.json(
        { error: responseData.error || `Login gagal dengan kode status ${apiResponse.status}` },
        { status: apiResponse.status }
      );
      
    } catch (apiError) {
      console.error('Error mengakses API eksternal:', apiError.message);
      
      // Jika error karena timeout
      if (apiError.name === 'TimeoutError' || apiError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Server tidak merespons. Silakan coba lagi nanti.' },
          { status: 504 } // Gateway Timeout
        );
      }
      
      // Error lainnya (network, dll)
      return NextResponse.json(
        { error: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' },
        { status: 503 } // Service Unavailable
      );
    }
    
  } catch (error) {
    console.error('Error saat proses login:', error);
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan. Silakan coba lagi nanti.' },
      { status: 500 }
    );
  }
}