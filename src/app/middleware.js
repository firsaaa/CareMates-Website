import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export function middleware(request) {
  // Exclude auth routes from middleware
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse(
      JSON.stringify({ message: 'Authentication required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  if (!user) {
    return new NextResponse(
      JSON.stringify({ message: 'Invalid or expired token' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  // Add user to request headers for route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id.toString());
  requestHeaders.set('x-user-role', user.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
};