import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store';
import { fetchEquipment } from '../../store/slices/equipmentSlice';
import { motion, AnimatePresence } from 'framer-motion';

interface Plan {
    _id?: string;
    title: string;
    description: string;
    type: 'placement' | 'maintenance';
    equipment: string; // equipment id
    responsible: string;
    route: string[];
    startDate: string;
    endDate: string;
    notes?: string;
}

interface PlanModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (plan: Plan) => void;
    plan?: Plan;
}

const typeOptions = [
    { label: 'Mobilization', value: 'placement' },
    { label: 'Maintenance', value: 'maintenance' },
];

export default function PlanModal({ open, onClose, onSave, plan }: PlanModalProps) {
    const dispatch = useAppDispatch();
    const equipmentList = useSelector((state: any) => state.equipment.equipment);
    const equipmentLoading = useSelector((state: any) => state.equipment.loading);
    const userId = useSelector((state: any) => state.auth.user?._id);
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<Plan>(
        plan || {
            title: '',
            description: '',
            type: 'placement',
            equipment: '',
            responsible: '',
            route: [''],
            startDate: '',
            endDate: '',
            notes: '',
        }
    );

    useEffect(() => {
        if (open && equipmentList.length === 0 && !equipmentLoading) {
            dispatch(fetchEquipment());
        }
    }, [open, equipmentList.length, equipmentLoading, dispatch]);

    useEffect(() => {
        if (plan) setForm(plan);
        else setForm({
            title: '',
            description: '',
            type: 'placement',
            equipment: '',
            responsible: '',
            route: [''],
            startDate: '',
            endDate: '',
            notes: '',
        });
    }, [plan, open]);

    const handleChange = (field: keyof Plan, value: any) => {
        setForm(f => ({ ...f, [field]: value }));
    };

    const handleRouteChange = (idx: number, value: string) => {
        const newRoute = [...form.route];
        newRoute[idx] = value;
        setForm(f => ({ ...f, route: newRoute }));
    };

    const addRouteStop = () => setForm(f => ({ ...f, route: [...f.route, ''] }));

    const removeRouteStop = (idx: number) => setForm(f => ({ ...f, route: f.route.filter((_, i) => i !== idx) }));

    const handleFinalSave = () => {
        if (!form.title || !form.type || !form.equipment || !form.responsible || !form.startDate || !form.endDate) {
            alert('Please fill all required fields.');
            return;
        }
        const planToSave = {
            ...form,
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            createdBy: userId,
        };
        onSave(planToSave);
    };

    const steps = [
        // Step 1
        <div key="step1" className="flex flex-col gap-4">
            <input
                className="input"
                placeholder="Title"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
            />
            <textarea
                className="input"
                placeholder="Description"
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
            />
            <select
                className="input"
                value={form.type}
                onChange={e => handleChange('type', e.target.value)}
            >
                {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>,
        // Step 2
        <div key="step2" className="flex flex-col gap-4">
            <select
                className="input"
                value={form.equipment}
                onChange={e => handleChange('equipment', e.target.value)}
            >
                <option value="">{equipmentLoading ? 'Loading equipment...' : 'Select Equipment'}</option>
                {equipmentList.map((eq: any) => (
                    <option key={eq._id} value={eq._id}>{eq.nom}</option>
                ))}
            </select>
            <input
                className="input"
                placeholder="Responsible"
                value={form.responsible}
                onChange={e => handleChange('responsible', e.target.value)}
            />
            <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Mobilization Route</label>
                {form.route.map((stop, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <input
                            className="input flex-1"
                            placeholder={`Stop ${idx + 1}`}
                            value={stop}
                            onChange={e => handleRouteChange(idx, e.target.value)}
                        />
                        {form.route.length > 1 && (
                            <button type="button" className="text-red-500" onClick={() => removeRouteStop(idx)}>✕</button>
                        )}
                    </div>
                ))}
                <button type="button" className="text-blue-600 text-xs mt-1" onClick={addRouteStop}>+ Add Stop</button>
            </div>
        </div>,
        // Step 3
        <div key="step3" className="flex flex-col gap-4">
            <input
                className="input"
                type="date"
                placeholder="Start Date"
                value={form.startDate}
                onChange={e => handleChange('startDate', e.target.value)}
            />
            <input
                className="input"
                type="date"
                placeholder="End Date"
                value={form.endDate}
                onChange={e => handleChange('endDate', e.target.value)}
            />
            <textarea
                className="input"
                placeholder="Additional Notes (optional)"
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
            />
        </div>
    ];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 40 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-2 p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl">✕</button>
                        <div className="text-xl font-semibold text-gray-800 mb-2">{plan ? 'Edit Plan' : 'Add New Plan'}</div>
                        {steps[step]}
                        <div className="flex justify-between mt-4">
                            <button
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200"
                                onClick={() => step > 0 ? setStep(step - 1) : onClose()}
                            >
                                {step === 0 ? 'Cancel' : 'Back'}
                            </button>
                            {step < steps.length - 1 ? (
                                <button
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                                    onClick={() => setStep(step + 1)}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                                    onClick={handleFinalSave}
                                >
                                    Save
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