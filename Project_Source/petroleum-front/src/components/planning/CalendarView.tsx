import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlanType, PlanStatus } from '../../store/slices/planningSlice';

interface EquipmentData {
    _id: string;
    nom: string;
    reference: string;
    matricule: string;
    status: string;
}

interface Plan {
    _id: string;
    title: string;
    description?: string;
    type: PlanType;
    equipmentId: EquipmentData;
    responsiblePerson: string;
    location?: string;
    startDate: string;
    endDate: string;
    status: PlanStatus;
    notes?: string;
}

interface CalendarViewProps {
    plans: Plan[];
    onPlanClick: (id: string) => void;
}

// Helper: get color by type
const typeColor = (type: PlanType) => {
    if (type === PlanType.MAINTENANCE) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (type === PlanType.PLACEMENT) return 'bg-orange-100 text-orange-700 border-orange-300';
    if (type === PlanType.REPAIR) return 'bg-red-100 text-red-700 border-red-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
};

// Helper: get color by status
const statusColor = (status: PlanStatus) => {
    if (status === PlanStatus.SCHEDULED) return 'bg-yellow-50 border-yellow-200';
    if (status === PlanStatus.IN_PROGRESS) return 'bg-blue-50 border-blue-200';
    if (status === PlanStatus.COMPLETED) return 'bg-green-50 border-green-200';
    if (status === PlanStatus.CANCELLED) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
};

const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Mock data is now only used if no plans are provided
const mockPlans: Plan[] = [];

function getMonthMatrix(year: number, month: number) {
    // Returns a 2D array of Date objects for the month view
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const matrix: Date[][] = [];
    let week: Date[] = [];
    let day = new Date(firstDay);
    // Fill leading days
    for (let i = 0; i < (firstDay.getDay() + 6) % 7; i++) {
        week.push(new Date(day.getFullYear(), day.getMonth(), day.getDate() - ((firstDay.getDay() + 6) % 7 - i)));
    }
    while (day <= lastDay) {
        week.push(new Date(day));
        if (week.length === 7) {
            matrix.push(week);
            week = [];
        }
        day.setDate(day.getDate() + 1);
    }
    // Fill trailing days
    if (week.length > 0) {
        for (let i = week.length; i < 7; i++) {
            week.push(new Date(day));
            day.setDate(day.getDate() + 1);
        }
        matrix.push(week);
    }
    return matrix;
}

