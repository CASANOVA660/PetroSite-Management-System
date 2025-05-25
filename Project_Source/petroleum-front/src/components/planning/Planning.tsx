import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store';
import { fetchPlans, createPlan, updatePlan, deletePlan } from '../../store/slices/planningSlice';
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
import ViewPlanModal from './ViewPlanModal';

const tabs = [
    { label: 'Overview', icon: '🗂️' },
    { label: 'Calendar View', icon: '📆' },
];

type Filters = {
    status?: string;
    responsible?: string;
    date?: string;
};

export default function Planning() {
    const dispatch = useAppDispatch();
    const { plans, loading } = useSelector((state: any) => state.planning);
    const [activeTab, setActiveTab] = useState(0);
    const [filters, setFilters] = useState<Filters>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewPlan, setViewPlan] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchPlans());
    }, [dispatch]);

    // Filtered plans from Redux
    const filteredPlans = plans.filter((p: any) => {
        if (filters.status && p.status !== filters.status) return false;
        if (filters.responsible && !p.responsible?.toLowerCase().includes(filters.responsible.toLowerCase())) return false;
        if (filters.date && p.startDate !== filters.date) return false;
        return true;
    });

    // Compute summary cards from real plans
    const placements = plans.filter((p: any) => p.type === 'placement').length;
    const maintenances = plans.filter((p: any) => p.type === 'maintenance').length;
    const pending = plans.filter((p: any) => p.status === 'Upcoming').length;
    const inUse = plans.filter((p: any) => p.status === 'In Progress').length;
    const summaryCards = [
        { icon: '🛠️', label: 'Total Placements', value: placements, color: 'text-orange-500' },
        { icon: '🧰', label: 'Total Maintenance', value: maintenances, color: 'text-green-500' },
        { icon: '⏳', label: 'Pending Approvals', value: pending, color: 'text-yellow-500' },
        { icon: '🚚', label: 'Equipment in Use', value: inUse, color: 'text-blue-500' },
    ];

    // Handlers
    const handleNewPlan = () => {
        setEditingPlan(null);
        setModalOpen(true);
    };
    const handleEdit = (id: any) => {
        const plan = plans.find((p: any) => p._id === id);
        setEditingPlan(plan);
        setModalOpen(true);
    };
    const handleSave = (plan: any) => {
        if (editingPlan) {
            dispatch(updatePlan({ id: editingPlan._id, data: plan }));
        } else {
            dispatch(createPlan(plan));
        }
        setModalOpen(false);
        setEditingPlan(null);
    };
    const handleView = (id: any) => {
        const plan = plans.find((p: any) => p._id === id);
        setViewPlan(plan);
        setViewModalOpen(true);
    };
    const handleDelete = (id: any) => {
        dispatch(deletePlan(id));
    };

    return (
        <div className="font-outfit min-h-screen bg-gray-50 p-6">
            <PlanningHeader onNewPlan={handleNewPlan} onSearch={() => { }} />
            <PlanningTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            {activeTab !== 3 && <SummaryCards cards={summaryCards} onCardClick={() => { }} />}
            {activeTab !== 3 && <FilterBar filters={filters} onChange={setFilters} />}
            {loading ? (
                <LoadingSkeleton type={activeTab === 3 ? 'card' : 'table'} />
            ) : (
                <ResponsiveWrapper>
                    {isMobile => (
                        <>
                            {activeTab === 3 ? (
                                <CalendarView plans={filteredPlans} onPlanClick={handleEdit} />
                            ) : isMobile ? (
                                <div>
                                    {filteredPlans.map((plan: any) => (
                                        <PlanningCard
                                            key={plan._id}
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
            <ViewPlanModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} plan={viewPlan} />
            <FloatingButton onClick={handleNewPlan} />
        </div>
    );
} 