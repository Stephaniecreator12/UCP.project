// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // On récupère le token depuis les cookies (car le middleware ne peut pas lire le localStorage)
  // Note: Pour que cela fonctionne, votre fonction login doit aussi enregistrer le token dans les cookies.
  const token = request.cookies.get('access_token');

  // Si l'utilisateur essaie d'accéder au dashboard sans être connecté
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// On définit les pages à protéger
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};