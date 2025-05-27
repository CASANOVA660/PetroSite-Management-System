import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store';
import { fetchEquipment } from '../../store/slices/equipmentSlice';
import { getAvailableEquipment, PlanType, PlanStatus } from '../../store/slices/planningSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Plan {
    _id?: string;
    title: string;
    description: string;
    type: PlanType;
    equipmentId: string;
    responsiblePerson: string; // Keep as string for form input
    location: string;
    startDate: string;
    endDate: string;
    notes?: string;
}

interface PlanToSave extends Omit<Plan, 'responsiblePerson'> {
    responsiblePerson: {
        name: string;
    };
    status?: PlanStatus;
    createdBy?: string;
}

interface PlanModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (plan: PlanToSave) => void;
    plan?: any;
}

const typeOptions = [
    { label: 'Placement', value: PlanType.PLACEMENT },
    { label: 'Maintenance', value: PlanType.MAINTENANCE },
    { label: 'Réparation', value: PlanType.REPAIR },
];

const inputClass =
    'w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 outline-none bg-white text-gray-700 text-base shadow-sm transition placeholder-gray-400 mb-2';
const labelClass = 'text-sm font-medium text-gray-700 mb-1';

export default function PlanModal({ open, onClose, onSave, plan }: PlanModalProps) {
    const dispatch = useAppDispatch();
    const equipmentList = useSelector((state: any) => state.equipment.equipment);
    const availableEquipment = useSelector((state: any) => state.planning.availableEquipment);
    const equipmentLoading = useSelector((state: any) => state.equipment.loading);
    const userId = useSelector((state: any) => state.auth.user?._id);
    const [step, setStep] = useState(0);
    const [typeSelected, setTypeSelected] = useState<PlanType>(PlanType.PLACEMENT);
    const [dateRangeSelected, setDateRangeSelected] = useState(false);
    const initialForm: Plan = {
        title: '',
        description: '',
        type: PlanType.PLACEMENT,
        equipmentId: '',
        responsiblePerson: '',
        location: '',
        startDate: '',
        endDate: '',
        notes: '',
    };
    const [form, setForm] = useState<Plan>(initialForm);
    const [error, setError] = useState<string | null>(null);
    const [equipmentConflicts, setEquipmentConflicts] = useState<{ [key: string]: string }>({});
    const [nextAvailableDates, setNextAvailableDates] = useState<{ [key: string]: string }>({});
    const hasInitializedRef = useRef(false);
    const hasCheckedAvailabilityRef = useRef(false);

    useEffect(() => {
        // Only fetch equipment once when the modal opens
        if (open && !hasInitializedRef.current && !equipmentLoading) {
            hasInitializedRef.current = true;
            console.log('Fetching equipment once on modal open');
            dispatch(fetchEquipment());
        }

        if (!open) {
            hasInitializedRef.current = false;
        }
    }, [open, equipmentLoading, dispatch]);

    useEffect(() => {
        if (plan) {
            setForm({
                ...initialForm,
                ...plan,
                startDate: plan.startDate ? plan.startDate.slice(0, 10) : '',
                endDate: plan.endDate ? plan.endDate.slice(0, 10) : '',
                equipmentId: typeof plan.equipmentId === 'object' && plan.equipmentId !== null
                    ? plan.equipmentId._id
                    : plan.equipmentId || '',
                responsiblePerson: plan.responsiblePerson || ''
            });
            setTypeSelected(plan.type);
        } else {
            setForm(initialForm);
            setTypeSelected(PlanType.PLACEMENT);
        }
        setDateRangeSelected(false);
    }, [plan, open]);

    useEffect(() => {
        // Only fetch available equipment when both dates are set and type is selected
        // and we haven't already fetched for these parameters
        if (form.startDate && form.endDate && typeSelected && dateRangeSelected && !hasCheckedAvailabilityRef.current) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.error('Invalid date format:', { startDate: form.startDate, endDate: form.endDate });
                return;
            }

            // Check for year format error - if year is less than 1000, it's likely a typo
            if (endDate.getFullYear() < 1000) {
                console.error('Invalid year in end date:', endDate.getFullYear());
                return;
            }

            const formattedStartDate = startDate.toISOString();
            const formattedEndDate = endDate.toISOString();

            console.log('Fetching available equipment with:', {
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                type: typeSelected
            });

            // Fetch available equipment just once for this set of dates/type
            dispatch(getAvailableEquipment({
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                type: typeSelected
            }));

            // Mark that we've fetched availability
            hasCheckedAvailabilityRef.current = true;
        }
    }, [form.startDate, form.endDate, typeSelected, dateRangeSelected, dispatch]);

    // Reset the availability check ref when dates or type change
    useEffect(() => {
        hasCheckedAvailabilityRef.current = false;
    }, [form.startDate, form.endDate, typeSelected]);

    useEffect(() => {
        if (equipmentList.length > 0 && form.startDate && form.endDate) {
            const conflicts: { [key: string]: string } = {};
            const nextDates: { [key: string]: string } = {};

            equipmentList.forEach((equipment: any) => {
                const reason = getEquipmentConflictReason(equipment);
                if (reason) {
                    conflicts[equipment._id] = reason;

                    // Check for activities - handle both "activities" and "allActivities" properties
                    const activities = equipment.activities || equipment.allActivities || [];

                    if (activities.length > 0) {
                        const sortedActivities = [...activities].sort(
                            (a: any, b: any) => new Date(b.endDate || b.startDate).getTime() -
                                new Date(a.endDate || a.startDate).getTime()
                        );

                        const latestConflict = sortedActivities.find((activity: any) => {
                            if (!activity.startDate) return false;

                            const activityStart = new Date(activity.startDate);
                            const activityEnd = new Date(activity.endDate || activity.startDate);
                            const planStart = new Date(form.startDate);
                            const planEnd = new Date(form.endDate);

                            return (activityStart <= planEnd && activityEnd >= planStart);
                        });

                        if (latestConflict) {
                            const nextDate = new Date(latestConflict.endDate || latestConflict.startDate);
                            nextDate.setDate(nextDate.getDate() + 1);
                            nextDates[equipment._id] = nextDate.toISOString().split('T')[0];
                        }
                    }
                }
            });

            setEquipmentConflicts(conflicts);
            setNextAvailableDates(nextDates);
        }
    }, [equipmentList, form.startDate, form.endDate]);

    useEffect(() => {
        if (availableEquipment && availableEquipment.length > 0) {
            console.log('Available equipment:', availableEquipment);
        }
    }, [availableEquipment]);

    // Add logging to understand what's in the equipment list
    useEffect(() => {
        console.log('Equipment list state:', {
            equipmentList,
            length: equipmentList?.length || 0,
            loading: equipmentLoading
        });
    }, [equipmentList, equipmentLoading]);

    const handleChange = (field: keyof Plan, value: any) => {
        // Update the form with the new value
        setForm(f => ({ ...f, [field]: value }));

        // Handle type changes
        if (field === 'type') {
            setTypeSelected(value);
            setForm(f => ({ ...f, equipmentId: '' }));
            hasCheckedAvailabilityRef.current = false;
        }

        // Handle date changes
        if (field === 'startDate' || field === 'endDate') {
            // Create a new form object with the updated field
            const updatedForm = { ...form, [field]: value };

            // Only set dateRangeSelected to true if both dates are filled and valid
            if (updatedForm.startDate && updatedForm.endDate) {
                const startDate = new Date(updatedForm.startDate);
                const endDate = new Date(updatedForm.endDate);

                // Validate dates
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) &&
                    startDate < endDate &&
                    endDate.getFullYear() > 1000) {
                    setDateRangeSelected(true);
                    hasCheckedAvailabilityRef.current = false;
                } else {
                    // If dates are invalid, don't set dateRangeSelected
                    setDateRangeSelected(false);
                }
            } else {
                setDateRangeSelected(false);
            }
        }
    };

    const handleClose = () => {
        setForm(initialForm);
        setStep(0);
        setError(null);
        onClose();
    };

    const handleFinalSave = () => {
        if (!form.title || !form.type || !form.equipmentId || !form.responsiblePerson || !form.startDate || !form.endDate) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        if (start >= end) {
            setError('La date de fin doit être postérieure à la date de début.');
            return;
        }

        // Check if the selected equipment is available
        if (equipmentConflicts[form.equipmentId]) {
            setError(`Cet équipement n'est pas disponible: ${equipmentConflicts[form.equipmentId]}`);
            return;
        }

        const planToSave: PlanToSave = {
            ...form,
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            status: PlanStatus.SCHEDULED,
            createdBy: userId,
            responsiblePerson: {
                name: form.responsiblePerson
            }
        };

        console.log('Saving plan with data:', planToSave);
        onSave(planToSave as any);
        setForm(initialForm);
        setStep(0);
        setError(null);
    };

    const isEquipmentAvailable = (equipmentId: string): boolean => {
        return !equipmentConflicts[equipmentId];
    };

    const getEquipmentConflictReason = (equipment: any): string => {
        if (!form.startDate || !form.endDate) return '';

        if (typeSelected === PlanType.PLACEMENT && equipment.status !== 'AVAILABLE') {
            return `Cet équipement n'est pas disponible pour un placement (statut actuel: ${equipment.status})`;
        }

        if (typeSelected === PlanType.MAINTENANCE &&
            (equipment.status === 'REPAIR' || equipment.status === 'OUT_OF_SERVICE')) {
            return `Cet équipement ne peut pas être mis en maintenance (statut actuel: ${equipment.status})`;
        }

        if (typeSelected === PlanType.REPAIR && equipment.status === 'OUT_OF_SERVICE') {
            return `Cet équipement ne peut pas être réparé (statut actuel: ${equipment.status})`;
        }

        // Check for activities - handle both "activities" and "allActivities" properties
        const activities = equipment.activities || equipment.allActivities || [];

        if (activities.length > 0) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);

            const conflict = activities.find((activity: any) => {
                if (activity.status === 'CANCELLED') return false;

                const activityStart = new Date(activity.startDate);
                const activityEnd = new Date(activity.endDate || activity.startDate);

                return (activityStart <= endDate && activityEnd >= startDate);
            });

            if (conflict) {
                const activityStart = new Date(conflict.startDate);
                const activityEnd = new Date(conflict.endDate || conflict.startDate);
                const activityType = conflict.type === 'placement' ? 'placement' :
                    conflict.type === 'maintenance' ? 'maintenance' :
                        conflict.type === 'repair' ? 'réparation' : 'opération';

                return `Conflit avec une activité de ${activityType} du ${activityStart.toLocaleDateString()} au ${activityEnd ? activityEnd.toLocaleDateString() : 'date indéterminée'
                    }`;
            }
        }

        return '';
    };

    const renderEquipmentDropdown = () => (
        <>
            <label className={labelClass}>Équipement</label>
            <div className="relative">
                <select
                    className={inputClass}
                    value={form.equipmentId}
                    onChange={e => handleChange('equipmentId', e.target.value)}
                    disabled={equipmentLoading}
                >
                    <option value="">{equipmentLoading ? 'Chargement des équipements...' : 'Sélectionner un équipement'}</option>
                    {Array.isArray(equipmentList) && equipmentList.length > 0 ? (
                        equipmentList.map((eq: any) => {
                            // Check if equipment is available based on our conflict detection
                            const hasConflict = equipmentConflicts[eq._id];
                            const statusIndicator = !hasConflict ?
                                '✓ Disponible' :
                                '⚠ Non disponible';

                            return (
                                <option
                                    key={eq._id}
                                    value={eq._id}
                                >
                                    {eq.nom} ({eq.reference || eq.matricule || 'No Ref'}) - {statusIndicator}
                                </option>
                            );
                        })
                    ) : (
                        <option value="" disabled>Aucun équipement trouvé</option>
                    )}
                </select>
            </div>

            {/* Only show this message when equipment list is loaded but empty */}
            {Array.isArray(equipmentList) && equipmentList.length === 0 && !equipmentLoading && (
                <div className="mt-1 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <p>Aucun équipement n'est disponible. Veuillez d'abord ajouter des équipements.</p>
                </div>
            )}

            {/* Show loading indicator */}
            {equipmentLoading && (
                <div className="mt-1 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <p>Chargement des équipements...</p>
                </div>
            )}

            {form.equipmentId && (
                <div className="mt-1">
                    {equipmentConflicts[form.equipmentId] ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                            <div className="flex items-start gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-800">Équipement non disponible</p>
                                    <p className="text-amber-700 mt-1">{equipmentConflicts[form.equipmentId]}</p>

                                    {nextAvailableDates[form.equipmentId] && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <ClockIcon className="h-4 w-4 text-amber-600" />
                                            <p className="text-amber-700">
                                                Disponible à partir du:
                                                <button
                                                    className="ml-2 text-blue-600 hover:text-blue-800 font-medium underline"
                                                    onClick={() => {
                                                        const nextDate = nextAvailableDates[form.equipmentId];
                                                        if (nextDate) {
                                                            const nextStart = new Date(nextDate);
                                                            const nextEnd = new Date(nextStart);
                                                            nextEnd.setDate(nextStart.getDate() + 7);

                                                            setForm({
                                                                ...form,
                                                                startDate: nextDate,
                                                                endDate: nextEnd.toISOString().split('T')[0]
                                                            });
                                                            setDateRangeSelected(true);
                                                            hasCheckedAvailabilityRef.current = false;
                                                        }
                                                    }}
                                                >
                                                    {new Date(nextAvailableDates[form.equipmentId]).toLocaleDateString()}
                                                </button>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                <p className="font-medium text-green-800">Équipement disponible pour cette période</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );

    const steps = [
        <div key="step1" className="flex flex-col gap-4">
            <label className={labelClass}>Titre</label>
            <input
                className={inputClass}
                placeholder="Entrer le titre de la planification"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
            />
            <label className={labelClass}>Description</label>
            <textarea
                className={inputClass + ' resize-none min-h-[60px]'}
                placeholder="Description de l'activité"
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
            />
            <label className={labelClass}>Type d'activité</label>
            <select
                className={inputClass}
                value={form.type}
                onChange={e => handleChange('type', e.target.value)}
            >
                {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>,
        <div key="step2" className="flex flex-col gap-4">
            <label className={labelClass}>Date de début</label>
            <input
                className={inputClass}
                type="date"
                placeholder="Date de début"
                value={form.startDate}
                onChange={e => handleChange('startDate', e.target.value)}
            />
            <label className={labelClass}>Date de fin</label>
            <input
                className={inputClass}
                type="date"
                placeholder="Date de fin"
                value={form.endDate}
                onChange={e => handleChange('endDate', e.target.value)}
            />
            <label className={labelClass}>Lieu</label>
            <input
                className={inputClass}
                placeholder="Lieu de l'activité"
                value={form.location}
                onChange={e => handleChange('location', e.target.value)}
            />
        </div>,
        <div key="step3" className="flex flex-col gap-4">
            {renderEquipmentDropdown()}
            <label className={labelClass}>Responsable</label>
            <input
                className={inputClass}
                placeholder="Responsable de l'activité"
                value={form.responsiblePerson}
                onChange={e => handleChange('responsiblePerson', e.target.value)}
            />
            <label className={labelClass}>Remarques</label>
            <textarea
                className={inputClass + ' resize-none min-h-[60px]'}
                placeholder="Remarques supplémentaires (optionnel)"
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
            />
        </div>
    ];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 40 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-2 p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto border border-blue-100"
                    >
                        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl transition-all">✕</button>
                        <div className="flex items-center gap-4 mb-4">
                            {[0, 1, 2].map((s) => (
                                <div
                                    key={s}
                                    className={`flex-1 h-2 rounded-full transition-all ${step >= s ? 'bg-blue-500' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>
                        <div className="text-2xl font-bold text-gray-800 mb-2 text-center">{plan ? 'Modifier la planification' : 'Nouvelle planification'}</div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {steps[step]}

                        <div className="flex justify-between mt-4">
                            <button
                                className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-all shadow-sm"
                                onClick={() => step > 0 ? setStep(step - 1) : handleClose()}
                            >
                                {step === 0 ? 'Annuler' : 'Retour'}
                            </button>
                            {step < steps.length - 1 ? (
                                <button
                                    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md"
                                    onClick={() => setStep(step + 1)}
                                >
                                    Suivant
                                </button>
                            ) : (
                                <button
                                    className="px-5 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-all shadow-md"
                                    onClick={handleFinalSave}
                                >
                                    {plan ? 'Mettre à jour' : 'Créer'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Tailwind input class
// Add this to your global CSS or use inline: className="input ..."
// .input { @apply px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none bg-white text-gray-700 text-base shadow-sm transition; } 