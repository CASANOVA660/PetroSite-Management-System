import React from 'react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GanttTask {
    id: string;
    task: string;
    startDate: string;
    endDate: string;
    progress: number;
    color: string;
}

interface GanttChartProps {
    tasks: GanttTask[];
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
    // Get all unique dates from tasks
    const allDates = tasks.reduce((dates: Date[], task) => {
        const taskDates = eachDayOfInterval({
            start: parseISO(task.startDate),
            end: parseISO(task.endDate)
        });
        return [...dates, ...taskDates];
    }, []);

    // Remove duplicates and sort
    const uniqueDates = Array.from(new Set(allDates.map(d => d.getTime())))
        .map(t => new Date(t))
        .sort((a, b) => a.getTime() - b.getTime());

    const totalDays = uniqueDates.length;
    const firstDate = uniqueDates[0];

    const getTaskPosition = (date: string) => {
        const taskDate = parseISO(date);
        const dayIndex = uniqueDates.findIndex(d =>
            d.getFullYear() === taskDate.getFullYear() &&
            d.getMonth() === taskDate.getMonth() &&
            d.getDate() === taskDate.getDate()
        );
        return (dayIndex / totalDays) * 100;
    };

    const getTaskWidth = (startDate: string, endDate: string) => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const startIndex = uniqueDates.findIndex(d =>
            d.getFullYear() === start.getFullYear() &&
            d.getMonth() === start.getMonth() &&
            d.getDate() === start.getDate()
        );
        const endIndex = uniqueDates.findIndex(d =>
            d.getFullYear() === end.getFullYear() &&
            d.getMonth() === end.getMonth() &&
            d.getDate() === end.getDate()
        );
        return ((endIndex - startIndex + 1) / totalDays) * 100;
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[800px] relative">
                {/* Header with dates */}
                <div className="flex mb-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div className="w-1/4 p-2 font-semibold text-gray-700 dark:text-gray-300">
                        Task / Process
                    </div>
                    <div className="w-3/4 flex">
                        {uniqueDates.map((date, index) => (
                            <div
                                key={index}
                                className="flex-1 p-2 text-sm text-gray-600 dark:text-gray-400 text-center border-l dark:border-gray-700"
                            >
                                <div className="font-medium">
                                    {format(date, 'EEE', { locale: fr })}
                                </div>
                                <div>
                                    {format(date, 'd', { locale: fr })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tasks */}
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="flex items-center group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                            <div className="w-1/4 p-2 text-sm text-gray-700 dark:text-gray-300">
                                {task.task}
                            </div>
                            <div className="w-3/4 relative h-8">
                                {/* Background bar */}
                                <div
                                    className="absolute h-3 rounded-full transition-all duration-300 opacity-20 group-hover:opacity-30"
                                    style={{
                                        left: `${getTaskPosition(task.startDate)}%`,
                                        width: `${getTaskWidth(task.startDate, task.endDate)}%`,
                                        backgroundColor: task.color
                                    }}
                                />
                                {/* Progress bar */}
                                <div
                                    className="absolute h-3 rounded-full transition-all duration-300"
                                    style={{
                                        left: `${getTaskPosition(task.startDate)}%`,
                                        width: `${getTaskWidth(task.startDate, task.endDate) * (task.progress / 100)}%`,
                                        backgroundColor: task.color
                                    }}
                                />
                                {/* Progress label */}
                                <span
                                    className="absolute -top-5 text-xs font-medium transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                                    style={{
                                        left: `${getTaskPosition(task.startDate) + (getTaskWidth(task.startDate, task.endDate) / 2)}%`,
                                        transform: 'translateX(-50%)',
                                        color: task.color
                                    }}
                                >
                                    {task.progress}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GanttChart; 