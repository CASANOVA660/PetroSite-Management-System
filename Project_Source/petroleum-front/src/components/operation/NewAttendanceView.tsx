import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import {
    fetchAttendance,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    AttendanceRecord
} from '../../store';
import { RootState, AppDispatch } from '../../store';

// Define status types
type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'leave';

// Form data interface
interface AttendanceFormData {
    employeeId: string;
    date: string;
    timeIn: string;
    timeOut: string;
    status: AttendanceStatus;
    notes: string;
}

// Component props
interface NewAttendanceViewProps {
    employees: Array<{
        _id: string;
        name: string;
        role?: string;
    }>;
    projectId?: string;
}

const NewAttendanceView: React.FC<NewAttendanceViewProps> = ({ employees, projectId: propProjectId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { projectId: urlProjectId } = useParams<{ projectId: string }>();
    const projectId = propProjectId || urlProjectId;
    const { records, loading, error } = useSelector((state: RootState) => state.attendance);

    // State for dialogs
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);

    // Form data
    const [formData, setFormData] = useState<AttendanceFormData>({
        employeeId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        timeIn: '',
        timeOut: '',
        status: 'present',
        notes: ''
    });

    // Add console logs to track data
    useEffect(() => {
        console.log('NewAttendanceView mounted with employees:', employees);
        console.log('Current projectId:', projectId);
    }, [employees, projectId]);

    useEffect(() => {
        console.log('Attendance records updated:', records);
        console.log('Attendance loading state:', loading);
        console.log('Attendance error state:', error);
    }, [records, loading, error]);

    // Fetch attendance records on component mount
    useEffect(() => {
        if (projectId) {
            dispatch(fetchAttendance(projectId));
        }
    }, [dispatch, projectId]);

    // Handle opening the add dialog
    const handleOpenAddDialog = () => {
        setFormData({
            employeeId: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            timeIn: '',
            timeOut: '',
            status: 'present',
            notes: ''
        });
        setOpenAddDialog(true);
    };

    // Handle opening the edit dialog
    const handleOpenEditDialog = (attendance: AttendanceRecord) => {
        setSelectedAttendance(attendance);

        const employeeId = typeof attendance.employeeId === 'object'
            ? attendance.employeeId._id
            : attendance.employeeId as string;

        setFormData({
            employeeId,
            date: attendance.date,
            timeIn: attendance.timeIn || '',
            timeOut: attendance.timeOut || '',
            status: attendance.status,
            notes: attendance.notes
        });

        setOpenEditDialog(true);
    };

    // Handle closing dialogs
    const handleCloseDialog = () => {
        setOpenAddDialog(false);
        setOpenEditDialog(false);
        setSelectedAttendance(null);
    };

    // Handle input changes
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

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted with data:', formData);
        console.log('Project ID:', projectId);

        if (!formData.employeeId || !formData.date) {
            toast.error('Employee and date are required');
            return;
        }

        if (projectId) {
            if (openAddDialog) {
                console.log('Dispatching createAttendance with:', { projectId, attendanceData: formData });
                dispatch(createAttendance({
                    projectId,
                    attendanceData: formData
                }));
                toast.success('Attendance record created successfully');
            } else if (openEditDialog && selectedAttendance) {
                console.log('Dispatching updateAttendance with:', { attendanceId: selectedAttendance._id, attendanceData: formData });
                dispatch(updateAttendance({
                    attendanceId: selectedAttendance._id,
                    attendanceData: formData
                }));
                toast.success('Attendance record updated successfully');
            }
        } else {
            console.error('No projectId available for attendance submission');
            toast.error('Project ID is missing');
        }

        handleCloseDialog();
    };

    // Handle deletion
    const handleDelete = (attendanceId: string) => {
        if (projectId && window.confirm('Are you sure you want to delete this attendance record?')) {
            dispatch(deleteAttendance({ projectId, attendanceId }));
            toast.success('Attendance record deleted successfully');
        }
    };

    // Render the form
    const renderAttendanceForm = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                        <option key={employee._id} value={employee._id}>
                            {employee.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Time In</label>
                <input
                    type="time"
                    name="timeIn"
                    value={formData.timeIn}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Time Out</label>
                <input
                    type="time"
                    name="timeOut"
                    value={formData.timeOut}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half Day</option>
                    <option value="leave">Leave</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                />
            </div>

            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={handleCloseDialog}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    {openAddDialog ? 'Add' : 'Update'}
                </button>
            </div>
        </form>
    );

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mt-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Employee Attendance</h2>
                <button
                    onClick={handleOpenAddDialog}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    Add Attendance
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4">Loading attendance records...</div>
            ) : records.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No attendance records found</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {records.map((record: AttendanceRecord) => {
                                const employee = typeof record.employeeId === 'object'
                                    ? record.employeeId
                                    : { name: 'Unknown' };

                                return (
                                    <tr key={record._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{employee.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {format(new Date(record.date), 'dd MMM yyyy', { locale: fr })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{record.timeIn || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{record.timeOut || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                                                record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                                    record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                                        record.status === 'half-day' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenEditDialog(record)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record._id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Attendance Dialog */}
            {openAddDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Add Attendance Record</h3>
                            <button onClick={handleCloseDialog} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {renderAttendanceForm()}
                    </div>
                </div>
            )}

            {/* Edit Attendance Dialog */}
            {openEditDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Edit Attendance Record</h3>
                            <button onClick={handleCloseDialog} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {renderAttendanceForm()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewAttendanceView; 