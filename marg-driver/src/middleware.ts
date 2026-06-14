import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  user_id: number;
  role: string;
  exp: number;
  requires_password_change?: boolean;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/driver/login') || pathname.startsWith('/employee/login');

  if (!token) {
    if (!isAuthPage) {
      if (pathname.startsWith('/ops')) return NextResponse.redirect(new URL('/employee/login', request.url));
      if (pathname === '/' || pathname.startsWith('/driver')) return NextResponse.redirect(new URL('/driver/login', request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (isExpired) {
      // Let the frontend interceptor handle refresh if possible,
      // but for server routing, if we know it's expired, it's safer to allow
      // the request to proceed so the client can attempt a refresh via axios.
      // Alternatively, we could clear it here, but let's let the client handle it.
    }

    const role = decoded.role;
    const requiresPasswordChange = decoded.requires_password_change;

    // Handle mandatory password change
    const isChangePasswordPage = pathname === '/change-password';
    
    if (requiresPasswordChange && !isChangePasswordPage && !isAuthPage) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
    
    if (!requiresPasswordChange && isChangePasswordPage) {
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (role === 'EMPLOYEE') return NextResponse.redirect(new URL('/ops/dashboard', request.url));
      if (role === 'DRIVER') return NextResponse.redirect(new URL('/', request.url));
    }

    // Role-based routing guard
    if (isAuthPage && !requiresPasswordChange) {
      // Redirect logged-in users away from login
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (role === 'EMPLOYEE') return NextResponse.redirect(new URL('/ops/dashboard', request.url));
      if (role === 'DRIVER') return NextResponse.redirect(new URL('/', request.url)); // Driver HUD is root (or /driver/dashboard)
    }

    // Protect Role-Specific Routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (pathname.startsWith('/ops') && role !== 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname === '/' && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (pathname === '/' && role === 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/ops/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    // Invalid token
    if (!isAuthPage) {
      if (pathname.startsWith('/ops')) return NextResponse.redirect(new URL('/employee/login', request.url));
      if (pathname === '/' || pathname.startsWith('/driver')) return NextResponse.redirect(new URL('/driver/login', request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
