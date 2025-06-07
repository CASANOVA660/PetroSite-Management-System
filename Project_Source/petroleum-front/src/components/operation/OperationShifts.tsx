import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
    CalendarIcon,
    ClockIcon,
    UserGroupIcon,
    PlusIcon,
    MoonIcon,
    SunIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    UserCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { fetchShifts, updateShift, createShift, Shift, OperationEmployee, fetchProjectEmployees } from '../../store/slices/operationSlice';

interface OperationShiftsProps {
    projectId: string;
    initialShifts?: Shift[];
}

const OperationShifts: React.FC<OperationShiftsProps> = ({ projectId, initialShifts = [] }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { data: shiftsData, loading } = useSelector((state: RootState) => state.operation.shifts);
    const { data: employeesData, loading: loadingEmployees } = useSelector((state: RootState) => state.operation.employees);

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
    const [selectedShiftType, setSelectedShiftType] = useState<'all' | 'day' | 'night'>('all');
    const [showAddShiftModal, setShowAddShiftModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newShift, setNewShift] = useState({
        employeeId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'day' as 'day' | 'night',
        startTime: '08:00',
        endTime: '20:00',
        status: 'scheduled' as 'scheduled' | 'completed' | 'absent'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [openDropdownDay, setOpenDropdownDay] = useState<string | null>(null);
    const [loadingCells, setLoadingCells] = useState<Record<string, boolean>>({});

    // Add this useMemo before the useEffect to memoize the processed shifts
    const processedShifts = useMemo(() => {
        if (!shiftsData || !shiftsData.length || !employeesData || !employeesData.length) {
            return [];
        }

        // Process the shifts data to ensure consistent format
        return shiftsData.map(shift => {
            // Ensure date is properly formatted
            let formattedDate = shift.date;
            if (typeof shift.date === 'string') {
                try {
                    formattedDate = format(new Date(shift.date), 'yyyy-MM-dd');
                } catch (e) {
                    // Keep original if parsing fails
                    formattedDate = shift.date;
                }
            }

            // Find the employee for this shift
            const employee = employeesData.find(emp => {
                // Handle different formats of employeeId
                if (typeof shift.employeeId === 'string') {
                    return emp._id === shift.employeeId;
                } else if (shift.employeeId && typeof shift.employeeId === 'object' && '_id' in shift.employeeId) {
                    return emp._id === (shift.employeeId as any)._id;
                }
                return false;
            });

            // Return the processed shift
            return {
                ...shift,
                date: formattedDate,
                employee: employee || undefined
            };
        });
    }, [shiftsData, employeesData]);

    // Create a memoized default shift state
    const defaultShiftState = useMemo(() => ({
        employeeId: employeesData.length > 0 ? employeesData[0]._id : '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'day' as 'day' | 'night',
        startTime: '08:00',
        endTime: '20:00',
        status: 'scheduled' as 'scheduled' | 'completed' | 'absent'
    }), [employeesData]);

    useEffect(() => {
        if (projectId) {
            dispatch(fetchShifts(projectId));
            dispatch(fetchProjectEmployees(projectId));
        }
    }, [projectId, dispatch]);

    useEffect(() => {
        if (initialShifts && initialShifts.length > 0) {
            setShifts(initialShifts);
        } else if (shiftsData && shiftsData.length > 0) {
            setShifts(processedShifts);
        }
    }, [initialShifts, shiftsData, processedShifts]);

    // Navigate to previous week
    const goToPreviousWeek = () => {
        setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    };

    // Navigate to next week
    const goToNextWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    };

    // Generate array of dates for the current week view
    const getDaysInView = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(currentWeekStart, i));
        }
        return days;
    };

    // Format date as day of week and date
    const formatDayLabel = (date: Date) => {
        return format(date, 'EEE dd', { locale: fr });
    };

    // Create a memoized function for getting shifts by day and employee
    const getShiftsForDayAndEmployee = useMemo(() => {
        return (day: Date, employeeId: string): Shift[] => {
            // Format the day for comparison
            const formattedDay = format(day, 'yyyy-MM-dd');

            // Filter shifts by employee ID and date
        return shifts.filter(shift => {
                // Handle different formats of shift date
                let shiftDate: string;
                if (typeof shift.date === 'string') {
                    try {
                        // Try to format the date if it's a valid date string
                        shiftDate = format(new Date(shift.date), 'yyyy-MM-dd');
                    } catch (e) {
                        // If parsing fails, use the string directly
                        shiftDate = shift.date;
                    }
                } else {
                    // Fallback for invalid date formats
                    return false;
                }

                // Handle different formats of employee ID
                let shiftEmployeeId: string;
                if (typeof shift.employeeId === 'string') {
                    shiftEmployeeId = shift.employeeId;
                } else if (shift.employeeId && typeof shift.employeeId === 'object' && '_id' in shift.employeeId) {
                    shiftEmployeeId = (shift.employeeId as any)._id;
                } else {
                    return false;
                }

                // Compare dates and employee IDs
                return shiftDate === formattedDay && shiftEmployeeId === employeeId;
        });
    };
    }, [shifts]);

    // Handle marking a shift as completed
    const handleMarkShiftCompleted = (shiftId: string) => {
        const shift = shifts.find(s => s._id === shiftId);

        if (shift) {
            dispatch(updateShift({
                shiftId,
                shiftData: { status: 'completed' }
            }))
                .unwrap()
                .then(() => {
        toast.success('Quart marqué comme terminé');
                })
                .catch((error) => {
                    toast.error(`Erreur: ${error}`);
                });
        }
    };

    // Get the appropriate style for a shift cell based on shift type and status
    const getShiftCellStyle = (shift: Shift) => {
        if (shift.status === 'completed') {
            return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700';
        }
        if (shift.status === 'absent') {
            return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700';
        }
        if (shift.type === 'day') {
            return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30';
        }
        return 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30';
    };

    // Get icon for shift type
    const getShiftTypeIcon = (type: 'day' | 'night') => {
        return type === 'day'
            ? <SunIcon className="h-4 w-4 text-amber-500" />
            : <MoonIcon className="h-4 w-4 text-indigo-500" />;
    };

    // Update the handleAddShift function to use functional state updates
    const handleAddShift = async () => {
        if (!newShift.employeeId || !newShift.date) {
            toast.error("Veuillez sélectionner un employé et une date");
            return;
        }

        try {
            setIsLoading(true);

            // Format the date for consistency
            const formattedDate = format(new Date(newShift.date), 'yyyy-MM-dd');

            // Create the shift data
            const shiftData = {
                ...newShift,
                date: formattedDate,
                projectId: projectId
            };

            // Create a temporary shift to add to the state immediately
            const tempShift = {
                ...shiftData,
                _id: `temp-${Date.now()}`,
                employee: employeesData.find(emp => emp._id === newShift.employeeId),
                isTemp: true
            };

            // Add the temporary shift to the state using functional update
            setShifts(prevShifts => [...prevShifts, tempShift]);

            // Dispatch the createShift action
            const resultAction = await dispatch(createShift({
                projectId,
                shiftData
            }));

            if (createShift.fulfilled.match(resultAction)) {
                // Replace the temporary shift with the real one using functional update
                const newShiftData = resultAction.payload;
                setShifts(prevShifts =>
                    prevShifts
                        .filter(shift => shift._id !== tempShift._id)
                        .concat({
                            ...newShiftData,
                            employee: employeesData.find(emp => emp._id === newShift.employeeId)
                        })
                );

                toast.success("Quart ajouté avec succès");
                setShowAddShiftModal(false);

                // Reset the form using functional update
                setNewShift(defaultShiftState);
            } else {
                // Remove the temporary shift if the API call failed using functional update
                setShifts(prevShifts => prevShifts.filter(shift => shift._id !== tempShift._id));
                toast.error("Erreur lors de l'ajout du quart");
            }
        } catch (error) {
            toast.error("Erreur lors de l'ajout du quart");
        } finally {
            setIsLoading(false);
        }
    };

    // Update the handleQuickAdd function to use functional state updates
    const handleQuickAdd = async (employeeId: string, day: Date, type: 'day' | 'night') => {
        const cellKey = `${employeeId}-${format(day, 'yyyy-MM-dd')}`;
        try {
            // Set this specific cell as loading using functional update
            setLoadingCells(prev => ({ ...prev, [cellKey]: true }));

            // Format the date for consistency
            const formattedDate = format(day, 'yyyy-MM-dd');

            // Create the shift data
            const shiftData = {
                projectId,
                employeeId,
                date: formattedDate,
                type,
                startTime: type === 'day' ? '08:00' : '20:00',
                endTime: type === 'day' ? '20:00' : '08:00',
                status: 'scheduled' as const
            };

            // Find the employee details for the created shift
            const employee = employeesData.find(emp => emp._id === employeeId);

            // Create a temporary shift to add to the state immediately
            const tempShift = {
                _id: `temp-${Date.now()}`,
                ...shiftData,
                employee,
                isTemp: true
            };

            // Add the temporary shift to the state using functional update
            setShifts(prevShifts => [...prevShifts, tempShift]);

            // Dispatch the createShift action
            const resultAction = await dispatch(createShift({
                projectId,
                shiftData
            }));

            if (createShift.fulfilled.match(resultAction)) {
                // Replace the temporary shift with the real one using functional update
                const newShiftData = resultAction.payload;
                setShifts(prevShifts =>
                    prevShifts
                        .filter(shift => shift._id !== tempShift._id)
                        .concat({
                            ...newShiftData,
                            employee
                        })
                );

                toast.success("Quart ajouté avec succès");
            } else {
                // Remove the temporary shift if the API call failed using functional update
                setShifts(prevShifts => prevShifts.filter(shift => shift._id !== tempShift._id));
                toast.error("Erreur lors de l'ajout du quart");
            }
        } catch (error) {
            toast.error("Erreur lors de l'ajout du quart");
        } finally {
            // Clear the loading state for this cell using functional update
            setLoadingCells(prev => ({ ...prev, [cellKey]: false }));
        }
    };

    // Update the handleShiftTypeChange function to accept both change and mouse events
    const handleShiftTypeChange = (type: string, event?: React.MouseEvent | React.ChangeEvent) => {
        // Prevent event from propagating up to parent elements
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (type === 'day') {
            setNewShift(prev => ({
                ...prev,
                type: 'day',
                startTime: '08:00',
                endTime: '20:00'
            }));
        } else {
            setNewShift(prev => ({
                ...prev,
                type: 'night',
                startTime: '20:00',
                endTime: '08:00'
            }));
        }
    };

    // Update the click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdownDay && !(event.target as Element).closest('.shift-dropdown-container')) {
                setOpenDropdownDay(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDropdownDay]);

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <CalendarIcon className="h-7 w-7 mr-2 text-[#F28C38]" />
                    Planification des quarts
                </h2>
                <button
                    onClick={() => {
                        // Reset the form when opening the modal
                        setNewShift(defaultShiftState);
                        setSelectedDate(new Date());
                        setShowAddShiftModal(true);
                    }}
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-sm flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Ajouter un quart
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Employé:</span>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F28C38] focus:border-[#F28C38] p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">Tous</option>
                            {employeesData.map((emp: OperationEmployee) => (
                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Quart:</span>
                        <select
                            value={selectedShiftType}
                            onChange={(e) => setSelectedShiftType(e.target.value as 'all' | 'day' | 'night')}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F28C38] focus:border-[#F28C38] p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">Tous</option>
                            <option value="day">Jour</option>
                            <option value="night">Nuit</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={goToPreviousWeek}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {format(currentWeekStart, 'dd MMM', { locale: fr })} - {format(addDays(currentWeekStart, 6), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <button
                        onClick={goToNextWeek}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {loading || loadingEmployees ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C38]"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Week view header */}
                        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <div className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">
                                Employé
                            </div>
                            {getDaysInView().map((day, index) => (
                                <div
                                    key={index}
                                    className="py-3 px-4 text-center font-medium text-gray-500 dark:text-gray-400"
                                >
                                    {formatDayLabel(day)}
                                </div>
                            ))}
                        </div>

                        {/* Employee rows */}
                        {employeesData.length === 0 ? (
                            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                Aucun employé trouvé. Veuillez ajouter des employés au projet.
                            </div>
                        ) : (
                            employeesData
                                .filter((emp: OperationEmployee) => selectedEmployee === 'all' || emp._id === selectedEmployee)
                                .map((employee: OperationEmployee) => (
                                <div
                                    key={employee._id}
                                    className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <div className="py-3 px-4 flex items-center">
                                        <div className="flex-shrink-0 mr-3">
                                            {employee.photo ? (
                                                <img
                                                    src={employee.photo}
                                                    alt={employee.name}
                                                    className="h-8 w-8 rounded-full"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {employee.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {employee.role}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Days cells */}
                                    {getDaysInView().map((day, dayIndex) => {
                                        const shiftsForDay = getShiftsForDayAndEmployee(day, employee._id);

                                        return (
                                            <div
                                                key={dayIndex}
                                                className="py-2 px-2 border-l border-gray-200 dark:border-gray-700 relative"
                                            >
                                                {shiftsForDay.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {shiftsForDay.map(shift => (
                                                            <motion.div
                                                                key={shift._id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className={`p-2 rounded border ${getShiftCellStyle(shift)} text-xs`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div className="flex items-center">
                                                                        {getShiftTypeIcon(shift.type)}
                                                                        <span className="ml-1 font-medium">
                                                                            {shift.type === 'day' ? 'Jour' : 'Nuit'}
                                                                        </span>
                                                                    </div>
                                                                    {shift.status === 'completed' && (
                                                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                                    )}
                                                                </div>
                                                                <div className="text-gray-600 dark:text-gray-300">
                                                                    {shift.startTime} - {shift.endTime}
                                                                </div>
                                                                {shift.status === 'scheduled' && (
                                                                    <button
                                                                        onClick={() => handleMarkShiftCompleted(shift._id)}
                                                                        className="mt-1 text-blue-600 dark:text-blue-400 hover:underline text-xs w-full text-left"
                                                                    >
                                                                        Marquer terminé
                                                                    </button>
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                        <div className="group relative w-full h-full min-h-[60px] shift-dropdown-container">
                                                    <button
                                                                onClick={(event) => {
                                                                    const dayKey = `${employee._id}-${format(day, 'yyyy-MM-dd')}`;
                                                                    setOpenDropdownDay(prev => prev === dayKey ? null : dayKey);
                                                                }}
                                                                className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-[#F28C38] dark:text-gray-600 dark:hover:text-[#F28C38]"
                                                                disabled={loadingCells[`${employee._id}-${format(day, 'yyyy-MM-dd')}`]}
                                                            >
                                                                {loadingCells[`${employee._id}-${format(day, 'yyyy-MM-dd')}`] ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <svg className="animate-spin h-5 w-5 text-[#F28C38]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        <span className="text-xs mt-1">Ajout...</span>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className="flex items-center">
                                                        <PlusIcon className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="flex items-center mt-1 space-x-1">
                                                                            <SunIcon className="h-3 w-3 text-amber-400 opacity-50 group-hover:opacity-100" />
                                                                            <span className="text-xs opacity-50 group-hover:opacity-100">/</span>
                                                                            <MoonIcon className="h-3 w-3 text-indigo-400 opacity-50 group-hover:opacity-100" />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </button>
                                                            <div
                                                                className={`absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg z-[1000] w-full border border-gray-200 dark:border-gray-700 ${openDropdownDay === `${employee._id}-${format(day, 'yyyy-MM-dd')}` ? '' : 'hidden'}`}
                                                                style={{ minWidth: '120px' }}
                                                            >
                                                                <button
                                                                    onClick={(event) => {
                                                                        const cellKey = `${employee._id}-${format(day, 'yyyy-MM-dd')}`;
                                                                        handleQuickAdd(employee._id, day, 'day');
                                                                        setOpenDropdownDay(null);
                                                                    }}
                                                                    disabled={loadingCells[`${employee._id}-${format(day, 'yyyy-MM-dd')}`]}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {loadingCells[`${employee._id}-${format(day, 'yyyy-MM-dd')}`] ? (
                                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                    ) : (
                                                                        <SunIcon className="h-4 w-4 text-amber-500 mr-2" />
                                                                    )}
                                                                    Jour
                                                                </button>
                                                                <button
                                                                    onClick={(event) => {
                                                                        const cellKey = `${employee._id}-${format(day, 'yyyy-MM-dd')}`;
                                                                        handleQuickAdd(employee._id, day, 'night');
                                                                        setOpenDropdownDay(null);
                                                                    }}
                                                                    disabled={loadingCells[`${employee._id}-${format(day, 'yyyy-MM-dd')}`]}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {loadingCells[`${employee._id}-${format(day, 'yyyy-MM-dd')}`] ? (
                                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                    ) : (
                                                                        <MoonIcon className="h-4 w-4 text-indigo-500 mr-2" />
                                                                    )}
                                                                    Nuit
                                                    </button>
                                                            </div>
                                                        </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                ))
                        )}
                    </div>

                    {employeesData.filter((emp: OperationEmployee) => selectedEmployee === 'all' || emp._id === selectedEmployee).length === 0 && employeesData.length > 0 && (
                        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                            Aucun employé trouvé avec les filtres actuels
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quart de jour (08:00-20:00)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quart de nuit (20:00-08:00)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quart terminé</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Absence</span>
                </div>
            </div>

            {/* Add Shift Modal */}
            {showAddShiftModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed', zIndex: 99999 }}>
                    <div className="absolute inset-0" onClick={() => {
                        setShowAddShiftModal(false);
                        // Reset form when closing using memoized default state
                        setNewShift(defaultShiftState);
                    }}></div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ajouter un quart</h3>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAddShiftModal(false);
                                    // Reset form when closing
                                    setNewShift(defaultShiftState);
                                }}
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="employeeSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Employé *
                                    </label>
                                    <select
                                        id="employeeSelect"
                                        value={newShift.employeeId}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            setNewShift(prev => ({ ...prev, employeeId: e.target.value }));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                        required
                                    >
                                        <option value="">Sélectionner un employé</option>
                                        {employeesData.map((emp: OperationEmployee) => (
                                            <option key={emp._id} value={emp._id}>{emp.name} - {emp.role}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="shiftDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        id="shiftDate"
                                        value={newShift.date}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            setNewShift(prev => ({ ...prev, date: e.target.value }));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                        required
                                    />
                                </div>

                                {/* Shift Type */}
                                <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Type de quart
                                    </label>
                                    <div className="flex space-x-4" onClick={(e) => e.stopPropagation()}>
                                        <label
                                            className={`flex items-center p-3 rounded-lg cursor-pointer border ${newShift.type === 'day' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="radio"
                                                name="shiftType"
                                                value="day"
                                                checked={newShift.type === 'day'}
                                                onChange={(event) => handleShiftTypeChange('day', event)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-4 w-4 text-blue-600"
                                            />
                                            <span className="ml-2 text-sm font-medium">Jour (08:00 - 20:00)</span>
                                        </label>
                                        <label
                                            className={`flex items-center p-3 rounded-lg cursor-pointer border ${newShift.type === 'night' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="radio"
                                                name="shiftType"
                                                value="night"
                                                checked={newShift.type === 'night'}
                                                onChange={(event) => handleShiftTypeChange('night', event)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-4 w-4 text-blue-600"
                                            />
                                            <span className="ml-2 text-sm font-medium">Nuit (20:00 - 08:00)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAddShiftModal(false);
                                        // Reset form when closing
                                        setNewShift(defaultShiftState);
                                    }}
                                    className="px-4 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddShift();
                                    }}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Ajout en cours...
                                        </>
                                    ) : (
                                        <>
                                            <PlusIcon className="h-5 w-5 mr-1" />
                                            Ajouter
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OperationShifts; 