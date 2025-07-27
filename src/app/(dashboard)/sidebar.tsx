import { Logo } from './logo';
import { SidebarRoutes } from './sidebar-routes';

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-[300px] shrink-0 flex-col bg-white border-r lg:flex">
      <Logo />

      <SidebarRoutes />
    </aside>
  );
};
