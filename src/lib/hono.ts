import { hc } from 'hono/client';

import type { AppType } from '@/app/api/[[...route]]/route';

// Force localhost for development - environment variable might not be available
const baseUrl = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin || 'http://localhost:3000')
  : 'http://localhost:3000';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔧 Hono client base URL:', baseUrl);
  console.log('🔧 Environment variable:', process.env.NEXT_PUBLIC_APP_BASE_URL);
}

export const client = hc<AppType>(baseUrl);
