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
        `${process.env.NEXT_PUBLIC_API_URL}/api/siswas?populate=*&filters[nomor_induk_siswa][$eq]=${studentId}`
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
      const schedule = await getActiveSchedule("siswa");
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/presensi-siswas?filters[siswa][id][$eq]=${studentData.id}&filters[waktu_absen][$gte]=${today}&filters[jenis_absen][$eq]=${presenceTime.type}`,
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

  const handleOtherRoleSubmit = async (e) => {
    e.preventDefault();
    if (selectedRole !== "guru" && selectedRole !== "pegawai") {
      onLogin({
        role: selectedRole,
        data: null,
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Login ke admin panel
      const loginResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: e.target.email.value,
            password: e.target.password.value,
          }),
        }
      );

      if (!loginResponse.ok) {
        if (loginResponse.status === 429) {
          throw new Error(
            "Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba kembali."
          );
        }
        throw new Error("Email atau password salah");
      }

      const loginData = await loginResponse.json();
      const token = loginData.data.token;

      // Ambil data berdasarkan peran dan email
      const endpoint =
        selectedRole === "guru" ? "guru.guru" : "pegawai.pegawai";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/content-manager/collection-types/api::${endpoint}?filters[$and][0][email][$eq]=${e.target.email.value}&populate=*`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengambil data ${selectedRole}`);
      }

      const userData = await response.json();

      if (userData.results.length === 0) {
        throw new Error(`Data ${selectedRole} tidak ditemukan`);
      }

      // Cek jadwal presensi aktif
      const schedule = await getActiveSchedule(selectedRole);
      if (!schedule) {
        setError("Tidak ada jadwal presensi yang aktif saat ini");
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
        return;
      }

      // Cek status presensi hari ini
      const today = new Date().toISOString().split("T")[0];
      const presenceEndpoint =
        selectedRole === "guru" ? "presensi-gurus" : "presensi-pegawais";
      const checkResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/${presenceEndpoint}?filters[${selectedRole}][id][$eq]=${userData.results[0].id}&filters[waktu_absen][$gte]=${today}&filters[jenis_absen][$eq]=${presenceTime.type}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json().catch(() => ({
          error: { message: "Gagal mengecek status presensi" },
        }));
        throw new Error(
          errorData.error?.message || "Gagal mengecek status presensi"
        );
      }

      const checkResult = await checkResponse.json();
      if (checkResult.data.length > 0) {
        setError(
          `${userData.results[0].nama} sudah melakukan presensi ${presenceTime.type} hari ini`
        );
        setLoading(false);
        return;
      }

      // Jika semua validasi berhasil, lanjutkan login
      onLogin({
        role: selectedRole,
        data: {
          ...userData.results[0],
          token: token,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
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
              
              <div className="text-center">
                <a href="/dashboard/login">
                  <Button type="button" variant="outline" className="mt-2">
                    Masuk ke Dashboard Admin
                  </Button>
                </a>
              </div>
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
