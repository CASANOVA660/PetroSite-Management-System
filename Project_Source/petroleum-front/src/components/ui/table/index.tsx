import { ReactNode } from "react";
import { ChevronLeftIcon, ArrowRightIcon } from "../../../icons";

export interface Column {
  key: string;
  title: string;
}

export interface TableProps {
  children?: ReactNode;
  columns?: Column[];
  data?: any[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function Table({
  children,
  columns,
  data,
  currentPage,
  totalPages,
  onPageChange
}: TableProps) {
  if (children) {
    return <table className="w-full">{children}</table>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          {columns?.map((column) => (
            <th key={column.key}>{column.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((row, index) => (
          <tr key={index}>
            {columns?.map((column) => (
              <td key={`${index}-${column.key}`}>{row[column.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
      {totalPages && totalPages > 1 && (
        <tfoot>
          <tr>
            <td colSpan={columns?.length}>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => onPageChange?.(currentPage! - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => onPageChange?.(currentPage! + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

export { default as TableBody } from './TableBody';
export { default as TableCell } from './TableCell';
export { default as TableHeader } from './TableHeader';
export { default as TableRow } from './TableRow';

export default Table; 