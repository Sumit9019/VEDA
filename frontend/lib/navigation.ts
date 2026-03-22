export type NavigationIconKey =
  | "home"
  | "groups"
  | "assignments"
  | "toolkit"
  | "library"
  | "settings"
  | "sparkles";

export interface NavigationItem {
  key: string;
  label: string;
  href: string;
  icon: NavigationIconKey;
  mobileLabel?: string;
  showOnMobile?: boolean;
  badgeKey?: "assignmentCount";
}

interface PageMeta {
  label: string;
  icon: NavigationIconKey;
}

export const navigationRoutes = {
  home: "/",
  groups: "/groups",
  assignments: "/assignments",
  create: "/create",
  output: "/output",
  library: "/library",
  toolkit: "/toolkit",
  settings: "/settings",
} as const;

export const sidebarNavigation: NavigationItem[] = [
  { key: "home", label: "Home", href: navigationRoutes.home, icon: "home", showOnMobile: true },
  { key: "groups", label: "My Groups", href: navigationRoutes.groups, icon: "groups", showOnMobile: true },
  {
    key: "assignments",
    label: "Assignments",
    href: navigationRoutes.assignments,
    icon: "assignments",
    badgeKey: "assignmentCount",
  },
  {
    key: "toolkit",
    label: "AI Teacher's Toolkit",
    mobileLabel: "AI Toolkit",
    href: navigationRoutes.toolkit,
    icon: "toolkit",
    showOnMobile: true,
  },
  { key: "library", label: "My Library", href: navigationRoutes.library, icon: "library", showOnMobile: true },
];

export const primaryActions = {
  default: {
    label: "Create Assignment",
    href: navigationRoutes.create,
  },
  output: {
    label: "AI Teacher's Toolkit",
    href: navigationRoutes.toolkit,
  },
} as const;

export const settingsNavigationItem: NavigationItem = {
  key: "settings",
  label: "Settings",
  href: navigationRoutes.settings,
  icon: "settings",
};

export const headerPageMeta: Record<string, PageMeta> = {
  [navigationRoutes.home]: { label: "Home", icon: "home" },
  [navigationRoutes.groups]: { label: "My Groups", icon: "groups" },
  [navigationRoutes.assignments]: { label: "Assignment", icon: "home" },
  [navigationRoutes.create]: { label: "Assignment", icon: "sparkles" },
  [navigationRoutes.output]: { label: "Create New", icon: "sparkles" },
  [navigationRoutes.library]: { label: "My Library", icon: "library" },
  [navigationRoutes.toolkit]: { label: "AI Teacher's Toolkit", icon: "toolkit" },
  [navigationRoutes.settings]: { label: "Settings", icon: "settings" },
};

export const headerFallbackPageMeta: PageMeta = {
  label: "Assignment",
  icon: "home",
};
