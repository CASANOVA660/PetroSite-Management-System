import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import {
    fetchAttendance,
    recordAttendance,
    updateAttendance,
    EmployeeAttendance
} from '../../store/slices/operationSlice';
import { RootState, AppDispatch } from '../../store';

// Define status types
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// Form data interface
interface AttendanceFormData {
    employeeId: string;
    date: string;
    timeIn: string;
    timeOut: string;
    status: AttendanceStatus;
    notes: string;
}

// Type for employee object from API
interface EmployeeRecord {
    _id: string;
    name: string;
    role?: string;
}

// Component props
interface NewAttendanceViewProps {
    employees: Array<EmployeeRecord>;
    projectId?: string;
}

const NewAttendanceView: React.FC<NewAttendanceViewProps> = ({ employees, projectId: propProjectId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { projectId: urlProjectId } = useParams<{ projectId: string }>();
    const projectId = propProjectId || urlProjectId;
    const { data: records, loading, error } = useSelector((state: RootState) => state.operation.attendance);

    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editMode, setEditMode] = useState<'timeIn' | 'timeOut' | null>(null);

    // Form data
    const [formData, setFormData] = useState<AttendanceFormData>({
        employeeId: '',
        date: selectedDate,
        timeIn: '',
        timeOut: '',
        status: 'present',
        notes: ''
    });

    // Fetch attendance records on component mount and when date changes
    useEffect(() => {
        if (projectId) {
            dispatch(fetchAttendance({ projectId, date: selectedDate }));
        }
    }, [dispatch, projectId, selectedDate]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    const handleCloseDialog = () => {
        setOpenEditDialog(false);
        setEditMode(null);
        setSelectedEmployee(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'status') {
                return {
                    ...prev,
                    [name]: value as AttendanceStatus
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const openPointageModal = (employeeId: string, mode: 'timeIn' | 'timeOut') => {
        const employee = employees.find(emp => emp._id === employeeId);
        if (!employee) return;

        // Type guard to ensure employeeId can be safely accessed
        const getEmployeeId = (record: EmployeeAttendance) => {
            if (typeof record.employeeId === 'object' && record.employeeId !== null) {
                return (record.employeeId as any)._id;
            }
            return record.employeeId as string;
        };

        const existingRecord = records.find(
            record => getEmployeeId(record) === employeeId &&
                record.date === selectedDate
        );

        // Get current time in HH:MM format
        const currentTime = format(new Date(), 'HH:mm');

        setSelectedEmployee(employeeId);
        setEditMode(mode);
        setFormData({
            employeeId,
            date: selectedDate,
            timeIn: mode === 'timeIn' ? currentTime : (existingRecord?.timeIn || ''),
            timeOut: mode === 'timeOut' ? currentTime : (existingRecord?.timeOut || ''),
            status: (existingRecord?.status as AttendanceStatus) || 'present',
            notes: existingRecord?.notes || ''
        });
        setOpenEditDialog(true);
    };

    const directClockInOut = (employeeId: string, mode: 'timeIn' | 'timeOut') => {
        const employee = employees.find(emp => emp._id === employeeId);
        if (!employee || !projectId) return;

        // Get current time
        const currentTime = format(new Date(), 'HH:mm');

        // Type guard to ensure employeeId can be safely accessed
        const getEmployeeId = (record: EmployeeAttendance) => {
            if (typeof record.employeeId === 'object' && record.employeeId !== null) {
                return (record.employeeId as any)._id;
            }
            return record.employeeId as string;
        };

        // Find existing record
        const existingRecord = records.find(
            record => getEmployeeId(record) === employeeId &&
                record.date === selectedDate
        );

        if (mode === 'timeIn') {
            if (existingRecord) {
                // Update existing record with time in
                dispatch(updateAttendance({
                    attendanceId: existingRecord._id,
                    attendanceData: {
                        ...existingRecord,
                        timeIn: currentTime,
                        status: 'present'
                    }
                }))
                    .unwrap()
                    .then(() => {
                        toast.success(`${employee.name} clocked in at ${currentTime}`);
                        dispatch(fetchAttendance({ projectId, date: selectedDate }));
                    })
                    .catch(error => {
                        toast.error(`Error clocking in: ${error.message}`);
                    });
            } else {
                // Create new record with time in
                dispatch(recordAttendance({
                    projectId,
                    attendanceData: {
                        employeeId,
                        date: selectedDate,
                        timeIn: currentTime,
                        timeOut: '',
                        status: 'present',
                        notes: ''
                    }
                }))
                    .unwrap()
                    .then(() => {
                        toast.success(`${employee.name} clocked in at ${currentTime}`);
                        dispatch(fetchAttendance({ projectId, date: selectedDate }));
                    })
                    .catch(error => {
                        toast.error(`Error clocking in: ${error.message}`);
                    });
            }
        } else if (mode === 'timeOut') {
            // For clock out, we open the modal to allow adding notes
            openPointageModal(employeeId, 'timeOut');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.employeeId || !formData.date) {
            toast.error('Employee and date are required');
            return;
        }

        if (!projectId) {
            toast.error('Project ID is missing');
            return;
        }

        // Update the time in or time out based on edit mode
        const updatedData = { ...formData };
        if (editMode === 'timeIn') {
            updatedData.timeIn = formData.timeIn || format(new Date(), 'HH:mm');
            if (!updatedData.timeIn) {
                toast.error('Please enter a valid time');
                return;
            }
        } else if (editMode === 'timeOut') {
            updatedData.timeOut = formData.timeOut || format(new Date(), 'HH:mm');
            if (!updatedData.timeOut) {
                toast.error('Please enter a valid time');
                return;
            }
        }

        // Type guard to ensure employeeId can be safely accessed
        const getEmployeeId = (record: EmployeeAttendance) => {
            if (typeof record.employeeId === 'object' && record.employeeId !== null) {
                return (record.employeeId as any)._id;
            }
            return record.employeeId as string;
        };

        // Find if there's an existing record for this employee on this date
        const existingRecord = records.find(
            record => getEmployeeId(record) === formData.employeeId &&
                record.date === selectedDate
        );

        if (existingRecord) {
            // Update existing record
            dispatch(updateAttendance({
                attendanceId: existingRecord._id,
                attendanceData: updatedData
            }))
                .unwrap()
                .then(() => {
                    toast.success('Attendance record updated successfully');
                    handleCloseDialog();
                    // Refresh data
                    dispatch(fetchAttendance({ projectId, date: selectedDate }));
                })
                .catch(error => {
                    toast.error(`Error updating record: ${error.message}`);
                });
        } else {
            // Create new record
            dispatch(recordAttendance({
                projectId,
                attendanceData: updatedData
            }))
                .unwrap()
                .then(() => {
                    toast.success('Attendance record created successfully');
                    handleCloseDialog();
                    // Refresh data
                    dispatch(fetchAttendance({ projectId, date: selectedDate }));
                })
                .catch(error => {
                    toast.error(`Error creating record: ${error.message}`);
                });
        }
    };

    const getStatusColor = (record: EmployeeAttendance | undefined) => {
        if (!record) return '';

        switch (record.status) {
            case 'present':
                return 'border-l-4 border-l-green-500';
            case 'late':
                return 'border-l-4 border-l-amber-500';
            case 'absent':
                return 'border-l-4 border-l-red-500';
            case 'excused':
                return 'border-l-4 border-l-blue-500';
            default:
                return '';
        }
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;

        switch (status) {
            case 'present':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="h-2 w-2 mr-1 rounded-full bg-green-500"></span>
                        Présent
                    </span>
                );
            case 'late':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <span className="h-2 w-2 mr-1 rounded-full bg-amber-500"></span>
                        En retard
                    </span>
                );
            case 'absent':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="h-2 w-2 mr-1 rounded-full bg-red-500"></span>
                        Absent
                    </span>
                );
            case 'excused':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <span className="h-2 w-2 mr-1 rounded-full bg-blue-500"></span>
                        Excusé
                    </span>
                );
            default:
                return null;
        }
    };

    const calculateTotalHours = (timeIn?: string, timeOut?: string) => {
        if (!timeIn || !timeOut) return '0h';

        const [inHours, inMinutes] = timeIn.split(':').map(Number);
        const [outHours, outMinutes] = timeOut.split(':').map(Number);

        const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
        if (totalMinutes <= 0) return '0h';

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours}.${minutes < 10 ? '0' + minutes : minutes}h`;
    };

    const renderPointageModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                        {editMode === 'timeIn' ? 'Pointage Entrée' : 'Pointage Sortie'}
                    </h3>
                    <button
                        onClick={handleCloseDialog}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employé</label>
                        <select
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                            disabled
                        >
                            <option value="">Sélectionner un employé</option>
                            {employees.map(employee => (
                                <option key={employee._id} value={employee._id}>
                                    {employee.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                            disabled
                        />
                    </div>

                    {editMode === 'timeIn' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Heure d'entrée</label>
                            <input
                                type="time"
                                name="timeIn"
                                value={formData.timeIn}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                    )}

                    {editMode === 'timeOut' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de sortie</label>
                            <input
                                type="time"
                                name="timeOut"
                                value={formData.timeOut}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="present">Présent</option>
                            <option value="absent">Absent</option>
                            <option value="late">En retard</option>
                            <option value="excused">Excusé</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            rows={3}
                            placeholder={editMode === 'timeOut' ? "Raison du retard, informations supplémentaires..." : ""}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCloseDialog}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Pointage des Employés</h2>
                    <div className="flex space-x-4">
                        <div className="flex items-center">
                            <span className="text-gray-500 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button
                            onClick={() => { }}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center transition-colors duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exporter
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
                    <p className="text-gray-600">Chargement des présences...</p>
                </div>
            ) : employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p>Aucun employé trouvé pour ce projet</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure d'entrée</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure de sortie</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heures totales</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employees.map(employee => {
                                // Type guard to ensure employeeId can be safely accessed
                                const getEmployeeId = (record: EmployeeAttendance) => {
                                    if (typeof record.employeeId === 'object' && record.employeeId !== null) {
                                        return (record.employeeId as any)._id;
                                    }
                                    return record.employeeId as string;
                                };

                                const record = records.find(r => getEmployeeId(r) === employee._id && r.date === selectedDate);
                                const statusColorClass = getStatusColor(record);

                                return (
                                    <tr key={employee._id} className={`${statusColorClass} hover:bg-gray-50 transition-colors duration-150`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                                    {employee.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">{employee.name}</div>
                                                    <div className="text-sm text-gray-500">{employee.role || 'Employé'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {record?.timeIn ? (
                                                <span className="inline-flex items-center text-sm text-gray-700">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    {record.timeIn}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record?.timeOut ? (
                                                <span className="inline-flex items-center text-sm text-gray-700">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    {record.timeOut}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record?.timeIn && record?.timeOut ? (
                                                <span className="font-medium">{calculateTotalHours(record?.timeIn, record?.timeOut)}</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(record?.status)}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate">
                                            {record?.notes || (record?.status === 'late' ? '30 minutes late - traffic' : '-')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                {!record?.timeIn && (
                                                    <button
                                                        onClick={() => directClockInOut(employee._id, 'timeIn')}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                        </svg>
                                                        Entrée
                                                    </button>
                                                )}
                                                {record?.timeIn && !record?.timeOut && (
                                                    <button
                                                        onClick={() => directClockInOut(employee._id, 'timeOut')}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        Sortie
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        const mode = record?.timeIn ? (record?.timeOut ? 'timeOut' : 'timeOut') : 'timeIn';
                                                        openPointageModal(employee._id, mode);
                                                    }}
                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Modifier
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pointage Modal */}
            {openEditDialog && renderPointageModal()}
        </div>
    );
};

export default NewAttendanceView; 