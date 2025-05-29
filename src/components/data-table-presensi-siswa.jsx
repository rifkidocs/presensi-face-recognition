"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Badge } from "./ui/badge";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  GripVerticalIcon,
  LoaderIcon,
  MapPinIcon,
  MoreVerticalIcon,
  PlusIcon,
  TrendingUpIcon,
  UserIcon,
  DownloadIcon,
  FileDownIcon,
  CalendarIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { id } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const schema = z.object({
  id: z.number(),
  nama: z.string(),
  nomor_induk: z.string(),
  waktu_absen: z.string(),
  jenis_absen: z.string(),
  koordinat: z.string(),
  status: z.string(),
  foto: z.string(),
});

// Create a separate component for the drag handle
function DragHandle({ row }) {
  const { attributes, listeners } = useSortable({
    id: row.original.id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant='ghost'
      size='icon'
      className='size-7 text-muted-foreground hover:bg-transparent'>
      <GripVerticalIcon className='size-3 text-muted-foreground' />
      <span className='sr-only'>Drag to reorder</span>
    </Button>
  );
}

const columns = [
  {
    id: "drag",
    size: 20,
    minSize: 20,
    maxSize: 20,
    cell: ({ row }) => <DragHandle row={row} />,
  },
  {
    accessorKey: "nama",
    header: "Nama Siswa",
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue("nama")}</div>
    ),
  },
  {
    accessorKey: "nomor_induk",
    header: "NIS",
    cell: ({ row }) => <div>{row.original.nomor_induk}</div>,
  },
  {
    accessorKey: "waktu_absen",
    header: "Waktu Absen",
    cell: ({ row }) => {
      const date = parseISO(row.getValue("waktu_absen"));
      return <div>{format(date, "dd MMMM yyyy HH:mm")}</div>;
    },
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
                <DialogTitle>Detail Presensi Siswa</DialogTitle>
                <DialogDescription>
                  Informasi lengkap presensi siswa
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
                        {row.original.nomor_induk}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <MapPinIcon className='h-4 w-4 text-muted-foreground' />
                    <div className='grid gap-1'>
                      <div className='text-sm font-medium'>Lokasi Presensi</div>
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

function DraggableRow({ row }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className='relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80'
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// Add this new component before the DataTableSiswa component
function ExportDialog({ open, onOpenChange, onExport, kelasData }) {
  const [selectedKelas, setSelectedKelas] = React.useState("");
  const [dateRange, setDateRange] = React.useState([null, null]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Presensi</DialogTitle>
          <DialogDescription>
            Pilih kelas dan rentang tanggal untuk export data presensi
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="kelas">Kelas</Label>
            <Select
              value={selectedKelas}
              onValueChange={setSelectedKelas}
            >
              <SelectTrigger id="kelas">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {kelasData?.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.nama_kelas}>
                    {kelas.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Rentang Tanggal</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange[0] ? format(dateRange[0], "yyyy-MM-dd") : ''}
                onChange={(e) => setDateRange([e.target.value ? parseISO(e.target.value) : null, dateRange[1]])}
              />
              <span>sampai</span>
              <Input
                type="date"
                value={dateRange[1] ? format(dateRange[1], "yyyy-MM-dd") : ''}
                onChange={(e) => setDateRange([dateRange[0], e.target.value ? parseISO(e.target.value) : null])}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onExport(selectedKelas, dateRange)}
            disabled={!selectedKelas || !dateRange[0] || !dateRange[1]}
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DataTableSiswa({
  data: initialData,
  pagination: initialPagination,
  jwtToken,
  kelasData,
}) {
  const [data, setData] = React.useState(() =>
    initialData.map((item) => ({
      id: item.id,
      nama: item.siswa.nama,
      nomor_induk: item.siswa.nomor_induk_siswa,
      waktu_absen: item.waktu_absen,
      jenis_absen: item.jenis_absen,
      koordinat: item.koordinat_absen,
      status: item.is_validated ? "Tervalidasi" : "Belum Tervalidasi",
      foto: `${process.env.NEXT_PUBLIC_API_URL}${
        item.foto_absen?.formats?.thumbnail?.url || ""
      }`,
    }))
  );
  const [pagination, setPagination] = React.useState(initialPagination);
  const [isLoading, setIsLoading] = React.useState(false);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [timeFilter, setTimeFilter] = React.useState("all");
  const [dateRange, setDateRange] = React.useState([null, null]);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [selectedKelas, setSelectedKelas] = React.useState("");
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  React.useEffect(() => {
    // Create a portal element for the date picker if it doesn't exist
    let datePickerPortal = document.getElementById('datepicker-portal');
    if (!datePickerPortal) {
      datePickerPortal = document.createElement('div');
      datePickerPortal.setAttribute('id', 'datepicker-portal');
      document.body.appendChild(datePickerPortal);
    }
    return () => {
      // Clean up the portal element when the component unmounts
      if (datePickerPortal) {
        datePickerPortal.remove();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  const dataIds = React.useMemo(() => data?.map(({ id }) => id) || [], [data]);

  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    if (timeFilter !== "all") {
      switch (timeFilter) {
        case "single":
          if (selectedDate) {
            const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
            filtered = filtered.filter((item) => {
              const itemDate = parseISO(item.waktu_absen);
              return format(itemDate, "yyyy-MM-dd") === selectedDateStr;
            });
          }
          break;
        case "range":
          if (dateRange && dateRange[0] && dateRange[1]) {
            // Mengatur waktu endDate ke 23:59:59 untuk mencakup seluruh hari
            const endDateWithTime = new Date(dateRange[1]);
            endDateWithTime.setHours(23, 59, 59, 999);

            filtered = filtered.filter((item) => {
              const itemDate = parseISO(item.waktu_absen);
              return isWithinInterval(itemDate, {
                start: dateRange[0],
                end: endDateWithTime,
              });
            });
          }
          break;
      }
    }

    return filtered;
  }, [data, timeFilter, selectedDate, dateRange]);

  const fetchData = async (page, pageSize, kelas = selectedKelas) => {
    setIsLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/content-manager/collection-types/api::presensi-siswa.presensi-siswa?page=${page}&pageSize=${pageSize}&sort=waktu_absen:DESC&populate[siswa][populate]=kelas_sekolah`;
      
      if (kelas) {
        url += `&filters[siswa][kelas_sekolah][nama_kelas][$eq]=${kelas}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const responseData = await res.json();
      setData(
        responseData.results.map((item) => ({
          id: item.id,
          nama: item.siswa.nama,
          nomor_induk: item.siswa.nomor_induk_siswa,
          waktu_absen: item.waktu_absen,
          jenis_absen: item.jenis_absen,
          koordinat: item.koordinat_absen,
          status: item.is_validated ? "Tervalidasi" : "Belum Tervalidasi",
          foto: `${process.env.NEXT_PUBLIC_API_URL}${
            item.foto_absen?.formats?.thumbnail?.url || ""
          }`,
        }))
      );
      setPagination(responseData.pagination);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const table = useReactTable({
    data: timeFilter !== "all" ? filteredData : data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      },
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function"
          ? updater({
              pageIndex: pagination.page - 1,
              pageSize: pagination.pageSize,
            })
          : updater;

      fetchData(newPagination.pageIndex + 1, newPagination.pageSize);
    },
    pageCount: pagination.pageCount,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const handleExport = async (kelas, dateRange) => {
    setIsLoading(true);
    try {
      // 1. Get all students from the selected class
      const kelasResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/kelas-sekolahs?filters[nama_kelas][$eq]=${kelas}&populate=siswas`,
      );
      
      if (!kelasResponse.ok) {
        throw new Error("Failed to fetch class data");
      }
      
      const kelasData = await kelasResponse.json();
      const students = kelasData.data[0]?.siswas || [];

      // 2. Get all attendance data for the date range
      let allAttendanceData = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const attendanceResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/content-manager/collection-types/api::presensi-siswa.presensi-siswa?page=${page}&pageSize=100&sort=waktu_absen:ASC&filters[siswa][kelas_sekolah][nama_kelas][$eq]=${kelas}&filters[waktu_absen][$gte]=${format(dateRange[0], "yyyy-MM-dd")}&filters[waktu_absen][$lte]=${format(dateRange[1], "yyyy-MM-dd")}&populate=siswa`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          }
        );

        if (!attendanceResponse.ok) {
          throw new Error("Failed to fetch attendance data");
        }

        const responseData = await attendanceResponse.json();
        allAttendanceData = [...allAttendanceData, ...responseData.results];

        if (responseData.results.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // 3. Create date range array
      const dates = [];
      let currentDate = new Date(dateRange[0]);
      while (currentDate <= dateRange[1]) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 4. Create Excel data
      const headers = ["Nama Siswa", "NIS", ...dates.map(date => format(date, "dd/MM/yyyy"))];
      
      const rows = students.map(student => {
        const row = [student.nama, student.nomor_induk_siswa];
        
        // Add attendance status for each date
        dates.forEach(date => {
          const attendance = allAttendanceData.find(
            a => a.siswa.id === student.id && 
            format(parseISO(a.waktu_absen), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
          );
          
          if (attendance) {
            row.push(attendance.jenis_absen);
          } else {
            row.push("Tidak Masuk");
          }
        });
        
        return row;
      });

      // 5. Create CSV content
      const csvContent = [
        ["Laporan Presensi Siswa"],
        [""],
        [`Kelas: ${kelas}`],
        [`Periode: ${format(dateRange[0], "dd MMMM yyyy")} - ${format(dateRange[1], "dd MMMM yyyy")}`],
        [""],
        headers,
        ...rows
      ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

      // 6. Download the file
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `presensi-${kelas}-${format(dateRange[0], "yyyy-MM-dd")}-${format(dateRange[1], "yyyy-MM-dd")}.csv`;
      link.click();

      setShowExportDialog(false);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex w-full flex-col justify-start gap-6'>
      <div className='relative flex flex-col gap-4 overflow-auto px-4 lg:px-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='flex items-center gap-4'>
              <Label htmlFor='kelas-filter'>Filter Kelas:</Label>
              <Select
                value={selectedKelas}
                onValueChange={(value) => {
                  setSelectedKelas(value);
                  fetchData(1, pagination.pageSize, value === "all" ? null : value);
                }}>
                <SelectTrigger className='w-[180px]' id='kelas-filter'>
                  <SelectValue placeholder='Pilih kelas' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasData?.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.nama_kelas}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-4'>
              <Label htmlFor='time-filter'>Filter Tanggal:</Label>
              <Select
                value={timeFilter}
                onValueChange={(value) => {
                  setTimeFilter(value);
                  if (value === "all") {
                    setSelectedDate(null);
                    setDateRange([null, null]);
                  }
                }}>
                <SelectTrigger className='w-[180px]' id='time-filter'>
                  <SelectValue placeholder='Pilih filter tanggal' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Semua Tanggal</SelectItem>
                  <SelectItem value='single'>Tanggal Tertentu</SelectItem>
                  <SelectItem value='range'>Rentang Tanggal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {timeFilter === "single" && (
              <div className='flex items-center gap-2 relative z-10'>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd MMMM yyyy") : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {timeFilter === "range" && (
              <div className='flex items-center gap-2 relative z-10'>
                <div className='flex items-center gap-2'>
                  <Label htmlFor='start-date'>Tanggal Mulai:</Label>
                  <Input
                    id='start-date'
                    type='date'
                    value={dateRange[0] ? format(dateRange[0], "yyyy-MM-dd") : ''}
                    onChange={(e) => setDateRange([e.target.value ? parseISO(e.target.value) : null, dateRange[1]])}
                    className='flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <Label htmlFor='end-date'>Tanggal Akhir:</Label>
                  <Input
                    id='end-date'
                    type='date'
                    value={dateRange[1] ? format(dateRange[1], "yyyy-MM-dd") : ''}
                    onChange={(e) => setDateRange([dateRange[0], e.target.value ? parseISO(e.target.value) : null])}
                    className='flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                  />
                </div>
              </div>
            )}
          </div>
          <Button 
            variant='outline' 
            className='gap-2'
            onClick={() => setShowExportDialog(true)}
          >
            <DownloadIcon className='h-4 w-4' />
            Export
          </Button>
        </div>
        <div className='overflow-hidden rounded-lg border'>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}>
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
              <TableBody className='**:data-[slot=table-cell]:first:w-8'>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'>
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className='flex items-center justify-between px-4'>
          <div className='hidden flex-1 text-sm text-muted-foreground lg:flex'>
            Showing{" "}
            {pagination.page * pagination.pageSize - pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
            of {pagination.total} entries
          </div>
          <div className='flex w-full items-center gap-8 lg:w-fit'>
            <div className='hidden items-center gap-2 lg:flex'>
              <Label htmlFor='rows-per-page' className='text-sm font-medium'>
                Rows per page
              </Label>
              <Select
                value={`${pagination.pageSize}`}
                onValueChange={(value) => {
                  fetchData(1, Number(value));
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
              Page {pagination.page} of {pagination.pageCount}
            </div>
            <div className='ml-auto flex items-center gap-2 lg:ml-0'>
              <Button
                variant='outline'
                className='hidden h-8 w-8 p-0 lg:flex'
                onClick={() => fetchData(1, pagination.pageSize)}
                disabled={pagination.page === 1}>
                <span className='sr-only'>Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() =>
                  fetchData(pagination.page - 1, pagination.pageSize)
                }
                disabled={pagination.page === 1}>
                <span className='sr-only'>Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() =>
                  fetchData(pagination.page + 1, pagination.pageSize)
                }
                disabled={pagination.page === pagination.pageCount}>
                <span className='sr-only'>Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant='outline'
                className='hidden size-8 lg:flex'
                size='icon'
                onClick={() =>
                  fetchData(pagination.pageCount, pagination.pageSize)
                }
                disabled={pagination.page === pagination.pageCount}>
                <span className='sr-only'>Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        kelasData={kelasData}
      />
    </div>
  );
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },

  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
};

function TableCellViewer({ item }) {
  const isMobile = useIsMobile();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='link' className='w-fit px-0 text-left text-foreground'>
          {item.header}
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='flex flex-col'>
        <SheetHeader className='gap-1'>
          <SheetTitle>{item.header}</SheetTitle>
          <SheetDescription>
            Showing total visitors for the last 6 months
          </SheetDescription>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm'>
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey='month'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator='dot' />}
                  />
                  <Area
                    dataKey='mobile'
                    type='natural'
                    fill='var(--color-mobile)'
                    fillOpacity={0.6}
                    stroke='var(--color-mobile)'
                    stackId='a'
                  />
                  <Area
                    dataKey='desktop'
                    type='natural'
                    fill='var(--color-desktop)'
                    fillOpacity={0.4}
                    stroke='var(--color-desktop)'
                    stackId='a'
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className='grid gap-2'>
                <div className='flex gap-2 font-medium leading-none'>
                  Trending up by 5.2% this month{" "}
                  <TrendingUpIcon className='size-4' />
                </div>
                <div className='text-muted-foreground'>
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className='flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='header'>Header</Label>
              <Input id='header' defaultValue={item.header} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='type'>Type</Label>
                <Select defaultValue={item.type}>
                  <SelectTrigger id='type' className='w-full'>
                    <SelectValue placeholder='Select a type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Table of Contents'>
                      Table of Contents
                    </SelectItem>
                    <SelectItem value='Executive Summary'>
                      Executive Summary
                    </SelectItem>
                    <SelectItem value='Technical Approach'>
                      Technical Approach
                    </SelectItem>
                    <SelectItem value='Design'>Design</SelectItem>
                    <SelectItem value='Capabilities'>Capabilities</SelectItem>
                    <SelectItem value='Focus Documents'>
                      Focus Documents
                    </SelectItem>
                    <SelectItem value='Narrative'>Narrative</SelectItem>
                    <SelectItem value='Cover Page'>Cover Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='status'>Status</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id='status' className='w-full'>
                    <SelectValue placeholder='Select a status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Done'>Done</SelectItem>
                    <SelectItem value='In Progress'>In Progress</SelectItem>
                    <SelectItem value='Not Started'>Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='target'>Target</Label>
                <Input id='target' defaultValue={item.target} />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='limit'>Limit</Label>
                <Input id='limit' defaultValue={item.limit} />
              </div>
            </div>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='reviewer'>Reviewer</Label>
              <Select defaultValue={item.reviewer}>
                <SelectTrigger id='reviewer' className='w-full'>
                  <SelectValue placeholder='Select a reviewer' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Eddie Lake'>Eddie Lake</SelectItem>
                  <SelectItem value='Jamik Tashpulatov'>
                    Jamik Tashpulatov
                  </SelectItem>
                  <SelectItem value='Emily Whalen'>Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <SheetFooter className='mt-auto flex gap-2 sm:flex-col sm:space-x-0'>
          <Button className='w-full'>Submit</Button>
          <SheetClose asChild>
            <Button variant='outline' className='w-full'>
              Done
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
