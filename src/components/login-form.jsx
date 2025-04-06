"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboboxDemo } from "@/components/ui/combobox";

export function LoginForm({ className, ...props }) {
  const [selectedRole, setSelectedRole] = React.useState("");
  const [studentId, setStudentId] = React.useState("");

  const handleRoleChange = (role) => {
    setSelectedRole(role);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className='overflow-hidden'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form className='p-6 md:p-8'>
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

              {selectedRole === "siswa" ? (
                <div className='grid gap-2'>
                  <Label htmlFor='studentId'>Nomor Induk Siswa</Label>
                  <Input
                    id='studentId'
                    type='text'
                    placeholder='Masukkan NIS'
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
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
                <Button type='submit' className='w-full'>
                  Login
                </Button>
              )}
            </div>
          </form>
          <div className='relative hidden bg-muted md:block'>
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
