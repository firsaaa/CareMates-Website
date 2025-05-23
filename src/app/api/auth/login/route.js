import { NextResponse } from 'next/server';
import { loginSchema } from '../../../../lib/validation';

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
    
    // Use the external API
    try {
      console.log('Mencoba login melalui API eksternal...');
      
      const apiResponse = await fetch('https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000)
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
        
        // PENTING: Pastikan format token benar
        // Format respons sesuai yang diharapkan frontend
        const formattedResponse = {
          token: responseData.access_token,
          user: {
            id: 1,
            nama: body.email.split('@')[0],
            email: body.email,
            role: 'admin'
          }
        };
        
        console.log('Formatted response for frontend:', {
          token: formattedResponse.token.substring(0, 20) + '...',
          user: formattedResponse.user
        });
        
        return NextResponse.json(formattedResponse);
      }
      
      // Jika API merespons dengan error
      return NextResponse.json(
        { error: responseData.error || 'Login gagal' },
        { status: apiResponse.status }
      );
      
    } catch (apiError) {
      console.error('Error mengakses API eksternal:', apiError);
      return NextResponse.json(
        { error: 'Tidak dapat terhubung ke server' },
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('Error saat proses login:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}