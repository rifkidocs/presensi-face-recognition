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
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { z } from "zod";

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
      header: "Nama Pegawai",
    cell: ({ row }) => <div className="font-medium">{row.getValue("nama")}</div>,
  },
  {
    accessorKey: "nomor_induk",
    header: "NIP",
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
                  <DialogTitle>Detail Presensi Pegawai</DialogTitle>
                  <DialogDescription>
                    Informasi lengkap presensi pegawai
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

export function DataTablePegawai({ data: initialData }) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
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

  const table = useReactTable({
    data: filteredData,
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

  const handleExport = (exportFormat) => {
    const exportData = filteredData.map(item => ({
      "Nama Pegawai": item.nama,
      "NIP": item.nomor_induk,
      "Waktu Absen": format(parseISO(item.waktu_absen), "dd MMMM yyyy HH:mm"),
      "Jenis Absen": item.jenis_absen,
      "Koordinat": item.koordinat,
      "Status": item.status
    }));

    if (exportFormat === "excel") {
      // Convert to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in the value
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(",")
        )
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `presensi-pegawai-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
    } else if (exportFormat === "pdf") {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Laporan Presensi Pegawai", 14, 15);
      
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

      // Add table
      autoTable(doc, {
        startY: timeFilter !== "all" ? 30 : 20,
        head: [Object.keys(exportData[0])],
        body: exportData.map(item => Object.values(item)),
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Nama Pegawai
          1: { cellWidth: 25 }, // NIP
          2: { cellWidth: 35 }, // Waktu Absen
          3: { cellWidth: 25 }, // Jenis Absen
          4: { cellWidth: 35 }, // Koordinat
          5: { cellWidth: 25 }, // Status
        },
      });

      // Save the PDF
      doc.save(`presensi-pegawai-${format(new Date(), "yyyy-MM-dd")}.pdf`);
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
                {table.getRowModel().rows?.length ? (
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
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{" "}
            to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} entries
          </div>
          <div className='flex w-full items-center gap-8 lg:w-fit'>
            <div className='hidden items-center gap-2 lg:flex'>
              <Label htmlFor='rows-per-page' className='text-sm font-medium'>
                Rows per page
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
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className='ml-auto flex items-center gap-2 lg:ml-0'>
              <Button
                variant='outline'
                className='hidden h-8 w-8 p-0 lg:flex'
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}>
                <span className='sr-only'>Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}>
                <span className='sr-only'>Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}>
                <span className='sr-only'>Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant='outline'
                className='hidden size-8 lg:flex'
                size='icon'
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}>
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
