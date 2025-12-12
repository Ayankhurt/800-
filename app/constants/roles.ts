// App roles only - NO ADMIN ROLES
export const APP_ROLES = [
  {
    value: "PM",
    label: "Project Manager",
    description: "Post jobs, manage applications, schedule appointments",
  },
  {
    value: "GC",
    label: "General Contractor",
    description: "Create bids, manage projects, invite contractors",
  },
  {
    value: "SUB",
    label: "Subcontractor",
    description: "Apply to jobs, submit bids, complete project work",
  },
  {
    value: "TS",
    label: "Trade Specialist",
    description: "Specialized trade work, portfolio showcase",
  },
  {
    value: "VIEWER",
    label: "Viewer",
    description: "Read-only access for stakeholders",
  },
] as const;

// For backward compatibility
export const ROLES = APP_ROLES;
