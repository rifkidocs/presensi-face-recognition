import { AppSidebar } from "@/components/app-sidebar";
import { DataTableSiswa } from "@/components/data-table-presensi-siswa";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

export default async function Page() {
  async function getUserData() {
    const cookieStore = cookies();
    const jwtToken = cookieStore.get("jwtToken")?.value;

    if (!jwtToken) {
      throw new Error("Authentication token not found");
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/users/me`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch user data");
    }

    const userData = await res.json();
    return userData.data;
  }

  async function getPresensiSiswa() {
    const cookieStore = cookies();
    const jwtToken = cookieStore.get("jwtToken")?.value;

    if (!jwtToken) {
      throw new Error("Authentication token not found");
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/content-manager/collection-types/api::presensi-siswa.presensi-siswa?page=1&pageSize=10&sort=waktu_absen:DESC`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch presensi siswa data");
    }

    const data = await res.json();
    return {
      data: data.results,
      pagination: data.pagination
    };
  }

  const userData = await getUserData();
  const { data: presensiData, pagination } = await getPresensiSiswa();
  const jwtToken = cookies().get("jwtToken")?.value;
  

  return (
    <SidebarProvider>
      <AppSidebar variant='inset' userData={userData} />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2'>
            <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
              <div className='px-4 lg:px-6'>
                <h2 className='text-2xl font-bold tracking-tight'>
                  Presensi Siswa
                </h2>
              </div>
              <DataTableSiswa data={presensiData} pagination={pagination} jwtToken={jwtToken} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
