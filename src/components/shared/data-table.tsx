import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ============================================================================
// DataTable — Reusable table scaffold with column configuration
// ============================================================================

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data found.",
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn("card-elevated overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((col) => (
              <TableHead key={col.key} className={cn("text-xs font-semibold uppercase tracking-wider", col.className)}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground py-12"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={keyExtractor(row)}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// DataTableSkeleton — Loading skeleton for table shape
// ============================================================================

interface DataTableSkeletonProps {
  columns: number;
  rows?: number;
}

export function DataTableSkeleton({
  columns,
  rows = 5,
}: DataTableSkeletonProps) {
  return (
    <div className="card-elevated overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {Array.from({ length: columns }, (_, i) => (
              <TableHead key={i}>
                <div className="skeleton h-3 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }, (_, colIdx) => (
                <TableCell key={colIdx}>
                  <div className="skeleton h-4 w-full max-w-[120px]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
