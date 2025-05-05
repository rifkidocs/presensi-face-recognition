import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
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
      `${process.env.NEXT_PUBLIC_API_URL}/content-manager/collection-types/api::presensi-siswa.presensi-siswa?pageSize=100`,
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
      nama: item.siswa?.nama || "-",
      waktu_absen: item.waktu_absen,
      jenis_absen: item.jenis_absen,
      koordinat: item.koordinat_absen,
      status: item.is_validated ? "Tervalidasi" : "Belum Tervalidasi"
    }));
  }

  async function getPresensiGuru() {
    const cookieStore = cookies();
    const jwtToken = cookieStore.get("jwtToken")?.value;
    if (!jwtToken) {
      throw new Error("Authentication token not found");
    }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/presensi-gurus?populate=*&pagination[pageSize]=100`,
    );
    if (!res.ok) {
      throw new Error("Failed to fetch presensi guru data");
    }
    const data = await res.json();
    return data.data.map((item) => ({
      id: item.id,
      nama: item.guru?.nama || "-",
      waktu_absen: item.waktu_absen,
      jenis_absen: item.jenis_absen,
      koordinat: item.koordinat_absen,
      status: item.is_validated === true ? "Tervalidasi" : "Belum Tervalidasi"
    }));
  }

  async function getPresensiPegawai() {
    const cookieStore = cookies();
    const jwtToken = cookieStore.get("jwtToken")?.value;
    if (!jwtToken) {
      throw new Error("Authentication token not found");
    }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/presensi-pegawais?populate=*&pagination[pageSize]=100`,
    );
    if (!res.ok) {
      throw new Error("Failed to fetch presensi pegawai data");
    }
    const data = await res.json();
    return data.data.map((item) => ({
      id: item.id,
      nama: item.pegawai?.nama || "-",
      waktu_absen: item.waktu_absen,
      jenis_absen: item.jenis_absen,
      koordinat: item.koordinat_absen,
      status: item.is_validated ? "Tervalidasi" : "Belum Tervalidasi"
    }));
  }

  const userData = await getUserData();
  const presensiSiswa = await getPresensiSiswa();
  const presensiGuru = await getPresensiGuru();
  const presensiPegawai = await getPresensiPegawai();

  return (
    <SidebarProvider>
      <AppSidebar variant='inset' userData={userData} />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2'>
            <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
              <SectionCards 
                presensiSiswa={presensiSiswa}
                presensiGuru={presensiGuru}
                presensiPegawai={presensiPegawai}
              />
              <div className='px-4 lg:px-6'>
                <ChartAreaInteractive 
                  presensiSiswa={presensiSiswa}
                  presensiGuru={presensiGuru}
                  presensiPegawai={presensiPegawai}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
