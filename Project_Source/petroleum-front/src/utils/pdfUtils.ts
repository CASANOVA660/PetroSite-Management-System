import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Project, RequirementType } from '../store/slices/projectSlice';

// Define interfaces for document and employee
interface ProjectDocument {
    _id?: string;
    id?: string;
    name: string;
    filename?: string;
    originalname?: string;
    description?: string;
    dossierType?: string;
    fileUrl?: string;
    path?: string;
    uploadDate?: string;
    uploadedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    projectId?: string;
}

interface ProjectEmployee {
    _id?: string;
    id?: string;
    name?: string;
    nom?: string;
    prenom?: string;
    role?: string;
    poste?: string;
    specialization?: string;
    certifications?: string[];
    status?: string;
    email?: string;
    phone?: string;
    matricule?: string;
    dateEmbauche?: string;
}

// Extend Project interface to include documents and employees
interface ExtendedProject extends Project {
    documents?: ProjectDocument[];
    employees?: ProjectEmployee[];
}

/**
 * Generates a PDF document containing project details
 * @param project The project data to include in the PDF
 */
export const generateProjectPDF = async (project: Project) => {
    const extendedProject = project as ExtendedProject;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(242, 140, 56); // #F28C38 color
    pdf.text('DÉTAILS DU PROJET', pageWidth / 2, 20, { align: 'center' });

    // Add project name
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(extendedProject.name, pageWidth / 2, 30, { align: 'center' });

    // Add project number
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Numéro de projet: ${extendedProject.projectNumber}`, pageWidth / 2, 38, { align: 'center' });

    // Add horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 45, pageWidth - 20, 45);

    // Basic project information
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Informations générales', 20, 55);

    pdf.setFontSize(11);
    pdf.text(`Client: ${extendedProject.clientName}`, 25, 65);
    pdf.text(`Date de début: ${new Date(extendedProject.startDate).toLocaleDateString()}`, 25, 72);
    pdf.text(`Date de fin: ${new Date(extendedProject.endDate).toLocaleDateString()}`, 25, 79);
    pdf.text(`Statut: ${extendedProject.status}`, 25, 86);

    let currentY = 93;

    if (extendedProject.statusNote) {
        pdf.text('Note de statut:', 25, currentY);

        // Handle long status notes by wrapping text
        const splitStatusNote = pdf.splitTextToSize(extendedProject.statusNote, pageWidth - 50);
        pdf.text(splitStatusNote, 30, currentY + 7);

        currentY += (splitStatusNote.length * 7) + 10;
    }

    // Description section
    pdf.setFontSize(14);
    pdf.text('Description', 20, currentY);

    pdf.setFontSize(11);
    const splitDescription = pdf.splitTextToSize(extendedProject.description || 'Aucune description disponible', pageWidth - 50);
    pdf.text(splitDescription, 25, currentY + 10);

    currentY += (splitDescription.length * 7) + 20;

    // Created by section
    pdf.setFontSize(11);
    pdf.text(`Créé par: ${extendedProject.createdBy?.prenom || ''} ${extendedProject.createdBy?.nom || ''}`, 25, currentY);
    pdf.text(`Date de création: ${new Date(extendedProject.creationDate).toLocaleDateString()}`, 25, currentY + 7);

    currentY += 20;

    // Check if we need to add a new page
    if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
    }

    // Documents section - if available
    if (extendedProject.documents && extendedProject.documents.length > 0) {
        pdf.setFontSize(14);
        pdf.text('Documents du projet', 20, currentY);
        currentY += 10;

        // Group documents by dossier type
        const documentsByDossier: Record<string, ProjectDocument[]> = {
            'global': [],
            'administratif': [],
            'technique': [],
            'rh': [],
            'hse': []
        };

        extendedProject.documents.forEach(doc => {
            if (doc.dossierType && documentsByDossier[doc.dossierType]) {
                documentsByDossier[doc.dossierType].push(doc);
            } else {
                documentsByDossier['global'].push(doc);
            }
        });

        // Add each document group
        Object.entries(documentsByDossier).forEach(([dossier, docs]) => {
            if (docs.length === 0) return;

            // Check if we need to add a new page
            if (currentY > 250) {
                pdf.addPage();
                currentY = 20;
            }

            // Add dossier header
            pdf.setFontSize(12);
            pdf.setTextColor(80, 80, 80);
            pdf.text(`${getDossierLabel(dossier)}:`, 25, currentY);
            currentY += 7;

            // Add each document in this dossier
            docs.forEach((doc, index) => {
                // Check if we need to add a new page
                if (currentY > 270) {
                    pdf.addPage();
                    currentY = 20;
                }

                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                // Use name, filename, or originalname depending on what's available
                const docName = doc.name || doc.originalname || doc.filename || 'Document sans nom';
                pdf.text(`${index + 1}. ${docName}`, 30, currentY);

                if (doc.description) {
                    const splitDocDesc = pdf.splitTextToSize(`   Description: ${doc.description}`, pageWidth - 60);
                    pdf.text(splitDocDesc, 30, currentY + 5);
                    currentY += (splitDocDesc.length * 5) + 7;
                } else {
                    currentY += 7;
                }
            });

            currentY += 5;
        });
    }

    // Employees section - if available
    if (extendedProject.employees && extendedProject.employees.length > 0) {
        // Check if we need to add a new page
        if (currentY > 220) {
            pdf.addPage();
            currentY = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Personnel du projet', 20, currentY);
        currentY += 10;

        pdf.setFontSize(11);
        extendedProject.employees.forEach((employee, index) => {
            // Check if we need to add a new page
            if (currentY > 250) {
                pdf.addPage();
                currentY = 20;
            }

            pdf.setTextColor(0, 0, 0);
            // Construct employee name from available fields
            let employeeName = 'Employé sans nom';
            if (employee.name) {
                employeeName = employee.name;
            } else if (employee.prenom || employee.nom) {
                employeeName = `${employee.prenom || ''} ${employee.nom || ''}`.trim();
            }

            pdf.text(`${index + 1}. ${employeeName}`, 25, currentY);
            currentY += 7;

            // Display role or poste
            const role = employee.role || employee.poste;
            if (role) {
                pdf.setTextColor(80, 80, 80);
                pdf.text(`   Rôle: ${role}`, 30, currentY);
                currentY += 7;
            }

            if (employee.specialization) {
                pdf.text(`   Spécialisation: ${employee.specialization}`, 30, currentY);
                currentY += 7;
            }

            if (employee.matricule) {
                pdf.text(`   Matricule: ${employee.matricule}`, 30, currentY);
                currentY += 7;
            }

            if (employee.email) {
                pdf.text(`   Email: ${employee.email}`, 30, currentY);
                currentY += 7;
            }

            if (employee.phone) {
                pdf.text(`   Téléphone: ${employee.phone}`, 30, currentY);
                currentY += 7;
            }

            if (employee.certifications && employee.certifications.length > 0) {
                pdf.text(`   Certifications: ${employee.certifications.join(', ')}`, 30, currentY);
                currentY += 7;
            }

            currentY += 3; // Add some space between employees
        });
    }

    // Requirements section if available
    if (extendedProject.requirements && extendedProject.requirements.length > 0) {
        // Check if we need to add a new page
        if (currentY > 220) {
            pdf.addPage();
            currentY = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Exigences du projet', 20, currentY);
        currentY += 10;

        // Group requirements by type
        const requirementsByType: Record<string, any[]> = {};

        extendedProject.requirements.forEach(req => {
            if (!requirementsByType[req.type]) {
                requirementsByType[req.type] = [];
            }
            requirementsByType[req.type].push(req);
        });

        // Add each requirement group
        Object.entries(requirementsByType).forEach(([type, reqs], typeIndex) => {
            // Check if we need to add a new page
            if (currentY > 250) {
                pdf.addPage();
                currentY = 20;
            }

            // Add requirement type header
            pdf.setFontSize(12);
            pdf.setTextColor(80, 80, 80);
            pdf.text(`${getRequirementTypeLabel(type as RequirementType)}:`, 25, currentY);
            currentY += 7;

            // Add each requirement in this type
            reqs.forEach((req, reqIndex) => {
                // Check if we need to add a new page
                if (currentY > 270) {
                    pdf.addPage();
                    currentY = 20;
                }

                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);

                // Split long requirement content
                const splitContent = pdf.splitTextToSize(`${reqIndex + 1}. ${req.content}`, pageWidth - 60);
                pdf.text(splitContent, 30, currentY);

                currentY += (splitContent.length * 6) + 4;
            });

            currentY += 5;
        });
    }

    // Equipment section if available
    if (extendedProject.equipment && extendedProject.equipment.length > 0) {
        // Check if we need to add a new page
        if (currentY > 250) {
            pdf.addPage();
            currentY = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Équipements', 20, currentY);
        currentY += 10;

        pdf.setFontSize(11);
        extendedProject.equipment.forEach((equipment, index) => {
            // Check if we need to add a new page
            if (currentY > 270) {
                pdf.addPage();
                currentY = 20;
            }

            pdf.text(`• Équipement ${index + 1}: ${equipment.equipmentId}`, 25, currentY);

            if (equipment.needsValidation) {
                pdf.text(`  - Validation requise: ${equipment.validationReason || 'Non spécifiée'}`, 30, currentY + 7);
                currentY += 14;
            } else {
                currentY += 7;
            }
        });
    }

    // Add footer with date on each page
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Document généré le ${new Date().toLocaleString()} - Page ${i}/${pageCount}`, pageWidth - 20, 285, { align: 'right' });
    }

    // Save the PDF
    pdf.save(`Projet_${extendedProject.projectNumber}_${extendedProject.name.replace(/\s+/g, '_')}.pdf`);
};

/**
 * Helper function to get a human-readable label for requirement types
 */
function getRequirementTypeLabel(type: RequirementType): string {
    switch (type) {
        case RequirementType.REGULATORY:
            return 'Exigences réglementaires';
        case RequirementType.TECHNICAL:
            return 'Exigences techniques';
        case RequirementType.BUSINESS:
            return 'Exigences métier';
        case RequirementType.ENVIRONMENTAL:
            return 'Exigences environnementales';
        case RequirementType.SAFETY:
            return 'Exigences de sécurité';
        case RequirementType.OTHER:
            return 'Autres exigences';
        default:
            return 'Exigences';
    }
}

/**
 * Helper function to get a human-readable label for dossier types
 */
function getDossierLabel(dossier: string): string {
    switch (dossier) {
        case 'global':
            return 'Documents globaux';
        case 'administratif':
            return 'Dossier administratif';
        case 'technique':
            return 'Dossier technique';
        case 'rh':
            return 'Dossier RH';
        case 'hse':
            return 'Dossier HSE';
        default:
            return 'Autres documents';
    }
} 