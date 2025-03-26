import { ReactNode } from "react";

interface TableCellProps {
    children: ReactNode;
    className?: string;
    isHeader?: boolean;
    colSpan?: number;
}

export default function TableCell({ children, className = '', isHeader = false, colSpan }: TableCellProps) {
    if (isHeader) {
        return (
            <th className={className} colSpan={colSpan}>
                {children}
            </th>
        );
    }

    return (
        <td className={className} colSpan={colSpan}>
            {children}
        </td>
    );
} 