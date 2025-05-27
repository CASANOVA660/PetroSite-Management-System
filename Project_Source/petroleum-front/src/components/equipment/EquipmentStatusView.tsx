import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { EquipmentHistoryEntry } from '../../types/equipment';
import HistoryEntryCard from './HistoryEntryCard';
import { CheckCircleIcon, InfoIcon, AlertIcon, TimeIcon } from '../../icons';

interface EquipmentStatusViewProps {
    equipmentId: string;
}

const EquipmentStatusView: React.FC<EquipmentStatusViewProps> = ({ equipmentId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusHistory, setStatusHistory] = useState<EquipmentHistoryEntry[]>([]);
    const [activities, setActivities] = useState<EquipmentHistoryEntry[]>([]);

    // Fetch equipment status history
    useEffect(() => {
        const fetchStatusHistory = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(`/equipment/${equipmentId}/status/history`);

                if (response.data.success) {
                    setStatusHistory(response.data.data);
                } else {
                    setError(response.data.message || 'Erreur lors du chargement de l\'historique de statut');
                }
            } catch (err) {
                console.error('Error fetching status history:', err);
                setError('Erreur lors du chargement de l\'historique de statut');
            } finally {
                setLoading(false);
            }
        };

        fetchStatusHistory();
    }, [equipmentId]);

    // Get current activities 
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await axiosInstance.get(`/equipment/${equipmentId}/history`, {
                    params: { type: 'all' }
                });

                if (response.data.success) {
                    // Filter to get only entries with activityId
                    const activitiesData = response.data.data.filter(
                        (entry: EquipmentHistoryEntry) => entry.activityId && !entry.isStatusChange
                    );
                    setActivities(activitiesData);
                }
            } catch (err) {
                console.error('Error fetching activities:', err);
            }
        };

        fetchActivities();
    }, [equipmentId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                    <AlertIcon className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    // Group activities by status
    const scheduledActivities = activities.filter(a => a.status === 'SCHEDULED');
    const inProgressActivities = activities.filter(a => a.status === 'IN_PROGRESS');
    const completedActivities = activities.filter(a => a.status === 'COMPLETED');

    return (
        <div className="space-y-8">
            {/* Status Summary */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                        <InfoIcon className="w-5 h-5 mr-2 text-blue-500" />
                        État actuel et activités
                    </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Current Status */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">STATUT ACTUEL</h4>
                            <div className="flex items-center">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {statusHistory.length > 0 ? statusHistory[0].toStatus : 'N/A'}
                                </span>
                            </div>
                            {statusHistory.length > 0 && statusHistory[0].reason && (
                                <p className="mt-2 text-sm text-gray-600">{statusHistory[0].reason}</p>
                            )}
                        </div>

                        {/* Active Activities */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">ACTIVITÉS EN COURS</h4>
                            {inProgressActivities.length > 0 ? (
                                <div className="space-y-2">
                                    {inProgressActivities.map(activity => (
                                        <div key={activity._id} className="flex items-center text-sm">
                                            <TimeIcon className="w-4 h-4 mr-2 text-yellow-500" />
                                            <span>{activity.type}: {activity.description}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Aucune activité en cours</p>
                            )}
                        </div>

                        {/* Scheduled Activities */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">ACTIVITÉS PLANIFIÉES</h4>
                            {scheduledActivities.length > 0 ? (
                                <div className="space-y-2">
                                    {scheduledActivities.map(activity => (
                                        <div key={activity._id} className="flex items-center text-sm">
                                            <CheckCircleIcon className="w-4 h-4 mr-2 text-blue-500" />
                                            <span>{activity.type}: {activity.description}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Aucune activité planifiée</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Historique des statuts</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    {statusHistory.length > 0 ? (
                        <div className="ml-6 pl-6 relative">
                            {statusHistory.map((entry, index) => (
                                <HistoryEntryCard
                                    key={entry._id}
                                    entry={entry}
                                    isFirst={index === 0}
                                    isLast={index === statusHistory.length - 1}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Aucun historique de statut disponible</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Completed Activities */}
            {completedActivities.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Activités terminées</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <div className="ml-6 pl-6 relative">
                            {completedActivities.map((entry, index) => (
                                <HistoryEntryCard
                                    key={entry._id}
                                    entry={entry}
                                    isFirst={index === 0}
                                    isLast={index === completedActivities.length - 1}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentStatusView; 