const hours = Array.from({ length: 12 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`); // 08:00 - 19:00

export default function CalendarView({ plans, onPlanClick }: CalendarViewProps) {
    const [viewMode, setViewMode] = useState<'month' | 'year' | 'day'>('month');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // Current month
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Current year
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const plansToShow = plans.length > 0 ? plans : mockPlans;

    // Month matrix for the current month
    const monthMatrix = getMonthMatrix(currentYear, currentMonth);

    // Group plans by day (YYYY-MM-DD)
    const plansByDay: Record<string, Plan[]> = {};
    plansToShow.forEach(plan => {
        // For multi-day events, add to each day they span
        const start = new Date(plan.startDate);
        const end = new Date(plan.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().slice(0, 10);
            if (!plansByDay[key]) plansByDay[key] = [];
            // Only push if not already present (avoid duplicates)
            if (!plansByDay[key].some(p => p._id === plan._id)) {
                plansByDay[key].push(plan);
            }
        }
    });

    // Functions (these functions remain the same as before, just updated references)

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
        setSelectedDay(today);
        setViewMode('day');
    };

    const handleMonthClick = (idx: number) => {
        setCurrentMonth(idx);
        setViewMode('month');
    };

    const goToDay = (date: Date) => {
        setSelectedDay(date);
        setViewMode('day');
    };

    const goToPrevDay = () => {
        if (selectedDay) {
            const prevDay = new Date(selectedDay);
            prevDay.setDate(prevDay.getDate() - 1);
            setSelectedDay(prevDay);
        }
    };

    const goToNextDay = () => {
        if (selectedDay) {
            const nextDay = new Date(selectedDay);
            nextDay.setDate(nextDay.getDate() + 1);
            setSelectedDay(nextDay);
        }
    };

    function renderMultiDayBarsForMatrix(plan: Plan, matrix: Date[][]) {
        const startDate = new Date(plan.startDate);
        const endDate = new Date(plan.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // If plan doesn't overlap with current month view at all, return null
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        if (endDate < monthStart || startDate > monthEnd) return null;

        // Calculate visible period of the plan
        const visibleStart = startDate < monthStart ? monthStart : startDate;
        const visibleEnd = endDate > monthEnd ? monthEnd : endDate;

        // Find which weeks the plan spans in the matrix
        let startWeek = -1;
        let startDayInWeek = -1;
        let endWeek = -1;
        let endDayInWeek = -1;

        for (let week = 0; week < matrix.length; week++) {
            for (let day = 0; day < matrix[week].length; day++) {
                const date = matrix[week][day];
                if (date.getTime() === visibleStart.getTime() ||
                    (date > visibleStart && startWeek === -1)) {
                    startWeek = week;
                    startDayInWeek = day;
                }
                if (date.getTime() === visibleEnd.getTime() ||
                    (date < visibleEnd && date.getDate() === visibleEnd.getDate())) {
                    endWeek = week;
                    endDayInWeek = day;
                }
            }
        }

        if (startWeek === -1 || endWeek === -1) return null;

        // Generate bars for each week the plan spans
        const bars = [];
        for (let week = startWeek; week <= endWeek; week++) {
            const weekStartDay = week === startWeek ? startDayInWeek : 0;
            const weekEndDay = week === endWeek ? endDayInWeek : 6;

            bars.push(
                <div
                    key={`multiday-${plan._id}-week-${week}`}
                    className={`absolute h-5 rounded-md ${statusColor(plan.status)} border px-2 text-xs flex items-center z-10 overflow-hidden whitespace-nowrap`}
                    style={{
                        top: `${32 + week * 120}px`, // 32px for header, 120px per week
                        left: `${14.28 * weekStartDay}%`,
                        width: `${14.28 * (weekEndDay - weekStartDay + 1)}%`,
                    }}
                    onClick={e => { e.stopPropagation(); onPlanClick(plan._id); }}
                >
                    <div className={`w-2 h-2 rounded-full ${typeColor(plan.type).split(' ')[0]} mr-1 flex-shrink-0`}></div>
                    <span className="truncate">{plan.title}</span>
                </div>
            );
        }
        return bars;
    }

    if (viewMode === 'year') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow p-6 overflow-hidden"
            >
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setCurrentYear(currentYear - 1)} className="p-2 hover:bg-gray-100 rounded-full">&lt;</button>
                    <h2 className="text-xl font-bold">{currentYear}</h2>
                    <button onClick={() => setCurrentYear(currentYear + 1)} className="p-2 hover:bg-gray-100 rounded-full">&gt;</button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {months.map((month, idx) => (
                        <div
                            key={month}
                            className="p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => handleMonthClick(idx)}
                        >
                            <h3 className="text-center font-medium">{month}</h3>
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    }

    if (viewMode === 'day' && selectedDay) {
        const dayKey = selectedDay.toISOString().slice(0, 10);
        const dayPlans = plansByDay[dayKey] || [];
        // Group plans by hour for better rendering
        const plansByHour: Record<string, Plan[]> = {};
        dayPlans.forEach(plan => {
            const planStartDate = new Date(plan.startDate);
            const hour = `${planStartDate.getHours().toString().padStart(2, '0')}:00`;
            if (!plansByHour[hour]) plansByHour[hour] = [];
            plansByHour[hour].push(plan);
        });

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow p-6 overflow-hidden h-full"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <button onClick={() => setViewMode('month')} className="text-blue-600 hover:underline">⬅ Retour au mois</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={goToPrevDay} className="p-2 hover:bg-gray-100 rounded-full">&lt;</button>
                        <h2 className="text-xl font-bold">{selectedDay.getDate()} {months[selectedDay.getMonth()]}, {selectedDay.getFullYear()}</h2>
                        <button onClick={goToNextDay} className="p-2 hover:bg-gray-100 rounded-full">&gt;</button>
                    </div>
                    <button onClick={goToToday} className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-sm">Aujourd'hui</button>
                </div>

                <div className="overflow-y-auto h-[calc(100vh-240px)]">
                    {hours.map(hour => (
                        <div key={hour} className="flex border-t border-gray-100 py-4">
                            <div className="w-20 flex-shrink-0 text-gray-500 text-sm">{hour}</div>
                            <div className="flex-grow">
                                {plansByHour[hour]?.map(plan => (
                                    <div
                                        key={plan._id}
                                        className={`p-3 mb-2 rounded-lg ${statusColor(plan.status)} border cursor-pointer hover:shadow-md transition`}
                                        onClick={() => onPlanClick(plan._id)}
                                    >
                                        <div className="font-medium">{plan.title}</div>
                                        <div className="text-sm text-gray-600 flex gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${typeColor(plan.type)}`}>{plan.type}</span>
                                            <span>• {plan.responsiblePerson}</span>
                                            <span>• {plan.equipmentId.nom}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow p-6 overflow-hidden"
        >
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 rounded-full">&lt;</button>
                    <h2 className="text-xl font-bold">{months[currentMonth]} {currentYear}</h2>
                    <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-full">&gt;</button>
                </div>
                <div className="flex gap-2">
                    <button onClick={goToToday} className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-sm">Aujourd'hui</button>
                    <button onClick={() => setViewMode('year')} className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 text-sm">Vue annuelle</button>
                </div>
            </div>

            <div className="relative">
                {/* Calendar header */}
                <div className="grid grid-cols-7 gap-0 mb-2">
                    {weekdays.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500">{day}</div>
                    ))}
                </div>

                {/* Render multi-day events first as bars */}
                {plansToShow.filter(plan => {
                    // Only show plans that span multiple days
                    const start = new Date(plan.startDate);
                    const end = new Date(plan.endDate);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);
                    return end.getTime() - start.getTime() > 86400000; // > 1 day
                }).map(plan => renderMultiDayBarsForMatrix(plan, monthMatrix))}

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-0">
                    {monthMatrix.flat().map((date, idx) => {
                        const isCurrentMonth = date.getMonth() === currentMonth;
                        const isToday = new Date().toDateString() === date.toDateString();
                        const dateKey = date.toISOString().slice(0, 10);
                        const datePlans = plansByDay[dateKey] || [];

                        // Filter out multi-day plans for cell display (they're shown as bars)
                        const singleDayPlans = datePlans.filter(plan => {
                            const start = new Date(plan.startDate);
                            const end = new Date(plan.endDate);
                            start.setHours(0, 0, 0, 0);
                            end.setHours(0, 0, 0, 0);
                            return end.getTime() - start.getTime() <= 86400000; // <= 1 day
                        });

                        return (
                            <div
                                key={idx}
                                className={`relative h-28 border-t border-l ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'} ${isToday ? 'ring-2 ring-blue-400 z-10' : ''}`}
                                onClick={() => goToDay(date)}
                            >
                                <div className={`text-right p-1 ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
                                    {date.getDate()}
                                </div>
                                <div className="px-1 overflow-y-auto max-h-[85px]">
                                    {singleDayPlans.slice(0, 2).map(plan => (
                                        <div
                                            key={plan._id}
                                            className={`mb-1 px-2 py-1 text-xs rounded ${statusColor(plan.status)} border truncate cursor-pointer`}
                                            onClick={e => { e.stopPropagation(); onPlanClick(plan._id); }}
                                        >
                                            <div className="flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${typeColor(plan.type).split(' ')[0]}`}></div>
                                                <span className="truncate">{plan.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {singleDayPlans.length > 2 && (
                                        <div
                                            className="text-xs text-blue-600 cursor-pointer"
                                            onClick={e => { e.stopPropagation(); goToDay(date); }}
                                        >
                                            +{singleDayPlans.length - 2} plus
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
} 