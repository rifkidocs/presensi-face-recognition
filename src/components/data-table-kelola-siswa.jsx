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
  AlertCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  FileEditIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
    id: "number",
    header: "No",
    cell: ({ row }) => <div className='text-left'>{row.index + 1}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nama",
    header: "Nama Siswa",
    cell: ({ row }) => <div className='font-medium'>{row.original.nama}</div>,
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
          "Tidak Aktif"
        )}
      </Badge>
    ),
  },
  {
    accessorKey: "foto",
    header: "Foto Siswa",
    cell: ({ row }) => {
      const foto =
        row.original.foto_wajah && row.original.foto_wajah.length > 0
          ? `${process.env.NEXT_PUBLIC_API_URL}${row.original.foto_wajah[0].formats.thumbnail.url}`
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
    header: "Aksi",
    cell: ({ row, table }) => {
      const [showDetail, setShowDetail] = React.useState(false);
      const [isRemoving, setIsRemoving] = React.useState(false);
      const [showConfirmRemove, setShowConfirmRemove] = React.useState(false);
      const hasClass = !!row.original.kelas_sekolah;

      // Get the removeStudentFromClass function from table meta
      const { removeStudentFromClass } = table.options.meta || {};

      const handleRemoveStudent = async () => {
        if (removeStudentFromClass) {
          setIsRemoving(true);
          try {
            await removeStudentFromClass(row.original.documentId);
            toast.success("Siswa berhasil dihapus dari kelas");
            setShowConfirmRemove(false);
          } catch (error) {
            console.error("Error removing student:", error);
            toast.error("Gagal menghapus siswa dari kelas");
          } finally {
            setIsRemoving(false);
          }
        }
      };

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
              {hasClass && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className='text-destructive'
                    onClick={() => setShowConfirmRemove(true)}>
                    <TrashIcon className='mr-2 h-4 w-4' />
                    Hapus dari Kelas
                  </DropdownMenuItem>
                </>
              )}
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
                      src={
                        row.original.foto_wajah &&
                        row.original.foto_wajah.length > 0
                          ? `${process.env.NEXT_PUBLIC_API_URL}${row.original.foto_wajah[0].url}`
                          : "/default-avatar.png"
                      }
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
                      variant={row.original.is_active ? "success" : "secondary"}
                      className='flex gap-1 items-center'>
                      {row.original.is_active && (
                        <CheckIcon className='h-3 w-3' />
                      )}
                      {row.original.is_active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Confirm Remove Dialog */}
          <Dialog open={showConfirmRemove} onOpenChange={setShowConfirmRemove}>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Hapus Siswa dari Kelas</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus siswa ini dari kelas?
                  Tindakan ini tidak akan menghapus data siswa dari sistem.
                </DialogDescription>
              </DialogHeader>
              <div className='flex items-center gap-4 py-3'>
                <AlertCircleIcon className='h-10 w-10 text-destructive' />
                <div>
                  <p className='font-medium'>{row.original.nama}</p>
                  <p className='text-sm text-muted-foreground'>
                    Kelas: {row.original.kelas_sekolah?.nama_kelas}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setShowConfirmRemove(false)}>
                  Batal
                </Button>
                <Button
                  variant='destructive'
                  onClick={handleRemoveStudent}
                  disabled={isRemoving}>
                  {isRemoving ? (
                    <>
                      <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <TrashIcon className='mr-2 h-4 w-4' />
                      Hapus dari Kelas
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    },
  },
];

