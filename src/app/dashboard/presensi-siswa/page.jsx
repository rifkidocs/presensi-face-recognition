import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table-presensi-siswa";
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
      `${process.env.NEXT_PUBLIC_API_URL}/content-manager/collection-types/api::presensi-siswa.presensi-siswa?page=1&pageSize=10&sort=koordinat_absen%3AASC`,
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
    return data.results.map((item) => ({
      id: item.id,
      nama: item.siswa.nama,
      nomor_induk: item.siswa.nomor_induk_siswa,
      waktu_absen: new Date(item.waktu_absen).toLocaleString(),
      jenis_absen: item.jenis_absen,
      koordinat: item.koordinat_absen,
      status: item.is_validated ? "Tervalidasi" : "Belum Tervalidasi",
      foto: `${process.env.NEXT_PUBLIC_API_URL}${
        item.foto_absen?.formats?.thumbnail?.url || ""
      }`,
    }));
  }

  const userData = await getUserData();
  const presensiData = await getPresensiSiswa();

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
              <DataTable data={presensiData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
