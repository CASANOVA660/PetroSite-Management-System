import React, { useState, useEffect } from 'react';
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
    UserCircleIcon
} from '@heroicons/react/24/outline';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface OperationShiftsProps {
    projectId: string;
    initialShifts?: Shift[];
}

interface Employee {
    _id: string;
    name: string;
    role: string;
    specialization: string;
    photo?: string;
}

interface Shift {
    _id: string;
    employeeId: string;
    employee: Employee;
    date: string;
    type: 'day' | 'night';
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed' | 'absent';
    notes?: string;
}

// Dummy employees data
const dummyEmployees: Employee[] = [
    {
        _id: 'emp1',
        name: 'Ahmed Benali',
        role: 'Opérateur de forage',
        specialization: 'Forage profond',
        photo: ''
    },
    {
        _id: 'emp2',
        name: 'Mohammed Rafi',
        role: 'Technicien de maintenance',
        specialization: 'Équipements hydrauliques'
    },
    {
        _id: 'emp3',
        name: 'Fatima Zahra',
        role: 'Ingénieur HSE',
        specialization: 'Sécurité des opérations'
    },
    {
        _id: 'emp4',
        name: 'Karim Hadj',
        role: 'Technicien de forage',
        specialization: 'Forage directionnel'
    },
    {
        _id: 'emp5',
        name: 'Sara Benmoussa',
        role: 'Géologue',
        specialization: 'Analyse de terrain'
    }
];

// Generate dummy shifts for the next 14 days
const generateDummyShifts = (): Shift[] => {
    const shifts: Shift[] = [];
    const today = new Date();

    // Create day and night shifts for each employee for the next 14 days
    dummyEmployees.forEach((employee, empIndex) => {
        for (let i = 0; i < 14; i++) {
            // Alternate employees between day and night shifts
            // and alternate days (not every employee works every day)
            if ((empIndex + i) % 2 === 0) {
                const shiftDate = addDays(today, i);
                const shiftType = (empIndex + i) % 4 < 2 ? 'day' : 'night';

                shifts.push({
                    _id: `shift-${employee._id}-${i}`,
                    employeeId: employee._id,
                    employee: employee,
                    date: format(shiftDate, 'yyyy-MM-dd'),
                    type: shiftType,
                    startTime: shiftType === 'day' ? '08:00' : '20:00',
                    endTime: shiftType === 'day' ? '20:00' : '08:00',
                    status: i < 2 ? 'completed' : 'scheduled',
                    notes: i < 2 ? 'Shift completed successfully' : undefined
                });
            }
        }
    });

    return shifts;
};

const OperationShifts: React.FC<OperationShiftsProps> = ({ projectId, initialShifts = [] }) => {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
    const [selectedShiftType, setSelectedShiftType] = useState<'all' | 'day' | 'night'>('all');
    const [showAddShiftModal, setShowAddShiftModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        setLoading(true);

        // If initialShifts is provided, use it
        if (initialShifts && initialShifts.length > 0) {
            setShifts(initialShifts);
            // Extract unique employees from shifts
            const uniqueEmployees = Array.from(
                new Map(initialShifts.map(shift => [shift.employee._id, shift.employee])).values()
            );
            setEmployees(uniqueEmployees);
            setLoading(false);
        } else {
            // Simulate API fetch with setTimeout
            setTimeout(() => {
                const dummyShifts = generateDummyShifts();
                setShifts(dummyShifts);
                setEmployees(dummyEmployees);
                setLoading(false);
            }, 1000);
        }
    }, [projectId, initialShifts]);

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

    // Filter shifts for the current view
    const getFilteredShifts = () => {
        return shifts.filter(shift => {
            // Filter by date range
            const shiftDate = parseISO(shift.date);
            const weekEnd = addDays(currentWeekStart, 6);
            const isInCurrentWeek = shiftDate >= currentWeekStart && shiftDate <= weekEnd;

            // Filter by employee if selected
            const matchesEmployee = selectedEmployee === 'all' || shift.employeeId === selectedEmployee;

            // Filter by shift type if selected
            const matchesShiftType = selectedShiftType === 'all' || shift.type === selectedShiftType;

            return isInCurrentWeek && matchesEmployee && matchesShiftType;
        });
    };

    // Get shifts for a specific day and employee
    const getShiftsForDayAndEmployee = (day: Date, employeeId: string) => {
        return shifts.filter(shift =>
            isSameDay(parseISO(shift.date), day) &&
            shift.employeeId === employeeId
        );
    };

    // Handle marking a shift as completed
    const handleMarkShiftCompleted = (shiftId: string) => {
        setShifts(prevShifts =>
            prevShifts.map(shift =>
                shift._id === shiftId
                    ? { ...shift, status: 'completed' }
                    : shift
            )
        );
        toast.success('Quart marqué comme terminé');
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

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <CalendarIcon className="h-7 w-7 mr-2 text-[#F28C38]" />
                    Planification des quarts
                </h2>
                <button
                    onClick={() => {
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
                            {employees.map(emp => (
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

            {loading ? (
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
                        {employees
                            .filter(emp => selectedEmployee === 'all' || emp._id === selectedEmployee)
                            .map(employee => (
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
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDate(day);
                                                            setSelectedEmployee(employee._id);
                                                            setShowAddShiftModal(true);
                                                        }}
                                                        className="w-full h-full min-h-[60px] flex items-center justify-center text-gray-400 hover:text-[#F28C38] dark:text-gray-600 dark:hover:text-[#F28C38]"
                                                    >
                                                        <PlusIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                    </div>

                    {employees.filter(emp => selectedEmployee === 'all' || emp._id === selectedEmployee).length === 0 && (
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

            {/* Add Shift Modal would go here */}
        </div>
    );
};

export default OperationShifts; 