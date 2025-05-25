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
    { label: 'Placement', value: 'placement' },
    { label: 'Maintenance', value: 'maintenance' },
];

const inputClass =
    'w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 outline-none bg-white text-gray-700 text-base shadow-sm transition placeholder-gray-400 mb-2';
const labelClass = 'text-sm font-medium text-gray-700 mb-1';

export default function PlanModal({ open, onClose, onSave, plan }: PlanModalProps) {
    const dispatch = useAppDispatch();
    const equipmentList = useSelector((state: any) => state.equipment.equipment);
    const equipmentLoading = useSelector((state: any) => state.equipment.loading);
    const userId = useSelector((state: any) => state.auth.user?._id);
    const [step, setStep] = useState(0);
    const initialForm: Plan = {
        title: '',
        description: '',
        type: 'placement',
        equipment: '',
        responsible: '',
        route: [''],
        startDate: '',
        endDate: '',
        notes: '',
    };
    const [form, setForm] = useState<Plan>(
        plan || initialForm
    );

    useEffect(() => {
        if (open && equipmentList.length === 0 && !equipmentLoading) {
            dispatch(fetchEquipment());
        }
    }, [open, equipmentList.length, equipmentLoading, dispatch]);

    useEffect(() => {
        if (plan) {
            setForm({
                ...initialForm,
                ...plan,
                startDate: plan.startDate ? plan.startDate.slice(0, 10) : '',
                endDate: plan.endDate ? plan.endDate.slice(0, 10) : '',
                equipment: typeof plan.equipment === 'object' && plan.equipment !== null
                    ? (plan.equipment as any)._id || ''
                    : plan.equipment || '',
                route: Array.isArray(plan.route) ? plan.route : [''],
            });
        } else {
            setForm(initialForm);
        }
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

    const handleClose = () => {
        setForm(initialForm);
        setStep(0);
        onClose();
    };

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
        setForm(initialForm);
        setStep(0);
    };

    const steps = [
        // Step 1
        <div key="step1" className="flex flex-col gap-4">
            <label className={labelClass}>Title</label>
            <input
                className={inputClass}
                placeholder="Enter plan title"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
            />
            <label className={labelClass}>Description</label>
            <textarea
                className={inputClass + ' resize-none min-h-[60px]'}
                placeholder="Describe the plan"
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
            />
            <label className={labelClass}>Type</label>
            <select
                className={inputClass}
                value={form.type}
                onChange={e => handleChange('type', e.target.value)}
            >
                {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>,
        // Step 2
        <div key="step2" className="flex flex-col gap-4">
            <label className={labelClass}>Equipment</label>
            <select
                className={inputClass}
                value={form.equipment}
                onChange={e => handleChange('equipment', e.target.value)}
            >
                <option value="">{equipmentLoading ? 'Loading equipment...' : 'Select Equipment'}</option>
                {equipmentList.map((eq: any) => (
                    <option key={eq._id} value={eq._id}>{eq.nom}</option>
                ))}
            </select>
            <label className={labelClass}>Responsible</label>
            <input
                className={inputClass}
                placeholder="Responsible person"
                value={form.responsible}
                onChange={e => handleChange('responsible', e.target.value)}
            />
            <label className={labelClass}>Mobilization Route</label>
            <div className="flex flex-col gap-2">
                {form.route.map((stop, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <input
                            className={inputClass + ' flex-1'}
                            placeholder={`Stop ${idx + 1}`}
                            value={stop}
                            onChange={e => handleRouteChange(idx, e.target.value)}
                        />
                        {form.route.length > 1 && (
                            <button type="button" className="text-red-500 hover:text-red-700 text-lg font-bold" onClick={() => removeRouteStop(idx)}>
                                ✕
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" className="text-blue-600 text-xs mt-1 hover:underline" onClick={addRouteStop}>+ Add Stop</button>
            </div>
        </div>,
        // Step 3
        <div key="step3" className="flex flex-col gap-4">
            <label className={labelClass}>Start Date</label>
            <input
                className={inputClass}
                type="date"
                placeholder="Start Date"
                value={form.startDate}
                onChange={e => handleChange('startDate', e.target.value)}
            />
            <label className={labelClass}>End Date</label>
            <input
                className={inputClass}
                type="date"
                placeholder="End Date"
                value={form.endDate}
                onChange={e => handleChange('endDate', e.target.value)}
            />
            <label className={labelClass}>Additional Notes</label>
            <textarea
                className={inputClass + ' resize-none min-h-[60px]'}
                placeholder="Any additional notes (optional)"
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
                        <div className="text-2xl font-bold text-gray-800 mb-2 text-center">{plan ? 'Edit Plan' : 'Add New Plan'}</div>
                        {steps[step]}
                        <div className="flex justify-between mt-4">
                            <button
                                className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-all shadow-sm"
                                onClick={() => step > 0 ? setStep(step - 1) : handleClose()}
                            >
                                {step === 0 ? 'Cancel' : 'Back'}
                            </button>
                            {step < steps.length - 1 ? (
                                <button
                                    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md"
                                    onClick={() => setStep(step + 1)}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    className="px-5 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-all shadow-md"
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