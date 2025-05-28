import React, { useState, useEffect } from 'react';
import {
    ClockIcon,
    ArrowRightStartOnRectangleIcon,
    ArrowRightEndOnRectangleIcon,
    MagnifyingGlassIcon,
    DocumentChartBarIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/button/Button';
import { motion } from 'framer-motion';

interface EmployeeAttendanceProps {
    projectId: string;
}

interface EmployeeAttendance {
    _id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    timeIn: string;
    timeOut: string | null;
    totalHours: number | null;
    status: 'present' | 'late' | 'absent' | 'leave';
    notes: string;
}

interface Employee {
    _id: string;
    name: string;
    position: string;
    department: string;
    image?: string;
}

const EmployeeAttendance: React.FC<EmployeeAttendanceProps> = ({ projectId }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<EmployeeAttendance[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Mock data for demonstration
    useEffect(() => {
        // This would be replaced with an API call filtered by projectId
        setTimeout(() => {
            const mockEmployees: Employee[] = [
                { _id: 'e1', name: 'Ahmed Benali', position: 'Opérateur de forage', department: 'Forage' },
                { _id: 'e2', name: 'Mohammed Rafi', position: 'Technicien de maintenance', department: 'Maintenance' },
                { _id: 'e3', name: 'Fatima Zahra', position: 'Ingénieur HSE', department: 'HSE' },
                { _id: 'e4', name: 'Karim Hadj', position: 'Technicien de forage', department: 'Forage' },
                { _id: 'e5', name: 'Sara Benmoussa', position: 'Géologue', department: 'Géologie' },
            ];

            const mockAttendance: EmployeeAttendance[] = [
                {
                    _id: 'a1',
                    employeeId: 'e1',
                    employeeName: 'Ahmed Benali',
                    date: selectedDate,
                    timeIn: '08:03',
                    timeOut: '17:00',
                    totalHours: 8.95,
                    status: 'present',
                    notes: ''
                },
                {
                    _id: 'a2',
                    employeeId: 'e2',
                    employeeName: 'Mohammed Rafi',
                    date: selectedDate,
                    timeIn: '08:30',
                    timeOut: '16:45',
                    totalHours: 8.25,
                    status: 'late',
                    notes: '30 minutes late - traffic'
                },
                {
                    _id: 'a3',
                    employeeId: 'e3',
                    employeeName: 'Fatima Zahra',
                    date: selectedDate,
                    timeIn: '07:55',
                    timeOut: null,
                    totalHours: null,
                    status: 'present',
                    notes: ''
                },
                {
                    _id: 'a4',
                    employeeId: 'e4',
                    employeeName: 'Karim Hadj',
                    date: selectedDate,
                    timeIn: '',
                    timeOut: '',
                    totalHours: 0,
                    status: 'absent',
                    notes: 'Without notice'
                },
                {
                    _id: 'a5',
                    employeeId: 'e5',
                    employeeName: 'Sara Benmoussa',
                    date: selectedDate,
                    timeIn: '',
                    timeOut: '',
                    totalHours: 0,
                    status: 'leave',
                    notes: 'Approved vacation'
                },
            ];

            setEmployees(mockEmployees);
            setAttendanceRecords(mockAttendance);
            setLoading(false);
        }, 1000);
    }, [selectedDate, projectId]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
        setLoading(true);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleCheckIn = (employeeId: string) => {
        // In a real app, this would call an API endpoint
        setAttendanceRecords(prev =>
            prev.map(record =>
                record.employeeId === employeeId
                    ? {
                        ...record,
                        timeIn: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        status: 'present'
                    }
                    : record
            )
        );
    };

    const handleCheckOut = (employeeId: string) => {
        // In a real app, this would call an API endpoint
        const timeOut = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        setAttendanceRecords(prev =>
            prev.map(record => {
                if (record.employeeId === employeeId) {
                    // Calculate total hours if check-in exists
                    let totalHours = null;
                    if (record.timeIn) {
                        const [inHours, inMinutes] = record.timeIn.split(':').map(Number);
                        const [outHours, outMinutes] = timeOut.split(':').map(Number);
                        totalHours = (outHours - inHours) + (outMinutes - inMinutes) / 60;
                        totalHours = Math.round(totalHours * 100) / 100; // Round to 2 decimal places
                    }

                    return {
                        ...record,
                        timeOut,
                        totalHours
                    };
                }
                return record;
            })
        );
    };

    const handleManualEdit = (employeeId: string, field: string, value: string) => {
        // For manual time editing - in a real app this would need validation
        setAttendanceRecords(prev =>
            prev.map(record =>
                record.employeeId === employeeId
                    ? { ...record, [field]: value }
                    : record
            )
        );
    };

    const filteredRecords = attendanceRecords.filter(record =>
        record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status badge styling
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-300">Présent</span>;
            case 'late':
                return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">En retard</span>;
            case 'absent':
                return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-300">Absent</span>;
            case 'leave':
                return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">Congé</span>;
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Pointage du Personnel
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Présents aujourd'hui</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ArrowRightStartOnRectangleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En retard</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {attendanceRecords.filter(r => r.status === 'late').length}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absents</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {attendanceRecords.filter(r => r.status === 'absent').length}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <ArrowRightEndOnRectangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En congé</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {attendanceRecords.filter(r => r.status === 'leave').length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <CalendarDaysIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-orange-500 dark:focus:border-orange-500"
                                placeholder="Rechercher un employé..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                <CalendarDaysIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <input
                                type="date"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-orange-500 dark:focus:border-orange-500"
                                value={selectedDate}
                                onChange={handleDateChange}
                            />
                        </div>

                        <Button
                            className="bg-orange-600 hover:bg-orange-700 flex items-center space-x-2"
                            onClick={() => {/* Export function */ }}
                        >
                            <DocumentChartBarIcon className="h-5 w-5" />
                            <span>Exporter</span>
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C38]"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Employé</th>
                                    <th scope="col" className="px-6 py-3">Département</th>
                                    <th scope="col" className="px-6 py-3">Statut</th>
                                    <th scope="col" className="px-6 py-3">Heure d'entrée</th>
                                    <th scope="col" className="px-6 py-3">Heure de sortie</th>
                                    <th scope="col" className="px-6 py-3">Heures totales</th>
                                    <th scope="col" className="px-6 py-3">Notes</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td colSpan={8} className="px-6 py-4 text-center">
                                            Aucun enregistrement trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => {
                                        // Find employee details
                                        const employee = employees.find(e => e._id === record.employeeId);

                                        return (
                                            <tr
                                                key={record._id}
                                                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {record.employeeName}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {employee?.department}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(record.status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {record.timeIn || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {record.timeOut || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {record.totalHours !== null ? `${record.totalHours}h` : '-'}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs truncate">
                                                    {record.notes || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex space-x-2">
                                                        {!record.timeIn && record.status !== 'leave' && (
                                                            <button
                                                                onClick={() => handleCheckIn(record.employeeId)}
                                                                className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-medium rounded-lg hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 transition-colors"
                                                            >
                                                                Pointage Entrée
                                                            </button>
                                                        )}

                                                        {record.timeIn && !record.timeOut && record.status !== 'leave' && (
                                                            <button
                                                                onClick={() => handleCheckOut(record.employeeId)}
                                                                className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                                                            >
                                                                Pointage Sortie
                                                            </button>
                                                        )}

                                                        <button
                                                            className="px-3 py-1.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                                                        >
                                                            Modifier
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default EmployeeAttendance; 