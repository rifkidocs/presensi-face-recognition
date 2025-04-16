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
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
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
function DragHandle({ id }) {
  const { attributes, listeners } = useSortable({
    id,
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
    accessorKey: "nama",
    header: "Nama Siswa",
    cell: ({ row }) => <div className='font-medium'>{row.original.nama}</div>,
  },
  {
    accessorKey: "nomor_induk",
    header: "NIS",
    cell: ({ row }) => <div>{row.original.nomor_induk}</div>,
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

export function DataTable({ data: initialData }) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo(() => data?.map(({ id }) => id) || [], [data]);

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

  return (
    <div className='flex w-full flex-col justify-start gap-6'>
      <div className='relative flex flex-col gap-4 overflow-auto px-4 lg:px-6'>
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
