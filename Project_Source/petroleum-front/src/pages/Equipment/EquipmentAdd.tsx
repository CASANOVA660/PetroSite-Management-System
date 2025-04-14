import React from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';

const EquipmentAdd: React.FC = () => {
    return (
        <>
            <PageMeta
                title="Ajouter un équipement"
                description="Formulaire d'ajout d'équipement"
            />
            <PageBreadcrumb pageTitle="Ajouter un équipement" />

            <div className="container mx-auto px-4 py-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                        Formulaire d'ajout d'équipement
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        La page d'ajout d'équipement est en cours de développement.
                    </p>
                </div>
            </div>
        </>
    );
};

export default EquipmentAdd; 