import { ArrowUpDown, ChevronDown, Download, Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'badge' | 'boolean' | 'date';
  width?: string | undefined;
  align?: 'left' | 'center' | 'right';
}

export interface TableData {
  [key: string]: any;
}

interface EnhancedTableProps {
  columns: TableColumn[];
  data: TableData[];
  title?: string | undefined;
  description?: string | undefined;
  searchable?: boolean;
  exportable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string | undefined;
}

export default function EnhancedTable({
  columns,
  data,
  title,
  description,
  searchable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  className = '',
}: EnhancedTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Filter and search data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Apply search filter
      const searchMatch =
        searchTerm === '' ||
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Apply column filters
      const filterMatch = Object.entries(filters).every(([column, filterValue]) => {
        if (!filterValue) {return true;}
        const cellValue = String(row[column]).toLowerCase();
        return cellValue.includes(filterValue.toLowerCase());
      });

      return searchMatch && filterMatch;
    });
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) {return filteredData;}

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle different data types
      let comparison = 0;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) {return sortedData;}

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleFilter = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleExport = () => {
    // Convert data to CSV
    const headers = columns.map(col => col.label).join(',');
    const rows = sortedData.map(row =>
      columns
        .map(col => {
          const value = row[col.key];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${title?.toLowerCase().replace(/\s+/g, '_') || 'table_data'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderCellContent = (value: any, column: TableColumn) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }

    switch (column.type) {
      case 'badge':
        return (
          <Badge variant={value === 'verified' ? 'default' : 'secondary'}>{String(value)}</Badge>
        );
      case 'boolean':
        return <Badge variant={value ? 'default' : 'outline'}>{value ? 'Yes' : 'No'}</Badge>;
      case 'number':
        return (
          <span className={`text-${column.align || 'right'} font-mono`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        );
      case 'date':
        return (
          <span className="text-sm">
            {value instanceof Date ? value.toLocaleDateString() : value}
          </span>
        );
      default:
        return <span>{String(value)}</span>;
    }
  };

  const getUniqueFilterValues = (columnKey: string) => {
    const values = data.map(row => row[columnKey]).filter(Boolean);
    return [...new Set(values)].slice(0, 10); // Limit to 10 options
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle className="text-xl">{title}</CardTitle>}
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            )}
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead
                    key={column.key}
                    className={`text-${column.align || 'left'}`}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(column.key)}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      )}
                      {column.filterable && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Filter className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <div className="p-2">
                              <Input
                                placeholder={`Filter ${column.label}...`}
                                value={filters[column.key] || ''}
                                onChange={e => handleFilter(column.key, e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div className="border-t pt-1">
                              {getUniqueFilterValues(column.key).map((value, index) => (
                                <DropdownMenuItem
                                  key={index}
                                  onClick={() => handleFilter(column.key, String(value))}
                                  className="text-sm"
                                >
                                  {String(value)}
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map(column => (
                      <TableCell key={column.key} className={`text-${column.align || 'left'}`}>
                        {renderCellContent(row[column.key], column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    currentPage <= 3
                      ? i + 1
                      : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;

                  if (pageNum < 1 || pageNum > totalPages) {return null;}

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
