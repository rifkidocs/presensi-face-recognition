"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  FileEditIcon,
  MoreVerticalIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nama",
    header: "Nama Siswa",
    cell: ({ row }) => <div className="font-medium">{row.original.nama}</div>,
  },
  {
    accessorKey: "nomor_induk_siswa",
    header: "NIS",
    cell: ({ row }) => <div>{row.original.nomor_induk_siswa}</div>,
  },
  {
    accessorKey: "kelas",
    header: "Kelas",
    cell: ({ row }) => (
      <Badge variant='outline' className='capitalize'>
        {row.original.kelas_sekolah?.nama_kelas || "-"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant='success' className='flex gap-1 items-center'>
        {row.original.is_active ? (
          <>
            <CheckIcon className='h-3 w-3' />
            Aktif
          </>
        ) : (
          'Tidak Aktif'
        )}
      </Badge>
    ),
  },
  {
    accessorKey: "foto",
    header: "Foto Siswa",
    cell: ({ row }) => {
      const foto = row.original.foto_wajah && row.original.foto_wajah.length > 0 
        ? `http://localhost:1337${row.original.foto_wajah[0].formats.thumbnail.url}`
        : "/default-avatar.png";
        
      return (
        <div className='relative h-10 w-10 overflow-hidden rounded-full'>
          <img
            src={foto}
            alt={`Foto ${row.original.nama}`}
            className='object-cover h-full w-full'
          />
        </div>
      );
    },
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
            <DropdownMenuContent align='end' className='w-40'>
              <DropdownMenuItem onClick={() => setShowDetail(true)}>
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileEditIcon className="mr-2 h-4 w-4" />
                Edit Siswa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <TrashIcon className="mr-2 h-4 w-4" />
                Hapus Siswa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Detail Siswa</DialogTitle>
                <DialogDescription>
                  Informasi lengkap data siswa
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='flex flex-col items-center gap-4'>
                  <div className='relative h-32 w-32 overflow-hidden rounded-lg'>
                    <img
                      src={row.original.foto_wajah && row.original.foto_wajah.length > 0 
                        ? `http://localhost:1337${row.original.foto_wajah[0].url}`
                        : "/default-avatar.png"}
                      alt={`Foto ${row.original.nama}`}
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
                        {row.original.nomor_induk_siswa}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='grid gap-1'>
                      <div className='text-sm font-medium'>Kelas</div>
                      <Badge variant='outline' className='capitalize'>
                        {row.original.kelas_sekolah?.nama_kelas || "-"}
                      </Badge>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant={row.original.is_active ? 'success' : 'secondary'}
                      className='flex gap-1 items-center'>
                      {row.original.is_active && <CheckIcon className='h-3 w-3' />}
                      {row.original.is_active ? 'Aktif' : 'Tidak Aktif'}
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

export function DataTableKelolaSiswa({ data, title }) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className='flex w-full flex-col justify-start gap-6'>
      <div className='flex items-center justify-between px-4 lg:px-6'>
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Filter nama...'
            value={table.getColumn('nama')?.getFilterValue() || ''}
            onChange={(event) =>
              table.getColumn('nama')?.setFilterValue(event.target.value)
            }
            className='max-w-sm'
          />
          <Button variant='outline' size='sm' className='ml-auto h-8 lg:flex'>
            <PlusIcon className='mr-2 h-4 w-4' />
            Tambah Siswa
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='ml-auto h-8 lg:flex'>
                <ChevronDownIcon className='h-4 w-4' />
                <span className='ml-2'>Kolom</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className='capitalize'
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }>
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className='relative flex flex-col gap-4 overflow-auto px-4 lg:px-6'>
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader className='sticky top-0 z-10 bg-muted'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='h-24 text-center'>
                    Tidak ada data siswa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className='flex items-center justify-between px-4'>
          <div className='hidden flex-1 text-sm text-muted-foreground lg:flex'>
            Menampilkan{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{" "}
            sampai{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            dari {table.getFilteredRowModel().rows.length} data
          </div>
          <div className='flex w-full items-center gap-8 lg:w-fit'>
            <div className='hidden items-center gap-2 lg:flex'>
              <Label htmlFor='rows-per-page' className='text-sm font-medium'>
                Baris per halaman
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}>
                <SelectTrigger className='w-20' id='rows-per-page'>
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
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
              Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
              {table.getPageCount()}
            </div>
            <div className='ml-auto flex items-center gap-2 lg:ml-0'>
              <Button
                variant='outline'
                className='hidden h-8 w-8 p-0 lg:flex'
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}>
                <span className='sr-only'>Ke halaman pertama</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}>
                <span className='sr-only'>Ke halaman sebelumnya</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}>
                <span className='sr-only'>Ke halaman berikutnya</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant='outline'
                className='hidden size-8 lg:flex'
                size='icon'
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}>
                <span className='sr-only'>Ke halaman terakhir</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 