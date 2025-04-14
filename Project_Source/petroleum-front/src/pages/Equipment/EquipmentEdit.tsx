import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';

const EquipmentEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    return (
        <>
            <PageMeta
                title="Modifier un équipement"
                description="Formulaire de modification d'équipement"
            />
            <PageBreadcrumb pageTitle="Modifier un équipement" />

            <div className="container mx-auto px-4 py-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                        Modifier l'équipement ID: {id}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        La page de modification d'équipement est en cours de développement.
                    </p>
                    <button
                        onClick={() => navigate(`/equipments/${id}`)}
                        className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]"
                    >
                        Retour aux détails
                    </button>
                </div>
            </div>
        </>
    );
};

export default EquipmentEdit; 