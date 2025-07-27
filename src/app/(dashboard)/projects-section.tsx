'use client';

export const ProjectsSection = () => {
  // Demo mode - show placeholder message instead of API calls
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent projects</h2>
      </div>
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <p>No projects yet. Click "Start creating" to begin your first design!</p>
      </div>
    </div>
  );
};