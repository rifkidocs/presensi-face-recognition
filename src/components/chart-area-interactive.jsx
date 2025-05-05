"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export function ChartAreaInteractive({ presensiSiswa, presensiGuru, presensiPegawai }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Fungsi untuk mengelompokkan data presensi berdasarkan tanggal
  const groupDataByDate = (data) => {
    const groupedData = {};
    
    if (!data || !Array.isArray(data)) return groupedData;
    
    data.forEach(item => {
      const date = new Date(item.waktu_absen).toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = 0;
      }
      groupedData[date]++;
    });
    
    return groupedData;
  }

  // Mengelompokkan data presensi
  const siswaByDate = groupDataByDate(presensiSiswa);
  const guruByDate = groupDataByDate(presensiGuru);
  const pegawaiByDate = groupDataByDate(presensiPegawai);

  // Menggabungkan semua tanggal unik
  const allDates = new Set([
    ...Object.keys(siswaByDate),
    ...Object.keys(guruByDate),
    ...Object.keys(pegawaiByDate)
  ]);

  // Membuat data untuk chart
  const chartData = Array.from(allDates).map(date => ({
    date,
    siswa: siswaByDate[date] || 0,
    guru: guruByDate[date] || 0,
    pegawai: pegawaiByDate[date] || 0
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Memfilter data berdasarkan rentang waktu
  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const today = new Date();
    let daysToSubtract = 90;
    
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    return date >= startDate;
  });

  const chartConfig = {
    presensi: {
      label: "Presensi",
    },
    siswa: {
      label: "Siswa",
      color: "hsl(var(--chart-1))",
    },
    guru: {
      label: "Guru",
      color: "hsl(var(--chart-2))",
    },
    pegawai: {
      label: "Pegawai",
      color: "hsl(var(--chart-3))",
    }
  }

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Total Presensi</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Total presensi dari siswa, guru, dan pegawai
          </span>
          <span className="@[540px]/card:hidden">Semua presensi</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden">
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              90 Hari Terakhir
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              30 Hari Terakhir
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              7 Hari Terakhir
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="@[767px]/card:hidden flex w-40" aria-label="Select a value">
              <SelectValue placeholder="90 Hari Terakhir" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                90 Hari Terakhir
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 Hari Terakhir
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 Hari Terakhir
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSiswa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-siswa)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-siswa)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillGuru" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-guru)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-guru)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillPegawai" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pegawai)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-pegawai)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                });
              }} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("id-ID", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot" />
              } />
            <Area
              dataKey="siswa"
              type="natural"
              fill="url(#fillSiswa)"
              stroke="var(--color-siswa)"
              stackId="a" />
            <Area
              dataKey="guru"
              type="natural"
              fill="url(#fillGuru)"
              stroke="var(--color-guru)"
              stackId="a" />
            <Area
              dataKey="pegawai"
              type="natural"
              fill="url(#fillPegawai)"
              stroke="var(--color-pegawai)"
              stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
