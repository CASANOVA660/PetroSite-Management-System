import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store';
import { fetchPlans, createPlan, updatePlan, deletePlan, PlanType, PlanStatus } from '../../store/slices/planningSlice';
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
    { label: 'Vue Tableau', icon: '🗂️' },
    { label: 'Vue Calendrier', icon: '📆' },
];

type Filters = {
    status?: string;
    type?: string;
    equipmentId?: string;
    startDate?: string;
    endDate?: string;
};

export default function Planning() {
    const dispatch = useAppDispatch();
    const { plans = [], loading } = useSelector((state: any) => state.planning);
    const [activeTab, setActiveTab] = useState(0);
    const [filters, setFilters] = useState<Filters>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewPlan, setViewPlan] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchPlans({}));
    }, [dispatch]);

    // Ensure plans is always an array before filtering
    const plansArray = Array.isArray(plans) ? plans : [];

    // Filtered plans based on the filters
    const filteredPlans = plansArray.filter((p: any) => {
        if (filters.status && p.status !== filters.status) return false;
        if (filters.type && p.type !== filters.type) return false;
        if (filters.equipmentId && p.equipmentId._id !== filters.equipmentId) return false;

        // Date range filtering
        if (filters.startDate) {
            const planStartDate = new Date(p.startDate);
            const filterStartDate = new Date(filters.startDate);
            if (planStartDate < filterStartDate) return false;
        }

        if (filters.endDate) {
            const planEndDate = new Date(p.endDate);
            const filterEndDate = new Date(filters.endDate);
            if (planEndDate > filterEndDate) return false;
        }

        return true;
    });

    // Compute summary cards from real plans
    const placements = plansArray.filter((p: any) => p.type === PlanType.PLACEMENT).length;
    const maintenances = plansArray.filter((p: any) => p.type === PlanType.MAINTENANCE).length;
    const repairs = plansArray.filter((p: any) => p.type === PlanType.REPAIR).length;
    const scheduled = plansArray.filter((p: any) => p.status === PlanStatus.SCHEDULED).length;
    const inProgress = plansArray.filter((p: any) => p.status === PlanStatus.IN_PROGRESS).length;

    const summaryCards = [
        { icon: '🚜', label: 'Placements', value: placements, color: 'text-orange-500' },
        { icon: '🔧', label: 'Maintenances', value: maintenances, color: 'text-blue-500' },
        { icon: '🛠️', label: 'Réparations', value: repairs, color: 'text-red-500' },
        { icon: '⏳', label: 'Planifiés', value: scheduled, color: 'text-yellow-500' },
        { icon: '⚙️', label: 'En cours', value: inProgress, color: 'text-green-500' },
    ];

    // Handlers
    const handleNewPlan = () => {
        setEditingPlan(null);
        setModalOpen(true);
    };

    const handleEdit = (id: string) => {
        const plan = plansArray.find((p: any) => p._id === id);
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

    const handleView = (id: string) => {
        const plan = plansArray.find((p: any) => p._id === id);
        setViewPlan(plan);
        setViewModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette planification?')) {
            dispatch(deletePlan(id));
        }
    };

    // Function to handle card clicks for summary cards
    const handleCardClick = (index: number) => {
        // Set filters based on which card was clicked
        switch (index) {
            case 0: // Placements
                setFilters(prev => ({ ...prev, type: PlanType.PLACEMENT }));
                break;
            case 1: // Maintenances
                setFilters(prev => ({ ...prev, type: PlanType.MAINTENANCE }));
                break;
            case 2: // Repairs
                setFilters(prev => ({ ...prev, type: PlanType.REPAIR }));
                break;
            case 3: // Scheduled
                setFilters(prev => ({ ...prev, status: PlanStatus.SCHEDULED }));
                break;
            case 4: // In Progress
                setFilters(prev => ({ ...prev, status: PlanStatus.IN_PROGRESS }));
                break;
            default:
                break;
        }
    };

    // Build filter options from real data
    const filterOptions = {
        status: [
            { label: 'Tous les statuts', value: '' },
            { label: 'Planifié', value: PlanStatus.SCHEDULED },
            { label: 'En cours', value: PlanStatus.IN_PROGRESS },
            { label: 'Terminé', value: PlanStatus.COMPLETED },
            { label: 'Annulé', value: PlanStatus.CANCELLED },
        ],
        type: [
            { label: 'Tous les types', value: '' },
            { label: 'Placement', value: PlanType.PLACEMENT },
            { label: 'Maintenance', value: PlanType.MAINTENANCE },
            { label: 'Réparation', value: PlanType.REPAIR },
        ],
        equipment: plansArray.reduce((options: any[], plan: any) => {
            if (plan.equipmentId && !options.some((opt) => opt.value === plan.equipmentId._id)) {
                options.push({
                    label: plan.equipmentId.nom,
                    value: plan.equipmentId._id,
                });
            }
            return options;
        }, [{ label: 'Tous les équipements', value: '' }]),
    };

    return (
        <div className="font-outfit min-h-screen bg-gray-50 p-6">
            <PlanningHeader onNewPlan={handleNewPlan} onSearch={() => { }} />
            <PlanningTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            <SummaryCards cards={summaryCards} onCardClick={handleCardClick} />
            <FilterBar filters={filters} onChange={setFilters} options={filterOptions} />

            {loading ? (
                <LoadingSkeleton type={activeTab === 1 ? 'card' : 'table'} />
            ) : (
                <ResponsiveWrapper>
                    {isMobile => (
                        <>
                            {activeTab === 1 ? (
                                <CalendarView plans={filteredPlans} onPlanClick={handleEdit} />
                            ) : isMobile ? (
                                <div className="space-y-4 mt-6">
                                    {filteredPlans.length > 0 ? (
                                        filteredPlans.map((plan: any) => (
                                            <PlanningCard
                                                key={plan._id}
                                                plan={plan}
                                                onView={handleView}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center p-8 bg-white rounded-xl shadow-sm">
                                            <p className="text-gray-500">Aucune planification ne correspond à vos critères.</p>
                                        </div>
                                    )}
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