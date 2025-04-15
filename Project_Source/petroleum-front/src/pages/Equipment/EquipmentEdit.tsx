import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchEquipmentById, updateEquipment } from '../../store/slices/equipmentSlice';
import { equipmentStatusLabels, Equipment } from '../../types/equipment';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { toast, ToastContainer } from 'react-toastify';

interface FormErrors {
    nom?: string;
    reference?: string;
    matricule?: string;
    dimensions?: {
        height?: string;
        width?: string;
        length?: string;
        weight?: string;
    };
    operatingConditions?: {
        temperature?: string;
        pressure?: string;
    };
    location?: string;
    status?: string;
}

type EquipmentStatus = 'disponible' | 'disponible_needs_repair' | 'on_repair' | 'disponible_bon_etat' | 'working_non_disponible';

const EquipmentEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { selectedEquipment, loading, error } = useSelector((state: RootState) => state.equipment);

    // Form state
    const [formData, setFormData] = useState({
        nom: '',
        reference: '',
        matricule: '',
        dimensions: {
            height: '',
            width: '',
            length: '',
            weight: '',
        },
        operatingConditions: {
            temperature: '',
            pressure: '',
        },
        location: '',
        status: 'disponible' as EquipmentStatus
    });

    // Load equipment data
    useEffect(() => {
        if (id) {
            dispatch(fetchEquipmentById(id))
                .unwrap()
                .catch(err => {
                    toast.error(`Erreur: ${err}`);
                });
        }
    }, [dispatch, id]);

    // Populate form when equipment data is loaded
    useEffect(() => {
        if (selectedEquipment) {
            setFormData({
                nom: selectedEquipment.nom,
                reference: selectedEquipment.reference,
                matricule: selectedEquipment.matricule,
                dimensions: {
                    height: selectedEquipment.dimensions.height.toString(),
                    width: selectedEquipment.dimensions.width.toString(),
                    length: selectedEquipment.dimensions.length.toString(),
                    weight: selectedEquipment.dimensions.weight.toString(),
                },
                operatingConditions: {
                    temperature: selectedEquipment.operatingConditions.temperature,
                    pressure: selectedEquipment.operatingConditions.pressure,
                },
                location: selectedEquipment.location,
                status: selectedEquipment.status
            });
        }
    }, [selectedEquipment]);

    // Validation errors
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle API errors
    useEffect(() => {
        if (error && isSubmitting) {
            toast.error(`Erreur: ${error}`);
            setIsSubmitting(false);
        }
    }, [error, isSubmitting]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');

            if (parent === 'dimensions') {
                setFormData(prev => ({
                    ...prev,
                    dimensions: {
                        ...prev.dimensions,
                        [child]: value
                    }
                }));
            } else if (parent === 'operatingConditions') {
                setFormData(prev => ({
                    ...prev,
                    operatingConditions: {
                        ...prev.operatingConditions,
                        [child]: value
                    }
                }));
            }
        } else if (name === 'status') {
            setFormData(prev => ({
                ...prev,
                status: value as EquipmentStatus
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};

        // Validate required fields
        if (!formData.nom) newErrors.nom = 'Le nom est requis';
        if (!formData.reference) newErrors.reference = 'La référence est requise';
        if (!formData.matricule) newErrors.matricule = 'Le matricule est requis';
        if (!formData.location) newErrors.location = 'L\'emplacement est requis';

        // Validate dimensions
        const dimensionsErrors: {
            height?: string;
            width?: string;
            length?: string;
            weight?: string;
        } = {};

        if (!formData.dimensions.height) dimensionsErrors.height = 'La hauteur est requise';
        else if (isNaN(Number(formData.dimensions.height)) || Number(formData.dimensions.height) <= 0)
            dimensionsErrors.height = 'La hauteur doit être un nombre positif';

        if (!formData.dimensions.width) dimensionsErrors.width = 'La largeur est requise';
        else if (isNaN(Number(formData.dimensions.width)) || Number(formData.dimensions.width) <= 0)
            dimensionsErrors.width = 'La largeur doit être un nombre positif';

        if (!formData.dimensions.length) dimensionsErrors.length = 'La longueur est requise';
        else if (isNaN(Number(formData.dimensions.length)) || Number(formData.dimensions.length) <= 0)
            dimensionsErrors.length = 'La longueur doit être un nombre positif';

        if (!formData.dimensions.weight) dimensionsErrors.weight = 'Le poids est requis';
        else if (isNaN(Number(formData.dimensions.weight)) || Number(formData.dimensions.weight) <= 0)
            dimensionsErrors.weight = 'Le poids doit être un nombre positif';

        if (Object.keys(dimensionsErrors).length > 0) {
            newErrors.dimensions = dimensionsErrors;
        }

        // Validate operating conditions
        const operatingErrors: {
            temperature?: string;
            pressure?: string;
        } = {};

        if (!formData.operatingConditions.temperature) operatingErrors.temperature = 'La température est requise';
        if (!formData.operatingConditions.pressure) operatingErrors.pressure = 'La pression est requise';

        if (Object.keys(operatingErrors).length > 0) {
            newErrors.operatingConditions = operatingErrors;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!id) {
            toast.error('ID d\'équipement manquant');
            return;
        }

        if (validateForm()) {
            setIsSubmitting(true);

            // Convert numeric fields to numbers
            const height = Number(formData.dimensions.height);
            const width = Number(formData.dimensions.width);
            const length = Number(formData.dimensions.length);

            // Calculate volume in cubic meters
            const volume = (height * width * length) / 1000000;

            // Create processed data without using spread operator
            const processedData = {
                nom: formData.nom,
                reference: formData.reference,
                matricule: formData.matricule,
                dimensions: {
                    height,
                    width,
                    length,
                    weight: Number(formData.dimensions.weight),
                    volume
                },
                operatingConditions: {
                    temperature: formData.operatingConditions.temperature,
                    pressure: formData.operatingConditions.pressure
                },
                location: formData.location,
                status: formData.status
            };

            try {
                await dispatch(updateEquipment({ id, data: processedData })).unwrap();
                toast.success('Équipement mis à jour avec succès!');
                // Redirect to equipment detail page after successful update
                setTimeout(() => {
                    navigate(`/equipments/${id}`);
                }, 2000);
            } catch (err) {
                // Error is handled by the useEffect above
                setIsSubmitting(false);
            }
        }
    };

    if (loading && !selectedEquipment) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
        );
    }

    if (error && !selectedEquipment) {
        return (
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        Erreur lors du chargement de l'équipement
                    </h1>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/equipments')}
                        className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]"
                    >
                        Retour à la liste
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageMeta
                title="Modifier un équipement"
                description="Formulaire de modification d'équipement"
            />
            <PageBreadcrumb pageTitle="Modifier un équipement" />

            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <div className="container mx-auto px-4 py-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                        Modifier l'équipement: {formData.nom}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nom de l'équipement <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    className={`w-full rounded-md border ${errors.nom ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                />
                                {errors.nom && <p className="mt-1 text-sm text-red-500">{errors.nom}</p>}
                            </div>

                            <div>
                                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Référence <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="reference"
                                    name="reference"
                                    value={formData.reference}
                                    onChange={handleChange}
                                    className={`w-full rounded-md border ${errors.reference ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                />
                                {errors.reference && <p className="mt-1 text-sm text-red-500">{errors.reference}</p>}
                            </div>

                            <div>
                                <label htmlFor="matricule" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Matricule <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="matricule"
                                    name="matricule"
                                    value={formData.matricule}
                                    onChange={handleChange}
                                    className={`w-full rounded-md border ${errors.matricule ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                />
                                {errors.matricule && <p className="mt-1 text-sm text-red-500">{errors.matricule}</p>}
                            </div>

                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Emplacement <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className={`w-full rounded-md border ${errors.location ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                    placeholder="ex: Zone A - Unité de production"
                                />
                                {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
                            </div>
                        </div>

                        {/* Dimensions */}
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Dimensions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label htmlFor="dimensions.height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Hauteur (cm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="dimensions.height"
                                        name="dimensions.height"
                                        value={formData.dimensions.height}
                                        onChange={handleChange}
                                        className={`w-full rounded-md border ${errors.dimensions?.height ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                        min="0"
                                        step="0.1"
                                    />
                                    {errors.dimensions?.height && <p className="mt-1 text-sm text-red-500">{errors.dimensions.height}</p>}
                                </div>

                                <div>
                                    <label htmlFor="dimensions.width" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Largeur (cm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="dimensions.width"
                                        name="dimensions.width"
                                        value={formData.dimensions.width}
                                        onChange={handleChange}
                                        className={`w-full rounded-md border ${errors.dimensions?.width ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                        min="0"
                                        step="0.1"
                                    />
                                    {errors.dimensions?.width && <p className="mt-1 text-sm text-red-500">{errors.dimensions.width}</p>}
                                </div>

                                <div>
                                    <label htmlFor="dimensions.length" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Longueur (cm) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="dimensions.length"
                                        name="dimensions.length"
                                        value={formData.dimensions.length}
                                        onChange={handleChange}
                                        className={`w-full rounded-md border ${errors.dimensions?.length ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                        min="0"
                                        step="0.1"
                                    />
                                    {errors.dimensions?.length && <p className="mt-1 text-sm text-red-500">{errors.dimensions.length}</p>}
                                </div>

                                <div>
                                    <label htmlFor="dimensions.weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Poids (kg) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="dimensions.weight"
                                        name="dimensions.weight"
                                        value={formData.dimensions.weight}
                                        onChange={handleChange}
                                        className={`w-full rounded-md border ${errors.dimensions?.weight ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                        min="0"
                                        step="0.1"
                                    />
                                    {errors.dimensions?.weight && <p className="mt-1 text-sm text-red-500">{errors.dimensions.weight}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Operating Conditions */}
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Conditions de fonctionnement</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="operatingConditions.temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Température <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="operatingConditions.temperature"
                                        name="operatingConditions.temperature"
                                        value={formData.operatingConditions.temperature}
                                        onChange={handleChange}
                                        className={`w-full rounded-md border ${errors.operatingConditions?.temperature ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                        placeholder="ex: -10°C à +50°C"
                                    />
                                    {errors.operatingConditions?.temperature && <p className="mt-1 text-sm text-red-500">{errors.operatingConditions.temperature}</p>}
                                </div>

                                <div>
                                    <label htmlFor="operatingConditions.pressure" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Pression <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="operatingConditions.pressure"
                                        name="operatingConditions.pressure"
                                        value={formData.operatingConditions.pressure}
                                        onChange={handleChange}
                                        className={`w-full rounded-md border ${errors.operatingConditions?.pressure ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white`}
                                        placeholder="ex: Max 25 bars"
                                    />
                                    {errors.operatingConditions?.pressure && <p className="mt-1 text-sm text-red-500">{errors.operatingConditions.pressure}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Statut
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F28C38] dark:bg-gray-700 dark:text-white"
                            >
                                {Object.entries(equipmentStatusLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate(`/equipments/${id}`)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading || isSubmitting}
                                className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38] disabled:opacity-50"
                            >
                                {loading || isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default EquipmentEdit; 