// Disabled auth middleware for demo purposes
// export { auth as middleware } from '@/auth';

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all requests to pass through without authentication
  return NextResponse.next();
}
