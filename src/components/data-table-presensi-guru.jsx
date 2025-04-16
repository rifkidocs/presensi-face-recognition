"use client";

import * as React from "react";
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  LoaderIcon,
  MoreVerticalIcon,
  UserIcon,
  MapPinIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DataTableGuru({ data: initialData }) {
  const [data] = React.useState(() => initialData);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const columns = [
    {
      accessorKey: "nama",
      header: "Nama Guru",
      cell: ({ row }) => <div className='font-medium'>{row.original.nama}</div>,
    },
    {
      accessorKey: "waktu_absen",
      header: "Waktu Absen",
      cell: ({ row }) => <div>{row.original.waktu_absen}</div>,
    },
    {
      accessorKey: "jenis_absen",
      header: "Jenis Absen",
      cell: ({ row }) => (
        <Badge variant='outline' className='capitalize'>
          {row.original.jenis_absen}
        </Badge>
      ),
    },
    {
      accessorKey: "koordinat",
      header: "Koordinat",
      cell: ({ row }) => (
        <div className='font-mono text-sm'>{row.original.koordinat}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status Validasi",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "Tervalidasi" ? "success" : "secondary"
          }
          className='flex gap-1 items-center'>
          {row.original.status === "Tervalidasi" ? (
            <CheckCircle2Icon className='h-3 w-3' />
          ) : (
            <LoaderIcon className='h-3 w-3' />
          )}
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "foto",
      header: "Foto Absen",
      cell: ({ row }) => (
        <div className='relative h-10 w-10 overflow-hidden rounded-full'>
          <img
            src={row.original.foto}
            alt={`Foto absen ${row.original.nama}`}
            className='object-cover'
          />
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const [showDetail, setShowDetail] = React.useState(false);
        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='flex size-8 text-muted-foreground data-[state=open]:bg-muted'
                  size='icon'>
                  <MoreVerticalIcon />
                  <span className='sr-only'>Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-32'>
                <DropdownMenuItem onClick={() => setShowDetail(true)}>
                  Lihat Detail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
              <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                  <DialogTitle>Detail Presensi Guru</DialogTitle>
                  <DialogDescription>
                    Informasi lengkap presensi guru
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='flex flex-col items-center gap-4'>
                    <div className='relative h-32 w-32 overflow-hidden rounded-lg'>
                      <img
                        src={row.original.foto}
                        alt={`Foto absen ${row.original.nama}`}
                        className='h-full w-full object-cover'
                      />
                    </div>
                  </div>
                  <div className='grid gap-2'>
                    <div className='flex items-center gap-2'>
                      <UserIcon className='h-4 w-4 text-muted-foreground' />
                      <div className='grid gap-1'>
                        <div className='text-sm font-medium'>
                          {row.original.nama}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {row.original.nip}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <MapPinIcon className='h-4 w-4 text-muted-foreground' />
                      <div className='grid gap-1'>
                        <div className='text-sm font-medium'>
                          Lokasi Presensi
                        </div>
                        <div className='font-mono text-xs'>
                          {row.original.koordinat}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={
                          row.original.status === "Tervalidasi"
                            ? "success"
                            : "secondary"
                        }
                        className='flex gap-1 items-center'>
                        {row.original.status === "Tervalidasi" ? (
                          <CheckCircle2Icon className='h-3 w-3' />
                        ) : (
                          <LoaderIcon className='h-3 w-3' />
                        )}
                        {row.original.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        );
      },
    },
  ];

  const pageCount = Math.ceil(data.length / pagination.pageSize);
  const start = pagination.pageIndex * pagination.pageSize;
  const end = start + pagination.pageSize;
  const currentPageData = data.slice(start, end);

  return (
    <div className='flex w-full flex-col justify-start gap-6'>
      <div className='relative flex flex-col gap-4 overflow-auto px-4 lg:px-6'>
        <div className='overflow-hidden rounded-lg border'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.accessorKey || col.id}
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {currentPageData.map((row, idx) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td
                      key={col.accessorKey || col.id}
                      className='px-6 py-4 whitespace-nowrap'>
                      {col.cell
                        ? col.cell({ row: { original: row } })
                        : row[col.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='flex items-center justify-between px-4'>
          <div className='hidden flex-1 text-sm text-muted-foreground lg:flex'>
            Showing {start + 1} to {Math.min(end, data.length)} of {data.length}{" "}
            entries
          </div>
          <div className='flex w-full items-center gap-8 lg:w-fit'>
            <div className='hidden items-center gap-2 lg:flex'>
              <Label htmlFor='rows-per-page' className='text-sm font-medium'>
                Rows per page
              </Label>
              <Select
                value={`${pagination.pageSize}`}
                onValueChange={(value) => {
                  setPagination({
                    pageIndex: 0,
                    pageSize: Number(value),
                  });
                }}>
                <SelectTrigger className='w-20' id='rows-per-page'>
                  <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side='top'>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex w-fit items-center justify-center text-sm font-medium'>
              Page {pagination.pageIndex + 1} of {pageCount}
            </div>
            <div className='ml-auto flex items-center gap-2 lg:ml-0'>
              <Button
                variant='outline'
                className='hidden h-8 w-8 p-0 lg:flex'
                onClick={() => setPagination({ ...pagination, pageIndex: 0 })}
                disabled={pagination.pageIndex === 0}>
                <span className='sr-only'>Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() =>
                  setPagination({
                    ...pagination,
                    pageIndex: pagination.pageIndex - 1,
                  })
                }
                disabled={pagination.pageIndex === 0}>
                <span className='sr-only'>Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() =>
                  setPagination({
                    ...pagination,
                    pageIndex: pagination.pageIndex + 1,
                  })
                }
                disabled={pagination.pageIndex === pageCount - 1}>
                <span className='sr-only'>Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant='outline'
                className='hidden size-8 lg:flex'
                size='icon'
                onClick={() =>
                  setPagination({ ...pagination, pageIndex: pageCount - 1 })
                }
                disabled={pagination.pageIndex === pageCount - 1}>
                <span className='sr-only'>Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
