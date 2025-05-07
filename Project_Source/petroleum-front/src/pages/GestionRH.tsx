import { useState, useRef, useEffect } from 'react';
import PageMeta from "../components/common/PageMeta";
import HRStatCards from "../components/gestion-rh/HRStatCards";
import HRSearchFilter from "../components/gestion-rh/HRSearchFilter";
import EmployeeTable from "../components/gestion-rh/EmployeeTable";
import EmployeeProfile from "../components/gestion-rh/EmployeeProfile";
import DocumentFolderView from "../components/gestion-rh/DocumentFolderView";
import AddEmployeePanel from "../components/gestion-rh/AddEmployeePanel";
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { Employee } from '../store/slices/employeesSlice';

// Remove local Employee interface
// interface Employee { ... }

interface SearchParams {
    query: string;
    department: string;
    status: string;
    sortBy: string;
}

export default function GestionRH() {
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [showDocuments, setShowDocuments] = useState(false);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
    const tableRef = useRef<HTMLDivElement>(null);
    const [tableHeight, setTableHeight] = useState(0);
    const [maxTableHeight, setMaxTableHeight] = useState(0);
    const [searchParams, setSearchParams] = useState<SearchParams>({
        query: '',
        department: '',
        status: '',
        sortBy: 'recent'
    });

    // Measure table height whenever the content changes
    useEffect(() => {
        if (tableRef.current) {
            const updateHeight = () => {
                const height = tableRef.current?.getBoundingClientRect().height || 0;
                setTableHeight(height);
                // If the table is fully filled (e.g., 10 employees), update maxTableHeight
                if (height > maxTableHeight) {
                    setMaxTableHeight(height);
                }
            };

            // Initial measurement
            updateHeight();

            // Add resize observer to track height changes
            const observer = new ResizeObserver(updateHeight);
            observer.observe(tableRef.current);

            return () => {
                if (tableRef.current) observer.unobserve(tableRef.current);
            };
        }
    }, [selectedEmployee, searchParams, maxTableHeight]);

    // Handle employee selection
    const handleSelectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setShowDocuments(false);
    };

    // Handle view documents click
    const handleViewDocuments = (employee: Employee) => {
        setSelectedEmployee(employee);
        setShowDocuments(true);
    };

    // Handle search and filter changes
    const handleSearchChange = (params: SearchParams) => {
        setSearchParams(params);
    };

    // Handle close profile/documents panel
    const handleClosePanel = () => {
        setSelectedEmployee(null);
        setShowDocuments(false);
    };

    // Toggle add employee panel
    const toggleAddPanel = () => {
        setIsAddPanelOpen(!isAddPanelOpen);
    };

    return (
        <>
            <PageMeta
                title="Gestion RH | Petroleum Management System"
                description="Human Resources Management for Petroleum Operations"
            />

            <div className="flex flex-col h-full">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-semibold text-black dark:text-white">Gestion RH</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Gérez les employés, les contrats et les documents RH
                        </p>
                    </div>

                    {/* Add Employee Button */}
                    <button
                        onClick={toggleAddPanel}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                    >
                        <UserPlusIcon className="h-5 w-5" />
                        <span>Ajouter un Employé</span>
                    </button>
                </div>

                {/* Stats Cards Section */}
                <div className="mb-6">
                    <HRStatCards />
                </div>

                {/* Search & Filter Section - Sticky on scroll */}
                <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 py-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                    <HRSearchFilter searchParams={searchParams} onSearchChange={handleSearchChange} />
                </div>

                {/* Main Content Section with side panel layout */}
                <div className="flex flex-col lg:flex-row flex-1 gap-6 relative">
                    {/* Left: Employee Table */}
                    <div
                        ref={tableRef}
                        className={`${selectedEmployee ? 'lg:w-2/3' : 'w-full'} transition-all duration-300 ${selectedEmployee && 'mb-6 lg:mb-0'}`}
                    >
                        <EmployeeTable
                            searchParams={searchParams}
                            onSelectEmployee={handleSelectEmployee}
                            onViewDocuments={handleViewDocuments}
                            selectedEmployeeId={selectedEmployee?._id}
                        />
                    </div>

                    {/* Right: Employee Profile or Documents - with height matching table */}
                    {selectedEmployee && (
                        <div
                            className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 lg:absolute lg:right-0 flex flex-col overflow-hidden"
                            style={{ height: maxTableHeight > 0 ? `${maxTableHeight}px` : 'auto' }}
                        >
                            <div className="flex-1 overflow-y-auto pr-1">
                                {showDocuments ? (
                                    <DocumentFolderView employeeId={selectedEmployee._id!} onClose={handleClosePanel} maxTableHeight={maxTableHeight} />
                                ) : (
                                    <EmployeeProfile employee={selectedEmployee} onClose={handleClosePanel} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Employee Panel */}
            <AddEmployeePanel
                isOpen={isAddPanelOpen}
                onClose={() => setIsAddPanelOpen(false)}
            />
        </>
    );
} 