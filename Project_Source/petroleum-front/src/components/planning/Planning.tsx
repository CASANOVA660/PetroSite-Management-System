import React, { useState } from 'react';
import PlanningHeader from './PlanningHeader';
import PlanningTabs from './PlanningTabs';
import SummaryCards from './SummaryCards';
import PlanningTable from './PlanningTable';
import PlanningCard from './PlanningCard';
import CalendarView from './CalendarView';
import PlanModal from './PlanModal';
import FilterBar from './FilterBar';
import FloatingButton from './FloatingButton';
import ResponsiveWrapper from './ResponsiveWrapper';
import LoadingSkeleton from './LoadingSkeleton';

const tabs = [
    { label: 'Overview', icon: '🗂️' },
    { label: 'Mobilization', icon: '🛠️' },
    { label: 'Maintenance', icon: '🧰' },
    { label: 'Calendar View', icon: '📆' },
];

const mockPlans = [
    { id: 1, title: 'Maplewood Estate Visit', type: 'Mobilization', responsible: 'John Doe', equipment: 'Truck, Crane', startDate: '2025-01-14', endDate: '2025-01-14', status: 'Upcoming' },
    { id: 2, title: 'Finance Budget Review', type: 'Maintenance', responsible: 'Jane Smith', equipment: 'Laptop', startDate: '2025-01-15', endDate: '2025-01-15', status: 'Done' },
    { id: 3, title: 'Marketing Brainstorming', type: 'Mobilization', responsible: 'Emily Clark', equipment: 'Whiteboard', startDate: '2025-01-16', endDate: '2025-01-16', status: 'In Progress' },
    { id: 4, title: 'Contract with Emily', type: 'Maintenance', responsible: 'Emily Clark', equipment: 'Documents', startDate: '2025-01-17', endDate: '2025-01-17', status: 'Upcoming' },
];

const mockCards = [
    { icon: '🛠️', label: 'Total Mobilizations', value: 12, color: 'text-orange-500' },
    { icon: '🧰', label: 'Upcoming Maintenance', value: 5, color: 'text-green-500' },
    { icon: '⏳', label: 'Pending Approvals', value: 2, color: 'text-yellow-500' },
    { icon: '🚚', label: 'Equipment in Use', value: 7, color: 'text-blue-500' },
];

type Filters = {
    status?: string;
    responsible?: string;
    date?: string;
};

export default function Planning() {
    const [activeTab, setActiveTab] = useState(0);
    const [filters, setFilters] = useState<Filters>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Filtered plans (mock logic)
    const filteredPlans = mockPlans.filter(p => {
        if (filters.status && p.status !== filters.status) return false;
        if (filters.responsible && !p.responsible.toLowerCase().includes(filters.responsible.toLowerCase())) return false;
        if (filters.date && p.startDate !== filters.date) return false;
        return true;
    });

    // Handlers
    const handleNewPlan = () => {
        setEditingPlan(null);
        setModalOpen(true);
    };
    const handleEdit = (id: any) => {
        setEditingPlan(mockPlans.find(p => p.id === id));
        setModalOpen(true);
    };
    const handleSave = (plan: any) => {
        setModalOpen(false);
        setEditingPlan(null);
        // Save logic here
    };
    const handleView = (id: any) => {
        // View logic here
    };
    const handleDelete = (id: any) => {
        // Delete logic here
    };

    return (
        <div className="font-outfit min-h-screen bg-gray-50 p-6">
            <PlanningHeader onNewPlan={handleNewPlan} onSearch={() => { }} />
            <PlanningTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            {activeTab !== 3 && <SummaryCards cards={mockCards} onCardClick={() => { }} />}
            {activeTab !== 3 && <FilterBar filters={filters} onChange={setFilters} />}
            {loading ? (
                <LoadingSkeleton type={activeTab === 3 ? 'card' : 'table'} />
            ) : (
                <ResponsiveWrapper>
                    {isMobile => (
                        <>
                            {activeTab === 3 ? (
                                <CalendarView onPlanClick={handleEdit} />
                            ) : isMobile ? (
                                <div>
                                    {filteredPlans.map(plan => (
                                        <PlanningCard
                                            key={plan.id}
                                            plan={plan}
                                            onView={handleView}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <PlanningTable
                                    plans={filteredPlans}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            )}
                        </>
                    )}
                </ResponsiveWrapper>
            )}
            <PlanModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} plan={editingPlan} />
            <FloatingButton onClick={handleNewPlan} />
        </div>
    );
} 