export function DataTableKelolaSiswa({ data, title, kelasId }) {
  const router = useRouter();
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [showAddStudentDialog, setShowAddStudentDialog] = React.useState(false);
  const [availableStudents, setAvailableStudents] = React.useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState("");
  const [isAddingStudent, setIsAddingStudent] = React.useState(false);

  // Function to remove student from class
  const removeStudentFromClass = async (studentId) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/siswas/${studentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            kelas_sekolah: null,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to remove student from class");
    }

    // Refresh the page to show updated data
    router.refresh();
  };

  // Function to add student to class
  const addStudentToClass = async () => {
    if (!selectedStudent || !kelasId) return;

    setIsAddingStudent(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/siswas/${selectedStudent}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              kelas_sekolah: kelasId,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add student to class");
      }

      toast.success("Siswa berhasil ditambahkan ke kelas");
      setShowAddStudentDialog(false);
      setSelectedStudent("");

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Gagal menambahkan siswa ke kelas");
    } finally {
      setIsAddingStudent(false);
    }
  };

  // Function to fetch students without a class
  const fetchAvailableStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/siswas?filters[kelas_sekolah][$null]=true&populate=*`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch available students");
      }

      const result = await response.json();
      setAvailableStudents(result.data || []);
    } catch (error) {
      console.error("Error fetching available students:", error);
      toast.error("Gagal memuat daftar siswa");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleAddStudentClick = () => {
    setShowAddStudentDialog(true);
    fetchAvailableStudents();
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    meta: {
      removeStudentFromClass,
    },
    getRowId: (row) => row.id.toString(),
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
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 lg:px-6'>
        <div>
          <h3 className='text-lg font-medium'>{title}</h3>
        </div>
        <div className='flex flex-col sm:flex-row items-center gap-2'>
          <Input
            placeholder='Filter nama...'
            value={table.getColumn("nama")?.getFilterValue() || ""}
            onChange={(event) =>
              table.getColumn("nama")?.setFilterValue(event.target.value)
            }
            className='w-full sm:max-w-sm'
          />
          {kelasId && (
            <Button
              variant='outline'
              size='sm'
              className='w-full sm:w-auto sm:ml-auto h-8'
              onClick={handleAddStudentClick}>
              <PlusIcon className='mr-2 h-4 w-4' />
              Tambah Siswa
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='w-full sm:w-auto sm:ml-auto h-8'>
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
        <div className='overflow-x-auto overflow-y-hidden rounded-lg border'>
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
                  <TableRow key={row.id} data-state=''>
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
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-4'>
          <div className='hidden md:flex flex-1 text-sm text-muted-foreground'>
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
          <div className='flex w-full flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 lg:w-fit'>
            <div className='hidden sm:flex items-center gap-2 lg:flex'>
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
            <div className='flex w-full justify-center text-sm font-medium sm:w-fit'>
              Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
              {table.getPageCount()}
            </div>
            <div className='flex w-full justify-center items-center gap-2 sm:ml-0 sm:w-fit'>
              <Button
                variant='outline'
                className='hidden md:flex h-8 w-8 p-0'
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
                className='hidden md:flex size-8'
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

      {/* Add Student Dialog */}
      <Dialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Tambah Siswa ke Kelas</DialogTitle>
            <DialogDescription>
              Pilih siswa yang ingin ditambahkan ke kelas ini. Hanya siswa yang
              belum memiliki kelas yang ditampilkan.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='student' className='text-right'>
                Siswa
              </Label>
              <div className='col-span-3'>
                {isLoadingStudents ? (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Loader2Icon className='h-4 w-4 animate-spin' />
                    Memuat daftar siswa...
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className='text-sm text-muted-foreground'>
                    Tidak ada siswa yang tersedia untuk ditambahkan.
                  </div>
                ) : (
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder='Pilih siswa...' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.map((student) => (
                        <SelectItem
                          key={student.documentId}
                          value={student.documentId.toString()}>
                          {student.nama}{" "}
                          {student.nomor_induk_siswa
                            ? `(${student.nomor_induk_siswa})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowAddStudentDialog(false)}>
              Batal
            </Button>
            <Button
              type='submit'
              onClick={addStudentToClass}
              disabled={
                !selectedStudent ||
                isAddingStudent ||
                availableStudents.length === 0
              }>
              {isAddingStudent ? (
                <>
                  <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                  Menambahkan...
                </>
              ) : (
                "Tambahkan Siswa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
