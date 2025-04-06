"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboboxDemo } from "@/components/ui/combobox";
import { getActiveSchedule, isWithinPresenceTime } from "../lib/presenceUtils";

export function LoginForm({ className, onLogin, ...props }) {
  const [selectedRole, setSelectedRole] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError("");
  };

  const handleStudentIdSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setError("Nomor Induk Siswa tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Cek data siswa
      const response = await fetch(
        `http://localhost:1337/api/siswas?populate=*&filters[nomor_induk_siswa][$eq]=${studentId}`
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data siswa");
      }

      const data = await response.json();

      if (data.data.length === 0) {
        setError("Siswa dengan nomor induk tersebut tidak ditemukan");
        setLoading(false);
        return;
      }

      const studentData = data.data[0];

      // Cek jadwal presensi aktif
      const schedule = await getActiveSchedule();
      if (!schedule) {
        setError("Tidak ada jadwal presensi yang aktif saat ini");
        setLoading(false);
        return;
      }

      // Cek waktu presensi
      const presenceTime = isWithinPresenceTime(schedule);
      if (!presenceTime.isValid) {
        const formatTime = (time) => {
          return time.substring(0, 5) + " WIB";
        };
        let alertMessage = `Jadwal presensi masuk: ${formatTime(
          schedule.jam_masuk
        )} - ${formatTime(schedule.batas_jam_masuk)}\n
        Jadwal presensi pulang: ${formatTime(
          schedule.jam_pulang
        )} - ${formatTime(schedule.batas_jam_pulang)}`;
        setError(alertMessage);
        setLoading(false);
        return;
      }

      // Cek status presensi hari ini
      const today = new Date().toISOString().split("T")[0];
      const checkResponse = await fetch(
        `http://localhost:1337/api/presensi-siswas?filters[siswa][id][$eq]=${studentData.id}&filters[waktu_absen][$gte]=${today}&filters[jenis_absen][$eq]=${presenceTime.type}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!checkResponse.ok) {
        throw new Error("Gagal mengecek status presensi");
      }

      const checkResult = await checkResponse.json();
      if (checkResult.data.length > 0) {
        setError(
          `${studentData.nama} sudah melakukan presensi ${presenceTime.type} hari ini`
        );
        setLoading(false);
        return;
      }

      // Jika semua validasi berhasil, lanjutkan login
      onLogin({
        role: "siswa",
        data: studentData,
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("Terjadi kesalahan saat mengambil data siswa");
    } finally {
      setLoading(false);
    }
  };

  const handleOtherRoleSubmit = () => {
    onLogin({
      role: selectedRole,
      data: null,
    });
  };

  return (
    <div className={cn("flex flex-col gap-6 max-w-4xl", className)} {...props}>
      <Card className='overflow-hidden'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form
            className='p-6 md:p-8'
            onSubmit={
              selectedRole === "siswa"
                ? handleStudentIdSubmit
                : handleOtherRoleSubmit
            }>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col items-center text-center'>
                <h1 className='text-2xl font-bold'>Selamat Datang</h1>
                <p className='text-balance text-muted-foreground'>
                  Sistem Presensi MTSS AR-ROUDLOH
                </p>
              </div>

              <div className='grid gap-2'>
                <Label>Pilih Peran</Label>
                <ComboboxDemo onRoleChange={handleRoleChange} />
              </div>

              {error && (
                <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>
                  {error}
                </div>
              )}

              {selectedRole === "siswa" ? (
                <div className='grid gap-2'>
                  <Label htmlFor='studentId'>Nomor Induk Siswa</Label>
                  <Input
                    id='studentId'
                    type='text'
                    placeholder='Masukkan NIS'
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              ) : (
                selectedRole && (
                  <>
                    <div className='grid gap-2'>
                      <Label htmlFor='email'>Email</Label>
                      <Input
                        id='email'
                        type='email'
                        placeholder='m@example.com'
                        required
                      />
                    </div>
                    <div className='grid gap-2'>
                      <div className='flex items-center'>
                        <Label htmlFor='password'>Password</Label>
                      </div>
                      <Input id='password' type='password' required />
                    </div>
                  </>
                )
              )}

              {selectedRole && (
                <Button type='submit' className='w-full' disabled={loading}>
                  {loading ? "Memproses..." : "Login"}
                </Button>
              )}
            </div>
          </form>
          <div className='relative bg-muted md:block'>
            <img
              src='/placeholder.svg'
              alt='Image'
              className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
