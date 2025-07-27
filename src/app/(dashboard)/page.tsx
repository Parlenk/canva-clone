import { protectServer } from '@/features/auth/utils';

import { Banner } from './banner';
import { ProjectsSection } from './projects-section';
import { TemplatesSection } from './templates-section';

const HomePage = async () => {
  await protectServer();

  return (
    <div className="flex flex-col space-y-6 pb-10">
      <Banner />
      <TemplatesSection />
      <ProjectsSection />
    </div>
  );
};

export default HomePage;
