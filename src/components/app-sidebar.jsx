"use client";

import * as React from "react";
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({ userData, ...props }) {
  const isKepalaSekolah = userData?.roles?.some(
    (role) => role.name === "Kepala Sekolah"
  );

  const navMain = isKepalaSekolah
    ? [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboardIcon,
        },
        {
          title: "Presensi Siswa",
          url: "/dashboard/presensi-siswa",
          icon: ClipboardListIcon,
        },
        {
          title: "Presensi Guru",
          url: "/dashboard/presensi-guru",
          icon: ClipboardListIcon,
        },
        {
          title: "Presensi Pegawai",
          url: "/dashboard/presensi-pegawai",
          icon: ClipboardListIcon,
        },
      ]
    : [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboardIcon,
        },
        {
          title: "Kelola Siswa",
          url: "/dashboard/kelola-siswa",
          icon: UsersIcon,
        },
        {
          title: "Presensi Siswa",
          url: "/dashboard/presensi-siswa",
          icon: ClipboardListIcon,
        },
      ];

  const user = {
    name: userData?.firstname + " " + userData?.lastname || "Admin",
    email: userData?.email || "admin@example.com",
    avatar: "/avatars/admin.jpg",
  };

  const navSecondary = [];

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className='data-[slot=sidebar-menu-button]:!p-1.5'>
              <a href='#'>
                <ArrowUpCircleIcon className='h-5 w-5' />
                <span className='text-base font-semibold'>
                  Admin Sistem Presensi
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
