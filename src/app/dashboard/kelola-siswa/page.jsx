import { AppSidebar } from "@/components/app-sidebar";
import { DataTableKelolaSiswa } from "@/components/data-table-kelola-siswa";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircleIcon } from "lucide-react";
import { cookies } from "next/headers";

export default async function Page({ searchParams }) {
  const page = Number(searchParams?.page) || 1;
  const pageSize = Number(searchParams?.pageSize) || 10;
  const search = searchParams?.search || "";

  async function getUserData() {
    const cookieStore = await cookies();
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

  async function getGuruData() {
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get("jwtToken")?.value;

    if (!jwtToken) {
      throw new Error("Authentication token not found");
    }

    // Get user data first to get the email
    const userData = await getUserData();

    // Get current user data (guru) filtered by email
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/gurus?populate=*&filters[email][$eq]=${userData.email}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch guru data");
    }

    const data = await res.json();
    
    return data.data[0]; // Return the guru data that matches the email
  }

  async function getSiswaData(kelasId, page = 1, pageSize = 10, search = "") {
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get("jwtToken")?.value;

    if (!jwtToken) {
      throw new Error("Authentication token not found");
    }

    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/siswas?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

    // If kelasId is provided, filter students by that class
    if (kelasId) {
      url += `&filters[kelas_sekolah][id][$eq]=${kelasId}`;
    }

    // Add search filter if search term is provided
    if (search) {
      url += `&filters[nama][$containsi]=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch siswa data");
    }

    const data = await res.json();
    return {
      data: data.data,
      pagination: data.meta.pagination
    };
  }

  const userData = await getUserData();

  // Get guru data to check if they are a wali kelas
  const guruData = await getGuruData();

  // Check if the guru is a wali kelas
  const isWaliKelas = !!guruData.wali_kelas;
  const kelasWali = guruData.wali_kelas;

  // Get siswa data with search parameter
  const { data: siswaData, pagination } = await getSiswaData(
    isWaliKelas ? kelasWali.id : null,
    page,
    pageSize,
    search
  );

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
                  Kelola Siswa
                </h2>
              </div>

              {!isWaliKelas ? (
                <div className='px-4 lg:px-6'>
                  <Alert>
                    <InfoIcon className='h-4 w-4' />
                    <AlertTitle>Perhatian</AlertTitle>
                    <AlertDescription>
                      Anda tidak terdaftar sebagai wali kelas. Data yang
                      ditampilkan adalah semua siswa.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className='px-4 lg:px-6'>
                  <Alert variant='success'>
                    <CheckCircleIcon className='h-4 w-4' />
                    <AlertTitle>Informasi Wali Kelas</AlertTitle>
                    <AlertDescription>
                      Anda adalah wali kelas dari {kelasWali.nama_kelas}. Data
                      yang ditampilkan hanya siswa dari kelas tersebut.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <DataTableKelolaSiswa
                data={siswaData}
                pagination={pagination}
                title={
                  isWaliKelas
                    ? `Daftar Siswa ${kelasWali.nama_kelas}`
                    : "Daftar Semua Siswa"
                }
                kelasId={isWaliKelas ? kelasWali.id : null}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
