import { TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards({ presensiSiswa, presensiGuru, presensiPegawai }) {
  // Hitung total presensi hari ini untuk setiap kategori
  const countTodayPresence = (data) => {
    const today = new Date().toLocaleDateString();
    return data?.filter(item => new Date(item.waktu_absen).toLocaleDateString() === today)?.length || 0;
  }

  const siswaMasukHariIni = countTodayPresence(presensiSiswa);
  const guruMasukHariIni = countTodayPresence(presensiGuru);
  const pegawaiMasukHariIni = countTodayPresence(presensiPegawai);
  const totalPresensiHariIni = siswaMasukHariIni + guruMasukHariIni + pegawaiMasukHariIni;

  return (
    <div
      className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Presensi Hari Ini</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {totalPresensiHariIni}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              Hari Ini
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total presensi dari semua kategori
          </div>
          <div className="text-muted-foreground">
            Siswa, Guru, dan Pegawai
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Presensi Siswa</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {siswaMasukHariIni}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              Hari Ini
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Siswa yang hadir hari ini
          </div>
          <div className="text-muted-foreground">
            Total data: {presensiSiswa?.length || 0}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Presensi Guru</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {guruMasukHariIni}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              Hari Ini
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Guru yang hadir hari ini
          </div>
          <div className="text-muted-foreground">
            Total data: {presensiGuru?.length || 0}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Presensi Pegawai</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {pegawaiMasukHariIni}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              Hari Ini
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Pegawai yang hadir hari ini
          </div>
          <div className="text-muted-foreground">
            Total data: {presensiPegawai?.length || 0}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
