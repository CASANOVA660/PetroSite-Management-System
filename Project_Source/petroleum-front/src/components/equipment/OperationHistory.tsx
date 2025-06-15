import React, { useState, useEffect } from 'react';
import { EquipmentHistoryEntry } from '../../types/equipment';
import { HistoryFilterPanel, DateFilterType } from './index';
import HistoryEntryCard from './HistoryEntryCard';
import EmptyHistoryState from './EmptyHistoryState';

interface OperationHistoryProps {
    history: EquipmentHistoryEntry[];
    isLoading: boolean;
}

const OperationHistory: React.FC<OperationHistoryProps> = ({ history, isLoading }) => {
    const [filteredHistory, setFilteredHistory] = useState<EquipmentHistoryEntry[]>([]);
    const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter history entries by type "operation" only
    const operationHistory = history.filter(entry => entry.type === 'operation');

    useEffect(() => {
        let filtered = [...operationHistory];

        // Apply date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            let filterStartDate = new Date();

            switch (dateFilter) {
                case 'past-month':
                    filterStartDate.setMonth(now.getMonth() - 1);
                    break;
                case 'past-6-months':
                    filterStartDate.setMonth(now.getMonth() - 6);
                    break;
                case 'past-year':
                    filterStartDate.setFullYear(now.getFullYear() - 1);
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        filtered = filtered.filter(entry => {
                            const entryDate = new Date(entry.fromDate);
                            return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
                        });
                    }
                    break;
            }

            if (dateFilter !== 'custom') {
                filtered = filtered.filter(entry => {
                    const entryDate = new Date(entry.fromDate);
                    return entryDate >= filterStartDate && entryDate <= now;
                });
            }
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(entry =>
                entry.description?.toLowerCase().includes(term) ||
                entry.location?.toLowerCase().includes(term) ||
                entry.responsiblePerson?.name.toLowerCase().includes(term) ||
                entry.reason?.toLowerCase().includes(term) ||
                (entry.fromStatus && entry.fromStatus.toLowerCase().includes(term)) ||
                (entry.toStatus && entry.toStatus.toLowerCase().includes(term))
            );
        }

        // Sort by date (newest first)
        filtered.sort((a, b) =>
            new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()
        );

        setFilteredHistory(filtered);
    }, [operationHistory, dateFilter, startDate, endDate, searchTerm]);

    const handleApplyFilters = () => {
        // The filtering is already handled in the useEffect
    };

    const handleResetFilters = () => {
        setDateFilter('all');
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
    };

    // Helper function to format status for display
    const formatStatus = (status: string | undefined) => {
        if (!status) return '';

        // Convert to lowercase for consistent comparison
        const statusLower = status.toLowerCase();

        const statusMap: { [key: string]: string } = {
            'disponible': 'Disponible',
            'disponible_needs_repair': 'Disponible (nécessite réparation)',
            'on_repair': 'En réparation',
            'disponible_bon_etat': 'Disponible (bon état)',
            'working_non_disponible': 'En opération (non disponible)',
            // Add uppercase status mappings
            'available': 'Disponible',
            'in_use': 'En opération (non disponible)',
            'maintenance': 'En maintenance',
            'repair': 'En réparation',
            'out_of_service': 'Hors service'
        };

        return statusMap[statusLower] || status;
    };

    return (
        <div className="space-y-4">
            <HistoryFilterPanel
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
            />

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredHistory.length > 0 ? (
                <div className="space-y-4">
                    {filteredHistory.map((entry, index) => (
                        <HistoryEntryCard
                            key={entry._id}
                            entry={{
                                ...entry,
                                // Add additional context for status change entries
                                description: entry.isStatusChange
                                    ? `${entry.description || ''} ${entry.reason ? `- ${entry.reason}` : ''} (${formatStatus(entry.fromStatus)} → ${formatStatus(entry.toStatus)})`
                                    : entry.description
                            }}
                            isFirst={index === 0}
                            isLast={index === filteredHistory.length - 1}
                        />
                    ))}
                </div>
            ) : (
                <EmptyHistoryState
                    message="Aucun enregistrement d'opération n'a été trouvé pour cet équipement."
                />
            )}
        </div>
    );
};

export default OperationHistory; 