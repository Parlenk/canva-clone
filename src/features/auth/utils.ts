import { redirect } from 'next/navigation';

import { auth } from '@/auth';

export const protectServer = async () => {
  // Disabled for demo purposes - allow access without authentication
  // const session = await auth();
  // if (!session) redirect('/api/auth/signin');
  return;
};
