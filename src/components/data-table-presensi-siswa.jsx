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
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
    cell: ({ row }) => <div className="font-medium">{row.getValue("nama")}</div>,
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

export function DataTableSiswa({ data: initialData, pagination: initialPagination, jwtToken }) {
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
  const [startDate, endDate] = dateRange;
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo(() => data?.map(({ id }) => id) || [], [data]);

  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    if (timeFilter !== "all") {
      const now = new Date();
      switch (timeFilter) {
        case "daily":
          const today = format(now, "yyyy-MM-dd");
          filtered = filtered.filter(item => {
            const itemDate = parseISO(item.waktu_absen);
            return format(itemDate, "yyyy-MM-dd") === today;
          });
          break;
        case "weekly":
          const weekStart = startOfWeek(now, { locale: id });
          const weekEnd = endOfWeek(now, { locale: id });
          filtered = filtered.filter(item => {
            const itemDate = parseISO(item.waktu_absen);
            return isWithinInterval(itemDate, { start: weekStart, end: weekEnd });
          });
          break;
        case "monthly":
          const monthStart = startOfMonth(now);
          const monthEnd = endOfMonth(now);
          filtered = filtered.filter(item => {
            const itemDate = parseISO(item.waktu_absen);
            return isWithinInterval(itemDate, { start: monthStart, end: monthEnd });
          });
          break;
        case "dateRange":
          if (dateRange.startDate && dateRange.endDate) {
            filtered = filtered.filter(item => {
              const itemDate = parseISO(item.waktu_absen);
              return isWithinInterval(itemDate, {
                start: dateRange.startDate,
                end: dateRange.endDate,
              });
            });
          }
          break;
      }
    }

    return filtered;
  }, [data, timeFilter, dateRange]);

  const fetchData = async (page, pageSize) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/content-manager/collection-types/api::presensi-siswa.presensi-siswa?page=${page}&pageSize=${pageSize}&sort=waktu_absen:DESC`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const responseData = await res.json();
      setData(responseData.results.map((item) => ({
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
      })));
      setPagination(responseData.pagination);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const table = useReactTable({
    data,
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
      const newPagination = typeof updater === 'function' 
        ? updater({ pageIndex: pagination.page - 1, pageSize: pagination.pageSize })
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

  const handleExport = async (exportFormat) => {
    setIsLoading(true);
    try {
      // Fetch all data for export - set pageSize to a very large number to get all records
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/content-manager/collection-types/api::presensi-siswa.presensi-siswa?sort=waktu_absen:DESC&pageSize=10000`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data for export");
      }

      const responseData = await res.json();
      const allData = responseData.results.map(item => ({
        "Nama Siswa": item.siswa.nama,
        "NIS": item.siswa.nomor_induk_siswa,
        "Waktu Absen": format(parseISO(item.waktu_absen), "dd MMMM yyyy HH:mm"),
        "Jenis Absen": item.jenis_absen,
        "Koordinat": item.koordinat_absen,
        "Status": item.is_validated ? "Tervalidasi" : "Belum Tervalidasi"
      }));

      if (exportFormat === "excel") {
        // Convert to CSV with improved formatting
        const headers = Object.keys(allData[0]);
        const csvContent = [
          // Add title row
          ["Laporan Presensi Siswa"],
          [""], // Empty row for spacing
          // Add date range if selected
          timeFilter === "custom" && startDate && endDate
            ? [`Periode: ${format(startDate, "dd MMMM yyyy")} - ${format(endDate, "dd MMMM yyyy")}`]
            : timeFilter !== "all"
            ? [`Periode: ${(() => {
                const now = new Date();
                switch (timeFilter) {
                  case "daily":
                    return format(now, "dd MMMM yyyy");
                  case "weekly":
                    return `${format(startOfWeek(now, { locale: id }), "dd MMMM yyyy")} - ${format(endOfWeek(now, { locale: id }), "dd MMMM yyyy")}`;
                  case "monthly":
                    return format(now, "MMMM yyyy");
                  default:
                    return "";
                }
              })()}`]
            : ["Semua Periode"],
          [""], // Empty row for spacing
          // Add headers
          headers,
          // Add data rows
          ...allData.map(row => 
            headers.map(header => {
              const value = row[header];
              // Escape commas and quotes in the value
              return `"${String(value).replace(/"/g, '""')}"`;
            })
          )
        ].filter(Boolean).join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `presensi-siswa-${format(new Date(), "yyyy-MM-dd")}.csv`;
        link.click();
      } else if (exportFormat === "pdf") {
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text("Laporan Presensi Siswa", 14, 15);
        
        // Add date range if selected
        if (timeFilter === "custom" && startDate && endDate) {
          doc.setFontSize(10);
          doc.text(
            `Periode: ${format(startDate, "dd MMMM yyyy")} - ${format(endDate, "dd MMMM yyyy")}`,
            14,
            25
          );
        } else if (timeFilter !== "all") {
          doc.setFontSize(10);
          const now = new Date();
          let periodText = "";
          switch (timeFilter) {
            case "daily":
              periodText = `Tanggal: ${format(now, "dd MMMM yyyy")}`;
              break;
            case "weekly":
              periodText = `Minggu: ${format(startOfWeek(now, { locale: id }), "dd MMMM yyyy")} - ${format(endOfWeek(now, { locale: id }), "dd MMMM yyyy")}`;
              break;
            case "monthly":
              periodText = `Bulan: ${format(now, "MMMM yyyy")}`;
              break;
          }
          doc.text(periodText, 14, 25);
        }

        // Add table with improved formatting
        autoTable(doc, {
          startY: timeFilter !== "all" ? 30 : 20,
          head: [Object.keys(allData[0])],
          body: allData.map(item => Object.values(item)),
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [41, 128, 185],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontSize: 8,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            0: { cellWidth: 40 }, // Nama Siswa
            1: { cellWidth: 25 }, // NIS
            2: { cellWidth: 35 }, // Waktu Absen
            3: { cellWidth: 25 }, // Jenis Absen
            4: { cellWidth: 35 }, // Koordinat
            5: { cellWidth: 25 }, // Status
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { top: 20 },
        });

        // Save the PDF
        doc.save(`presensi-siswa-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      }
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Label htmlFor="time-filter">Filter Periode:</Label>
              <Select
                value={timeFilter}
                onValueChange={(value) => {
                  setTimeFilter(value);
                  if (value !== "custom") {
                    setDateRange([null, null]);
                  }
                }}>
                <SelectTrigger className="w-[180px]" id="time-filter">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="custom">Rentang Tanggal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {timeFilter === "custom" && (
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={startDate}
                  onChange={(dates) => setDateRange(dates)}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  locale={id}
                  dateFormat="dd/MM/yyyy"
                  className="flex h-9 w-[240px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholderText="Pilih rentang tanggal"
                />
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <DownloadIcon className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileDownIcon className="mr-2 h-4 w-4" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileDownIcon className="mr-2 h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            {pagination.page * pagination.pageSize - pagination.pageSize + 1}{" "}
            to{" "}
            {Math.min(
              pagination.page * pagination.pageSize,
              pagination.total
            )}{" "}
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
                  <SelectValue
                    placeholder={pagination.pageSize}
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
                onClick={() => fetchData(pagination.page - 1, pagination.pageSize)}
                disabled={pagination.page === 1}>
                <span className='sr-only'>Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() => fetchData(pagination.page + 1, pagination.pageSize)}
                disabled={pagination.page === pagination.pageCount}>
                <span className='sr-only'>Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant='outline'
                className='hidden size-8 lg:flex'
                size='icon'
                onClick={() => fetchData(pagination.pageCount, pagination.pageSize)}
                disabled={pagination.page === pagination.pageCount}>
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
