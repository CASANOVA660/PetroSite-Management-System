import React from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Action } from '../../store/slices/actionSlice';

interface TimelineProps {
    actions: Action[];
}

const Timeline: React.FC<TimelineProps> = ({ actions }) => {
    // Sort actions by start date
    const sortedActions = [...actions].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Find the earliest and latest dates
    const earliestDate = sortedActions.length > 0
        ? new Date(sortedActions[0].startDate)
        : new Date();
    const latestDate = sortedActions.length > 0
        ? new Date(sortedActions[sortedActions.length - 1].endDate)
        : addDays(new Date(), 30);

    // Calculate total timeline width
    const totalDays = differenceInDays(latestDate, earliestDate) + 1;
    const today = new Date();

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="relative">
                {/* Timeline header with dates */}
                <div className="flex justify-between mb-4">
                    <span className="text-sm text-gray-500">
                        {format(earliestDate, 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <span className="text-sm text-gray-500">
                        {format(latestDate, 'dd MMM yyyy', { locale: fr })}
                    </span>
                </div>

                {/* Today marker */}
                {today >= earliestDate && today <= latestDate && (
                    <div
                        className="absolute top-0 bottom-0 w-px bg-red-500"
                        style={{
                            left: `${(differenceInDays(today, earliestDate) / totalDays) * 100}%`
                        }}
                    >
                        <div className="absolute -top-6 -translate-x-1/2 text-xs text-red-500">
                            Aujourd'hui
                        </div>
                    </div>
                )}

                {/* Actions timeline */}
                <div className="space-y-6">
                    {sortedActions.map((action) => {
                        const start = new Date(action.startDate);
                        const end = new Date(action.endDate);
                        const startOffset = (differenceInDays(start, earliestDate) / totalDays) * 100;
                        const duration = (differenceInDays(end, start) + 1) / totalDays * 100;

                        return (
                            <div key={action._id} className="relative h-16">
                                {/* Action bar */}
                                <div
                                    className={`absolute h-8 rounded-full ${action.projectId ? 'bg-blue-500' : 'bg-green-500'
                                        }`}
                                    style={{
                                        left: `${startOffset}%`,
                                        width: `${duration}%`,
                                        minWidth: '20px'
                                    }}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs text-white font-medium truncate px-2">
                                            {action.title}
                                        </span>
                                    </div>
                                </div>

                                {/* Action details */}
                                <div className="absolute -bottom-1 left-0 text-xs text-gray-600" style={{ left: `${startOffset}%` }}>
                                    <div className="font-medium">{`${action.responsible.prenom} ${action.responsible.nom}`}</div>
                                    <div>{format(start, 'dd/MM', { locale: fr })}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Timeline; 