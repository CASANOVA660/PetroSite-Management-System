import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Plan {
    id: string | number;
    title: string;
    type: string;
    responsible: string;
    equipment: string;
    startDate: string; // ISO string, e.g. '2025-01-14T08:00'
    endDate: string;   // ISO string
    status: string;
    avatar?: string; // optional avatar url
}

interface CalendarViewProps {
    plans?: Plan[];
    onPlanClick: (id: string | number) => void;
}

// Helper: get color by type
const typeColor = (type: string) => {
    if (type === 'Maintenance') return 'bg-green-100 text-green-700 border-green-300';
    if (type === 'Mobilization') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-blue-100 text-blue-700 border-blue-300';
};

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const mockAvatars = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/45.jpg',
    'https://randomuser.me/api/portraits/women/46.jpg',
    'https://randomuser.me/api/portraits/men/47.jpg',
    'https://randomuser.me/api/portraits/women/48.jpg',
    'https://randomuser.me/api/portraits/men/49.jpg',
    'https://randomuser.me/api/portraits/women/50.jpg',
];

const mockPlans: Plan[] = [
    {
        id: 1,
        title: 'Discuss Property with Jane.',
        type: 'Maintenance',
        responsible: 'Jane Doe',
        equipment: 'Laptop',
        startDate: '2025-01-14T08:00',
        endDate: '2025-01-14T09:30',
        status: 'Upcoming',
        avatar: mockAvatars[1],
    },
    {
        id: 2,
        title: 'Maplewood Estate Visit',
        type: 'Mobilization',
        responsible: 'John Smith',
        equipment: 'Car',
        startDate: '2025-01-14T08:30',
        endDate: '2025-01-14T10:45',
        status: 'In Progress',
        avatar: mockAvatars[0],
    },
    {
        id: 3,
        title: 'Maplewood Estate Site Eval',
        type: 'Mobilization',
        responsible: 'Alex Green',
        equipment: 'Tablet',
        startDate: '2025-01-15T08:00',
        endDate: '2025-01-15T10:00',
        status: 'Upcoming',
        avatar: mockAvatars[2],
    },
    {
        id: 4,
        title: 'Client Review Aspen Creek',
        type: 'Maintenance',
        responsible: 'Sara Lee',
        equipment: 'Docs',
        startDate: '2025-01-16T08:00',
        endDate: '2025-01-16T08:55',
        status: 'Upcoming',
        avatar: mockAvatars[3],
    },
    {
        id: 5,
        title: 'Executive Planning Session',
        type: 'Maintenance',
        responsible: 'Chris Brown',
        equipment: 'Whiteboard',
        startDate: '2025-01-19T11:25',
        endDate: '2025-01-19T13:00',
        status: 'Upcoming',
        avatar: mockAvatars[4],
    },
    {
        id: 6,
        title: 'Site Visit for Lakeview Villas',
        type: 'Mobilization',
        responsible: 'Emily Clark',
        equipment: 'Car',
        startDate: '2025-01-14T10:50',
        endDate: '2025-01-14T11:40',
        status: 'Upcoming',
        avatar: mockAvatars[5],
    },
    {
        id: 7,
        title: 'Finance Budget Review',
        type: 'Maintenance',
        responsible: 'Michael Scott',
        equipment: 'Laptop',
        startDate: '2025-01-14T11:00',
        endDate: '2025-01-14T11:50',
        status: 'Upcoming',
        avatar: mockAvatars[6],
    },
    {
        id: 8,
        title: 'Marketing Strategy Meeting',
        type: 'Maintenance',
        responsible: 'Pam Beesly',
        equipment: 'Projector',
        startDate: '2025-01-14T10:00',
        endDate: '2025-01-14T11:50',
        status: 'Upcoming',
        avatar: mockAvatars[7],
    },
    // Multi-day event for visual testing
    {
        id: 9,
        title: '7-Day Project Sprint',
        type: 'Mobilization',
        responsible: 'Project Team',
        equipment: 'All',
        startDate: '2025-01-10T09:00',
        endDate: '2025-01-17T18:00',
        status: 'In Progress',
        avatar: mockAvatars[0],
    },
];

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
    const [currentMonth, setCurrentMonth] = useState(0); // 0 = January
    const [currentYear, setCurrentYear] = useState(2025);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const plansToShow = plans && plans.length > 0 ? plans : mockPlans;

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
            if (!plansByDay[key].some(p => p.id === plan.id)) {
                plansByDay[key].push(plan);
            }
        }
    });

    // Handlers
    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };
    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };
    const goToToday = () => {
        setCurrentMonth(0);
        setCurrentYear(2025);
        setViewMode('month');
        setSelectedDay(null);
    };

    // Year view handler
    const handleMonthClick = (idx: number) => {
        setCurrentMonth(idx);
        setViewMode('month');
    };

    // Day view navigation
    const goToDay = (date: Date) => {
        setSelectedDay(date);
        setViewMode('day');
    };
    const goToPrevDay = () => {
        if (selectedDay) {
            const prev = new Date(selectedDay);
            prev.setDate(prev.getDate() - 1);
            setSelectedDay(prev);
        }
    };
    const goToNextDay = () => {
        if (selectedDay) {
            const next = new Date(selectedDay);
            next.setDate(next.getDate() + 1);
            setSelectedDay(next);
        }
    };

    // Render multi-day event bar in month view (one per week, not repeated)
    function renderMultiDayBarsForMatrix(plan: Plan, matrix: Date[][]) {
        const start = new Date(plan.startDate);
        const end = new Date(plan.endDate);
        const firstDay = matrix[0][0];
        const lastDay = matrix[matrix.length - 1][6];
        // Clamp to visible month
        const barStart = start < firstDay ? firstDay : start;
        const barEnd = end > lastDay ? lastDay : end;
        // For each week, render a bar only in the first cell of the week where the event is present
        const bars: React.ReactNode[] = [];
        matrix.forEach((week, weekIdx) => {
            // Find the first and last day in this week that the event covers
            const weekStart = week[0];
            const weekEnd = week[6];
            // If the event covers the whole week, fill all 7 columns
            let segStart = barStart > weekStart ? barStart : weekStart;
            let segEnd = barEnd < weekEnd ? barEnd : weekEnd;
            if (segStart > segEnd) return; // No overlap this week
            let colStart = week.findIndex(d => d.toISOString().slice(0, 10) === segStart.toISOString().slice(0, 10));
            let colEnd = week.findIndex(d => d.toISOString().slice(0, 10) === segEnd.toISOString().slice(0, 10));
            // If the event covers the whole week, set colStart=0 and colEnd=6
            if (segStart <= weekStart && segEnd >= weekEnd) {
                colStart = 0;
                colEnd = 6;
            }
            if (colStart !== -1) {
                bars.push(
                    <div
                        key={plan.id + '-bar-' + weekIdx}
                        className="absolute flex items-center h-6 rounded-full pointer-events-auto cursor-pointer transition hover:scale-[1.03]"
                        style={{
                            left: `calc(${(colStart / 7) * 100}% + 2px)`,
                            width: `calc(${((colEnd - colStart + 1) / 7) * 100}% - 4px)`,
                            top: `calc(${weekIdx * 100 / matrix.length}% + 4px)`,
                            minWidth: 60,
                            maxWidth: '100%',
                            zIndex: 2,
                        }}
                        onClick={e => { e.stopPropagation(); onPlanClick(plan.id); }}
                    >
                        <div
                            className={`flex items-center h-6 rounded-full px-2 border shadow font-semibold text-xs ${typeColor(plan.type)}`}
                            style={{
                                borderTopLeftRadius: (colStart === 0 && segStart <= firstDay) ? 0 : 9999,
                                borderBottomLeftRadius: (colStart === 0 && segStart <= firstDay) ? 0 : 9999,
                                borderTopRightRadius: (colEnd === 6 && segEnd >= lastDay) ? 0 : 9999,
                                borderBottomRightRadius: (colEnd === 6 && segEnd >= lastDay) ? 0 : 9999,
                            }}
                        >
                            <img src={plan.avatar || mockAvatars[0]} alt="avatar" className="w-5 h-5 rounded-full border border-white shadow mr-2" />
                            <span className="truncate max-w-[120px]">{plan.title}</span>
                            {segEnd < end && <span className="ml-2">→</span>}
                        </div>
                    </div>
                );
            }
        });
        return bars;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-white shadow-lg p-6 overflow-x-auto"
        >
            {/* Top bar: Month/Year, navigation, view toggle */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button onClick={goToPrevMonth} className="rounded-full bg-gray-100 px-3 py-1 text-gray-500">&#8592;</button>
                    <span className="text-xl font-semibold text-gray-800 cursor-pointer" onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}>
                        {viewMode === 'day' && selectedDay ? `${months[selectedDay.getMonth()]} ${selectedDay.getDate()}, ${selectedDay.getFullYear()}` : `${months[currentMonth]} ${currentYear}`}
                    </span>
                    <button onClick={goToNextMonth} className="rounded-full bg-gray-100 px-3 py-1 text-gray-500">&#8594;</button>
                    <button onClick={goToToday} className="ml-2 rounded-lg bg-blue-50 text-blue-600 px-3 py-1 text-sm font-medium">Today</button>
                    {viewMode === 'month' && selectedDay && (
                        <button onClick={() => setViewMode('day')} className="ml-2 rounded-lg bg-purple-50 text-purple-600 px-3 py-1 text-sm font-medium">Day View</button>
                    )}
                </div>
                <button onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')} className="rounded-lg border px-3 py-1 text-sm text-gray-500 ml-2">
                    {viewMode === 'month' ? 'Year View' : 'Month View'}
                </button>
            </div>
            {viewMode === 'year' ? (
                <div className="grid grid-cols-4 gap-4">
                    {months.map((m, idx) => (
                        <button
                            key={m}
                            onClick={() => handleMonthClick(idx)}
                            className={`rounded-xl p-6 text-lg font-semibold shadow transition border-2 ${idx === currentMonth ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            ) : viewMode === 'day' && selectedDay ? (
                <div>
                    {/* Day View */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={goToPrevDay} className="rounded-full bg-gray-100 px-3 py-1 text-gray-500">&#8592;</button>
                        <span className="text-lg font-semibold text-gray-800">{months[selectedDay.getMonth()]} {selectedDay.getDate()}, {selectedDay.getFullYear()}</span>
                        <button onClick={goToNextDay} className="rounded-full bg-gray-100 px-3 py-1 text-gray-500">&#8594;</button>
                        <button onClick={() => setViewMode('month')} className="ml-2 rounded-lg bg-gray-50 text-gray-600 px-3 py-1 text-sm font-medium">Back to Month</button>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                        {/* Time slots */}
                        <div className="flex flex-col">
                            {hours.map(h => (
                                <div key={h} className="h-16 flex items-start justify-end pr-2 text-xs text-gray-400 pt-2">{h}</div>
                            ))}
                        </div>
                        {/* Events */}
                        <div className="relative">
                            {plansToShow.filter(plan => {
                                const d = new Date(plan.startDate);
                                return d.toISOString().slice(0, 10) === selectedDay.toISOString().slice(0, 10);
                            }).map((plan, idx) => {
                                const start = new Date(plan.startDate);
                                const end = new Date(plan.endDate);
                                const startHour = start.getHours();
                                const endHour = end.getHours();
                                const top = (startHour - 8) * 64; // 8am start, 64px per hour
                                const height = Math.max(1, (endHour - startHour + 1)) * 64 - 8;
                                return (
                                    <button
                                        key={plan.id}
                                        onClick={() => onPlanClick(plan.id)}
                                        className={`absolute left-0 flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-md ${typeColor(plan.type)} transition hover:scale-[1.03]`}
                                        style={{ top, height, minWidth: 180, zIndex: 2 }}
                                        title={plan.title}
                                    >
                                        <img src={plan.avatar || mockAvatars[idx % mockAvatars.length]} alt="avatar" className="w-7 h-7 rounded-full border border-white shadow" />
                                        <span className="font-semibold text-sm truncate max-w-[120px]">{plan.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {weekdays.map(day => (
                            <div key={day} className="text-center text-gray-400 font-medium text-sm py-1">{day}</div>
                        ))}
                    </div>
                    {/* Month grid */}
                    <div className="relative">
                        {/* Month grid, week by week */}
                        {monthMatrix.map((week, weekIdx) => {
                            return (
                                <div key={weekIdx} className="grid grid-cols-7 relative mb-1 min-h-[90px]">
                                    {week.map((date, dayIdx) => {
                                        const isCurrentMonth = date.getMonth() === currentMonth;
                                        const dayKey = date.toISOString().slice(0, 10);
                                        // Multi-day events that cover this day
                                        const multiDayBars = plansToShow.filter(plan => {
                                            const start = new Date(plan.startDate);
                                            const end = new Date(plan.endDate);
                                            return (
                                                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) >= 1 &&
                                                start <= date && end >= date
                                            );
                                        });
                                        // Single-day events
                                        const dayPlans = (plansByDay[dayKey] || []).filter(plan => {
                                            const start = new Date(plan.startDate);
                                            const end = new Date(plan.endDate);
                                            return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) < 1;
                                        });
                                        return (
                                            <div
                                                key={dayIdx}
                                                className={`rounded-xl p-1 flex flex-col gap-1 border transition relative min-h-[90px] ${isCurrentMonth ? 'bg-gray-50 border-gray-200' : 'bg-white border-transparent opacity-60'}`}
                                                onClick={() => goToDay(date)}
                                                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                                            >
                                                <div className={`text-xs font-semibold mb-1 ${isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>{date.getDate()}</div>
                                                {/* Multi-day bars inside the cell, at the top */}
                                                {multiDayBars.map((plan, i) => {
                                                    const start = new Date(plan.startDate);
                                                    const end = new Date(plan.endDate);
                                                    const isStart = start.toISOString().slice(0, 10) === dayKey;
                                                    const isEnd = end.toISOString().slice(0, 10) === dayKey;
                                                    let rounded = '';
                                                    if (isStart && isEnd) rounded = 'rounded-full';
                                                    else if (isStart) rounded = 'rounded-l-full';
                                                    else if (isEnd) rounded = 'rounded-r-full';
                                                    else rounded = 'rounded-none';
                                                    return (
                                                        <div
                                                            key={plan.id + '-bar-' + dayKey}
                                                            className={`flex items-center h-6 px-2 border shadow font-semibold text-xs mb-1 ${typeColor(plan.type)} ${rounded}`}
                                                            style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}
                                                            onClick={e => { e.stopPropagation(); onPlanClick(plan.id); }}
                                                        >
                                                            {isStart && <img src={plan.avatar || mockAvatars[0]} alt="avatar" className="w-5 h-5 rounded-full border border-white shadow mr-2" />}
                                                            <span className="truncate max-w-[80px]">{plan.title}</span>
                                                        </div>
                                                    );
                                                })}
                                                <div className="flex flex-col gap-1">
                                                    {dayPlans.map((plan, i) => (
                                                        <button
                                                            key={plan.id}
                                                            onClick={e => { e.stopPropagation(); onPlanClick(plan.id); }}
                                                            className={`flex items-center gap-2 px-2 py-1 rounded-lg border shadow-sm ${typeColor(plan.type)} text-xs font-medium truncate hover:scale-[1.03] transition`}
                                                            title={plan.title}
                                                        >
                                                            <img src={plan.avatar || mockAvatars[i % mockAvatars.length]} alt="avatar" className="w-5 h-5 rounded-full border border-white shadow" />
                                                            <span className="truncate max-w-[80px]">{plan.title}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
} 