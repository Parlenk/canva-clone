import type { PropsWithChildren } from 'react';

import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

const DashboardLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />

      <div className="flex min-h-screen flex-col lg:pl-[300px]">
        <Navbar />

        <main className="flex-1 bg-white p-4 lg:p-8 lg:rounded-tl-2xl">
          <div className="mx-auto max-w-screen-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
