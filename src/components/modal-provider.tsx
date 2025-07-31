'use client';

import { useEffect, useState } from 'react';

import { RenameProjectModal } from '@/features/projects/components/rename-project-modal';

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <RenameProjectModal />
    </>
  );
};
