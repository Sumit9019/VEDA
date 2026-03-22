"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  FileText,
  LayoutGrid,
  Menu,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/app/store/useStore";
import { apiClient } from "@/lib/api";
import { config } from "@/lib/config";
import {
  headerFallbackPageMeta,
  headerPageMeta,
  navigationRoutes,
  primaryActions,
  settingsNavigationItem,
  sidebarNavigation,
  type NavigationIconKey,
  type NavigationItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const LibraryIcon = ({ className }: { className?: string }) => (
  <span className={cn("relative block shrink-0", className)}>
    <Image
      src="/library.png"
      alt=""
      aria-hidden="true"
      fill
      sizes="20px"
      unoptimized
      className="object-contain"
    />
  </span>
);

const GroupIcon = ({ className }: { className?: string }) => (
  <span className={cn("relative block shrink-0", className)}>
    <Image
      src="/group.png"
      alt=""
      aria-hidden="true"
      fill
      sizes="20px"
      unoptimized
      className="object-contain"
    />
  </span>
);

const ToolkitIcon = ({ className }: { className?: string }) => (
  <span className={cn("relative block shrink-0", className)}>
    <Image
      src="/AI%20toolkit.png"
      alt=""
      aria-hidden="true"
      fill
      sizes="20px"
      unoptimized
      className="object-contain"
    />
  </span>
);

const BrandMark = ({ className }: { className?: string }) => (
  <Image
    src="/veda.png"
    alt=""
    aria-hidden="true"
    width={40}
    height={40}
    unoptimized
    priority
    className={cn("block h-10 w-10 shrink-0 rounded-[15px] object-contain", className)}
  />
);

const BrandLockup = ({
  className,
  markClassName,
  nameClassName,
}: {
  className?: string;
  markClassName?: string;
  nameClassName?: string;
}) => (
  <div className={cn("flex h-10 w-[136px] items-center gap-2 text-[#21242b]", className)}>
    <BrandMark className={cn("h-10 w-10 rounded-[15px]", markClassName)} />
    <span
      className={cn(
        "w-[88px] shrink-0 whitespace-nowrap text-[24px] font-semibold leading-none tracking-[-0.055em]",
        nameClassName,
      )}
    >
      {config.brand.name}
    </span>
  </div>
);

const DesktopAvatar = ({ className }: { className?: string }) => (
  <span className={cn("relative block shrink-0 overflow-hidden rounded-full", className)}>
    <Image
      src="/Avatar.png"
      alt=""
      aria-hidden="true"
      fill
      sizes="56px"
      unoptimized
      className="object-contain"
    />
  </span>
);

const iconRenderers = {
  home: (className?: string) => <LayoutGrid className={className} />,
  groups: (className?: string) => <GroupIcon className={className} />,
  assignments: (className?: string) => <FileText className={className} />,
  toolkit: (className?: string) => <ToolkitIcon className={className} />,
  library: (className?: string) => <LibraryIcon className={className} />,
  settings: (className?: string) => <Settings className={className} />,
  sparkles: (className?: string) => <Sparkles className={className} />,
} as const;

const mobileNavItems = sidebarNavigation.filter((item) => item.showOnMobile);

const isActiveRoute = (pathname: string, href: string) => {
  if (href === navigationRoutes.home) {
    return pathname === navigationRoutes.home || pathname.startsWith(navigationRoutes.output);
  }

  return pathname.startsWith(href);
};

const getPageMeta = (pathname: string) => {
  const match = Object.keys(headerPageMeta)
    .sort((left, right) => right.length - left.length)
    .find((route) => route !== "/" && pathname.startsWith(route));

  if (match) {
    return headerPageMeta[match];
  }

  return headerPageMeta[pathname] ?? headerFallbackPageMeta;
};

const renderIcon = (icon: NavigationIconKey, className?: string) => iconRenderers[icon](className);

const getNavBadge = (item: NavigationItem, assignmentCount: number | null) => {
  if (item.badgeKey !== "assignmentCount" || assignmentCount === null) {
    return null;
  }

  return String(assignmentCount);
};

export function Sidebar() {
  const pathname = usePathname();
  const { assignmentCount, setAssignmentCount } = useStore();
  const isOutputRoute = pathname.startsWith(navigationRoutes.output);
  const primaryAction = isOutputRoute ? primaryActions.output : primaryActions.default;

  useEffect(() => {
    if (assignmentCount !== null) {
      return;
    }

    let isCancelled = false;

    const syncAssignmentCount = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; list: Array<{ _id: string }> }>("/assignments");

        if (!isCancelled && response.data.success) {
          setAssignmentCount(response.data.list.length);
        }
      } catch (error) {
        console.error("Unable to load assignment count", error);
      }
    };

    void syncAssignmentCount();

    return () => {
      isCancelled = true;
    };
  }, [assignmentCount, setAssignmentCount]);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] p-3 lg:block">
      <div className="font-ui flex h-[calc(100vh-24px)] w-[304px] flex-col justify-between rounded-[16px] border border-[#ececef] bg-white px-6 py-6 shadow-[0_32px_48px_rgba(0,0,0,0.2),0_16px_48px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col">
          <BrandLockup />

          <div className="mt-8 flex w-[251px] flex-col gap-14">
            <Link href={primaryAction.href}>
              <span className="grid h-[42px] w-[251px] grid-cols-[16px_1fr_16px] items-center rounded-full border-[2px] border-[#ef7c50] bg-[#2d2d30] px-5 text-[15px] font-semibold tracking-[-0.02em] text-white shadow-[inset_0_12px_24px_rgba(255,255,255,0.08),0_10px_24px_rgba(31,36,41,0.16)] transition hover:opacity-95">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span className="text-center">{primaryAction.label}</span>
                <span />
              </span>
            </Link>

            <nav className="flex w-[254px] flex-col gap-2">
              {sidebarNavigation.map((item) => {
                const isActive = isActiveRoute(pathname, item.href);
                const badge = getNavBadge(item, assignmentCount);

                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={cn(
                        "flex h-10 w-[254px] items-center gap-2 rounded-[8px] px-3 py-[9px] text-[16px] leading-[1.4] tracking-[-0.04em] text-[#8d8d8d] transition",
                        isActive && "bg-[#f0f0f0] font-semibold text-[#303030]",
                      )}
                    >
                      {renderIcon(item.icon, "h-5 w-5 shrink-0")}
                      <span className="truncate">{item.label}</span>
                      {badge ? (
                        <span className="ml-auto inline-flex min-w-12 items-center justify-center rounded-full bg-[#ff7f2f] px-2.5 py-0.5 text-[14px] font-bold tracking-[-0.02em] text-white">
                          {badge}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="w-[256px] space-y-2">
          <Link href={settingsNavigationItem.href} className="block">
            <span className="flex h-10 items-center gap-3 rounded-[8px] px-3 py-[9px] text-[16px] font-normal leading-[1.4] tracking-[-0.04em] text-[#8d8d8d] transition hover:bg-[#f3f3f4]">
              <Settings className="h-5 w-5 shrink-0" />
              {settingsNavigationItem.label}
            </span>
          </Link>

          <div className="flex h-20 w-[256px] items-center gap-4 rounded-[16px] bg-[#f0f0f0] p-3">
            <DesktopAvatar className="h-14 w-14 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold leading-[1.4] tracking-[-0.04em] text-[#303030]">{config.school.name}</p>
              <p className="truncate text-[14px] font-normal leading-[1.4] tracking-[-0.04em] text-[#5e5e5e]">{config.school.location}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href={primaryActions.default.href}
        className="fixed bottom-[92px] right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#ff8a63] shadow-[0_10px_20px_rgba(0,0,0,0.22)] lg:hidden"
      >
        <Plus className="h-5 w-5" />
      </Link>

      <div className="fixed inset-x-3 bottom-3 z-40 rounded-2xl bg-[#0f1115] p-2 text-white shadow-[0_16px_30px_rgba(0,0,0,0.35)] lg:hidden">
        <div className="flex items-center justify-between gap-1">
          {mobileNavItems.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);

            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <span className="flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold">
                  {renderIcon(item.icon, cn("h-4 w-4", isActive ? "text-white" : "text-white/50"))}
                  <span className={cn(isActive ? "text-white" : "text-white/50")}>
                    {item.mobileLabel ?? item.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const pageMeta = getPageMeta(pathname);

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-4 pt-4 lg:left-[calc(var(--sidebar-width)-18px)] lg:px-4">
      <div className="font-ui flex h-[54px] w-full items-center justify-between rounded-[24px] border border-[#ececef] bg-white/96 px-5 shadow-[0_18px_34px_rgba(27,31,37,0.06)] backdrop-blur lg:px-5">
        <div className="hidden items-center gap-3 lg:flex">
          <Link href={navigationRoutes.assignments} className="flex h-9 w-9 items-center justify-center rounded-full text-[#6e727a] transition hover:bg-[#f3f3f4]">
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <span className="flex items-center gap-2 text-[15px] font-semibold text-[#a6aab3]">
            {renderIcon(pageMeta.icon, "h-4 w-4")}
            {pageMeta.label}
          </span>
        </div>

        <BrandLockup className="lg:hidden" nameClassName="text-[#1f2024]" />

        <div className="flex items-center gap-3">
          <button className="relative rounded-full p-2 text-[#5f6269] transition hover:bg-[#f3f3f4]">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#ff6d42]" />
          </button>

          <button className="hidden items-center gap-2.5 rounded-full bg-white pl-1 pr-2 text-[#252830] transition hover:bg-[#f3f3f4] lg:flex">
            <DesktopAvatar className="h-10 w-10 shrink-0" />
            <span className="text-[16px] font-semibold">{config.currentUser.name}</span>
            <ChevronDown className="h-4 w-4 text-[#8c8f96]" />
          </button>

          <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#5e6066] transition hover:bg-[#f2f3f5] lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
