import { ReactNode } from "react";

interface TableHeaderProps {
    children: ReactNode;
    className?: string;
}

export default function TableHeader({ children, className = "" }: TableHeaderProps) {
    return (
        <thead className={className}>
            {children}
        </thead>
    );
} 