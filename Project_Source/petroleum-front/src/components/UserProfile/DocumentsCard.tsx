import { useState } from 'react';
import Form from '../form/Form';
import Label from '../form/Label';
import Button from '../ui/button/Button';

interface Document {
    id: string;
    name: string;
    type: string;
    uploadDate: string;
    url: string;
}

interface Option {
    value: string;
    label: string;
}

const documentTypes: Option[] = [
    { value: "", label: "Select Type" },
    { value: "Insurance", label: "Insurance" },
    { value: "Absence", label: "Absence" },
    { value: "Expenses", label: "Expenses" }
];

interface DocumentsCardProps {
    onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function DocumentsCard({ onAlert }: DocumentsCardProps) {
    const [documents, setDocuments] = useState<Document[]>([
        {
            id: '1',
            name: 'Assurance_2025.pdf',
            type: 'Insurance',
            uploadDate: '2025-02-15',
            url: '#'
        },
        {
            id: '2',
            name: 'Certificat_03-2025.pdf',
            type: 'Absence',
            uploadDate: '2025-03-01',
            url: '#'
        },
        {
            id: '3',
            name: 'Facture_02-2025.pdf',
            type: 'Expenses',
            uploadDate: '2025-02-28',
            url: '#'
        }
    ]);

    const [selectedType, setSelectedType] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile && selectedType) {
            try {
                // Here you'll add the API call to upload the document
                console.log('Uploading:', selectedFile, 'Type:', selectedType);
                onAlert('success', 'Document uploaded successfully');
                setSelectedFile(null);
                setSelectedType('');
            } catch (error) {
                onAlert('error', 'Failed to upload document');
            }
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Documents
                </h3>
                <Button
                    variant="primary"
                    size="sm"
                    startIcon={
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M10 4.16667V15.8333M15.8333 10H4.16667"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    }
                    onClick={() => {
                        const uploadSection = document.getElementById('uploadSection');
                        uploadSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    Nouveau Document
                </Button>
            </div>

            <div className="mb-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {['Insurance', 'Absence', 'Expenses'].map((category) => (
                        <div key={category} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                                {category} Documents
                            </h4>
                            {documents.filter(doc => doc.type === category).map((doc) => (
                                <div key={doc.id} className="mb-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">{doc.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(doc.url, '_blank')}
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(doc.url, '_blank')}
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div id="uploadSection" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                    Upload New Document
                </h4>
                <Form onSubmit={handleUpload}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="documentType">Document Type</Label>
                            <select
                                id="documentType"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full rounded-lg border-[1.5px] border-gray-200 bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-gray-700 dark:bg-gray-800 dark:focus:border-primary"
                            >
                                {documentTypes.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="documentFile">File</Label>
                            <input
                                type="file"
                                id="documentFile"
                                onChange={handleFileUpload}
                                className="w-full rounded-lg border-[1.5px] border-gray-200 bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-gray-700 dark:bg-gray-800 dark:focus:border-primary"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={!selectedType || !selectedFile}
                        >
                            Upload Document
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
} 