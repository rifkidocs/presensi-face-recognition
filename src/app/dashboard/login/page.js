"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardLogin() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loginResponse = await fetch("http://localhost:1337/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error("Email atau password salah");
      }

      const loginData = await loginResponse.json();
      const token = loginData.data.token;

      // Simpan token ke cookie dengan pengaturan keamanan
      document.cookie = `jwtToken=${token}; path=/; secure; samesite=strict; max-age=86400`; // 24 jam

      // Redirect ke dashboard
      router.push("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center py-8 space-y-8 w-full'>
      <Card className='overflow-hidden w-full max-w-md'>
        <CardContent className='p-6'>
          <form onSubmit={handleLogin} className='space-y-6'>
            <div className='flex flex-col items-center text-center'>
              <h1 className='text-2xl font-bold text-gray-900'>
                Dashboard Login
              </h1>
              <p className='text-balance text-muted-foreground'>
                Sistem Presensi MTSS AR-ROUDLOH
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='role'>Pilih Peran</Label>
              <select
                id='role'
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className='w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                required>
                <option value=''>Pilih Peran</option>
                <option value='guru'>Guru</option>
                <option value='kepala_sekolah'>Kepala Sekolah</option>
              </select>
            </div>

            {error && (
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>
                {error}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='email@example.com'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700'
              disabled={loading}>
              {loading ? "Memproses..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
