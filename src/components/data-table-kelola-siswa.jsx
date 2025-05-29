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
  CalendarIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const columns = [
  {
    id: "number",
    header: "No",
    cell: ({ row }) => <div className="text-left">{row.index + 1}</div>,
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
      <Badge variant="outline" className="capitalize">
        {row.original.kelas_sekolah?.nama_kelas || "-"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="success" className="flex gap-1 items-center">
        {row.original.is_active ? (
          <>
            <CheckIcon className="h-3 w-3" />
            Aktif
          </>
        ) : (
          "Tidak Aktif"
        )}
      </Badge>
    ),
  },
  {
    accessorKey: "kehadiran",
    header: "Status Kehadiran",
    cell: ({ row, table }) => {
      const { attendanceData } = table.options.meta || {};
      const studentAttendance = attendanceData?.find(
        (attendance) => attendance.siswa.id === row.original.id
      );

      if (!studentAttendance) {
        return (
          <Badge variant="destructive" className="flex gap-1 items-center">
            <XIcon className="h-3 w-3" />
            Tidak Hadir
          </Badge>
        );
      }

      const getStatusBadge = (status) => {
        switch (status) {
          case "masuk":
            return (
              <Badge variant="success" className="flex gap-1 items-center">
                <CheckIcon className="h-3 w-3" />
                Hadir
              </Badge>
            );
          case "telat":
            return (
              <Badge variant="warning" className="flex gap-1 items-center">
                <AlertCircleIcon className="h-3 w-3" />
                Terlambat
              </Badge>
            );
          case "pulang":
            return (
              <Badge variant="success" className="flex gap-1 items-center">
                <CheckIcon className="h-3 w-3" />
                Pulang
              </Badge>
            );
          case "izin":
            return (
              <Badge variant="warning" className="flex gap-1 items-center">
                <AlertCircleIcon className="h-3 w-3" />
                Izin
              </Badge>
            );
          case "sakit":
            return (
              <Badge variant="warning" className="flex gap-1 items-center">
                <AlertCircleIcon className="h-3 w-3" />
                Sakit
              </Badge>
            );
          default:
            return (
              <Badge variant="destructive" className="flex gap-1 items-center">
                <XIcon className="h-3 w-3" />
                Tidak Hadir
              </Badge>
            );
        }
      };

      return getStatusBadge(studentAttendance.jenis_absen);
    },
  },
  {
    accessorKey: "foto",
    header: "Foto Siswa",
    cell: ({ row }) => {
      const foto =
        row.original.foto_wajah && row.original.foto_wajah.length > 0
          ? `${process.env.NEXT_PUBLIC_API_URL}${row.original.foto_wajah[0].formats.thumbnail.url}`
          : null;

      // Get initials from name
      const getInitials = (name) => {
        return name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      };

      if (foto) {
        return (
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <img
              src={foto}
              alt={`Foto ${row.original.nama}`}
              className="object-cover h-full w-full"
            />
          </div>
        );
      }

      return (
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">
            {getInitials(row.original.nama)}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row, table }) => {
      const [showDetail, setShowDetail] = React.useState(false);
      const [showAttendanceDialog, setShowAttendanceDialog] =
        React.useState(false);
      const [selectedStatus, setSelectedStatus] = React.useState("");
      const [isUpdating, setIsUpdating] = React.useState(false);
      const { isWaliKelas, date, attendanceData } = table.options.meta || {};

      // Get initials from name
      const getInitials = (name) => {
        return name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      };

      const studentAttendance = attendanceData?.find(
        (attendance) => attendance.siswa.id === row.original.id
      );

      const handleAttendanceUpdate = async () => {
        if (!selectedStatus) return;

        setIsUpdating(true);
        try {
          const formattedDate = format(date, "yyyy-MM-dd");
          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/presensi-siswas`;

          if (studentAttendance) {
            // Update existing attendance using documentId
            await fetch(`${url}/${studentAttendance.documentId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                data: {
                  jenis_absen: selectedStatus,
                  waktu_absen: `${formattedDate}T00:00:00.000Z`,
                },
              }),
            });
          } else {
            // Create new attendance
            await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                data: {
                  siswa: row.original.id,
                  jenis_absen: selectedStatus,
                  waktu_absen: `${formattedDate}T00:00:00.000Z`,
                },
              }),
            });
          }

          toast.success("Status kehadiran berhasil diperbarui");
          setShowAttendanceDialog(false);
          // Refresh attendance data
          table.options.meta?.onAttendanceUpdate?.();
        } catch (error) {
          console.error("Error updating attendance:", error);
          toast.error("Gagal memperbarui status kehadiran");
        } finally {
          setIsUpdating(false);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                size="icon"
              >
                <MoreVerticalIcon />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setShowDetail(true)}>
                Lihat Detail
              </DropdownMenuItem>
              {isWaliKelas && !studentAttendance?.jenis_absen && (
                <DropdownMenuItem onClick={() => setShowAttendanceDialog(true)}>
                  Atur Kehadiran
                </DropdownMenuItem>
              )}
              {isWaliKelas && studentAttendance?.jenis_absen && (
                <DropdownMenuItem onClick={() => setShowAttendanceDialog(true)}>
                  Ubah Status
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Detail Siswa</DialogTitle>
                <DialogDescription>
                  Informasi lengkap data siswa
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                    {row.original.foto_wajah &&
                    row.original.foto_wajah.length > 0 ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}${row.original.foto_wajah[0].url}`}
                        alt={`Foto ${row.original.nama}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <span className="text-4xl font-medium text-muted-foreground">
                          {getInitials(row.original.nama)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="grid gap-1">
                      <div className="text-sm font-medium">
                        {row.original.nama}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.original.nomor_induk_siswa}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="grid gap-1">
                      <div className="text-sm font-medium">Kelas</div>
                      <Badge variant="outline" className="capitalize">
                        {row.original.kelas_sekolah?.nama_kelas || "-"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="grid gap-1">
                      <div className="text-sm font-medium">
                        Status Kehadiran
                      </div>
                      {studentAttendance ? (
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              studentAttendance.jenis_absen === "masuk" ||
                              studentAttendance.jenis_absen === "pulang"
                                ? "success"
                                : "warning"
                            }
                          >
                            {studentAttendance.jenis_absen === "masuk"
                              ? "Hadir"
                              : studentAttendance.jenis_absen === "telat"
                              ? "Terlambat"
                              : studentAttendance.jenis_absen === "pulang"
                              ? "Pulang"
                              : studentAttendance.jenis_absen === "izin"
                              ? "Izin"
                              : studentAttendance.jenis_absen === "sakit"
                              ? "Sakit"
                              : "Tidak Hadir"}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Waktu:{" "}
                            {format(
                              new Date(studentAttendance.waktu_absen),
                              "HH:mm:ss"
                            )}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="destructive">Tidak Hadir</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={row.original.is_active ? "success" : "secondary"}
                      className="flex gap-1 items-center"
                    >
                      {row.original.is_active && (
                        <CheckIcon className="h-3 w-3" />
                      )}
                      {row.original.is_active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showAttendanceDialog}
            onOpenChange={setShowAttendanceDialog}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Atur Status Kehadiran</DialogTitle>
                <DialogDescription>
                  Pilih status kehadiran untuk {row.original.nama}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Status Kehadiran</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masuk">Hadir</SelectItem>
                      <SelectItem value="telat">Terlambat</SelectItem>
                      <SelectItem value="pulang">Pulang</SelectItem>
                      <SelectItem value="izin">Izin</SelectItem>
                      <SelectItem value="sakit">Sakit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAttendanceDialog(false)}
                  disabled={isUpdating}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAttendanceUpdate}
                  disabled={!selectedStatus || isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Simpan"
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

export function DataTableKelolaSiswa({
  data,
  title,
  kelasId,
  pagination: serverPagination,
}) {
  const router = useRouter();
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: serverPagination.page - 1,
    pageSize: serverPagination.pageSize,
  });
  const [date, setDate] = React.useState(new Date());
  const [attendanceData, setAttendanceData] = React.useState([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Check if user is wali kelas
  const isWaliKelas = !!kelasId;

  // Function to handle search with debounce
  const handleSearch = React.useCallback(
    (value) => {
      setSearchValue(value);
      const searchParams = new URLSearchParams(window.location.search);
      if (value) {
        searchParams.set("search", value);
      } else {
        searchParams.delete("search");
      }
      searchParams.set("page", "1"); // Reset to first page when searching
      router.push(`/dashboard/kelola-siswa?${searchParams.toString()}`);
    },
    [router]
  );

  // Function to fetch attendance data
  const fetchAttendanceData = async (selectedDate) => {
    if (!isWaliKelas) return; // Don't fetch if not wali kelas

    setIsLoadingAttendance(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/presensi-siswas?populate=*&filters[waktu_absen][$gte]=${formattedDate}T00:00:00.000Z&filters[waktu_absen][$lte]=${formattedDate}T23:59:59.999Z`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch attendance data");
      }

      const result = await response.json();
      setAttendanceData(result.data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast.error("Gagal mengambil data kehadiran");
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  // Fetch attendance data when date changes
  React.useEffect(() => {
    fetchAttendanceData(date);
  }, [date, isWaliKelas]);

  // Handle page change
  const handlePageChange = async (newPageIndex) => {
    const newPage = newPageIndex + 1;
    router.push(
      `/dashboard/kelola-siswa?page=${newPage}&pageSize=${pagination.pageSize}`
    );
  };

  // Handle page size change
  const handlePageSizeChange = async (newPageSize) => {
    router.push(`/dashboard/kelola-siswa?page=1&pageSize=${newPageSize}`);
  };

  // Filter columns based on wali kelas status
  const filteredColumns = columns.filter((column) => {
    if (column.accessorKey === "kehadiran") {
      return isWaliKelas;
    }
    return true;
  });

  const table = useReactTable({
    data,
    columns: filteredColumns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    meta: {
      attendanceData,
      isWaliKelas,
      date,
      onAttendanceUpdate: () => fetchAttendanceData(date),
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
    pageCount: serverPagination.pageCount,
    manualPagination: true,
  });

  return (
    <div className="flex w-full flex-col justify-start gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 lg:px-6">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {isWaliKelas && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "PPP", { locale: id })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
          <Input
            placeholder="Cari nama siswa..."
            value={searchValue}
            onChange={(event) => handleSearch(event.target.value)}
            className="w-full sm:max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto sm:ml-auto h-8"
              >
                <ChevronDownIcon className="h-4 w-4" />
                <span className="ml-2">Kolom</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-x-auto overflow-y-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
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
              {isLoadingAttendance ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Memuat data kehadiran...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state="">
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
                    className="h-24 text-center"
                  >
                    Tidak ada data siswa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-4">
          <div className="hidden md:flex flex-1 text-sm text-muted-foreground">
            Menampilkan{" "}
            {serverPagination.page * serverPagination.pageSize -
              serverPagination.pageSize +
              1}{" "}
            sampai{" "}
            {Math.min(
              serverPagination.page * serverPagination.pageSize,
              serverPagination.total
            )}{" "}
            dari {serverPagination.total} data
          </div>
          <div className="flex w-full flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 lg:w-fit">
            <div className="hidden sm:flex items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Baris per halaman
              </Label>
              <Select
                value={`${pagination.pageSize}`}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-20" id="rows-per-page">
                  <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-full justify-center text-sm font-medium sm:w-fit">
              Halaman {serverPagination.page} dari {serverPagination.pageCount}
            </div>
            <div className="flex w-full justify-center items-center gap-2 sm:ml-0 sm:w-fit">
              <Button
                variant="outline"
                className="hidden md:flex h-8 w-8 p-0"
                onClick={() => handlePageChange(0)}
                disabled={serverPagination.page === 1}
              >
                <span className="sr-only">Ke halaman pertama</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => handlePageChange(serverPagination.page - 2)}
                disabled={serverPagination.page === 1}
              >
                <span className="sr-only">Ke halaman sebelumnya</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => handlePageChange(serverPagination.page)}
                disabled={serverPagination.page === serverPagination.pageCount}
              >
                <span className="sr-only">Ke halaman berikutnya</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden md:flex size-8"
                size="icon"
                onClick={() => handlePageChange(serverPagination.pageCount - 1)}
                disabled={serverPagination.page === serverPagination.pageCount}
              >
                <span className="sr-only">Ke halaman terakhir</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
