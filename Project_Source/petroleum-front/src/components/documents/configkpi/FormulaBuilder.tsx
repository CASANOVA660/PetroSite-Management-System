import React, { useState, useEffect } from 'react';

interface FieldOption {
    id: string;
    label: string;
}

interface FormulaBuilderProps {
    fields: FieldOption[];
    formula: string;
    onChange: (formula: string) => void;
    sampleData?: Record<string, number>;
}

const operators = ['+', '-', '*', '/', '(', ')'];

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({ fields, formula, onChange, sampleData }) => {
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<number | null>(null);

    const handleFieldClick = (fieldId: string) => {
        onChange(formula + (formula && /[\w)]$/.test(formula) ? ' ' : '') + fieldId);
    };

    const handleOperatorClick = (op: string) => {
        onChange(formula + ' ' + op + ' ');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    useEffect(() => {
        try {
            if (sampleData && formula) {
                let evalFormula = formula;
                Object.entries(sampleData).forEach(([key, value]) => {
                    const regex = new RegExp(key, 'g');
                    evalFormula = evalFormula.replace(regex, value.toString());
                });
                // eslint-disable-next-line no-eval

                setError(null);
            } else {
                setPreview(null);
                setError(null);
            }
        } catch (e) {
            setError('Formule invalide');
            setPreview(null);
        }
    }, [formula, sampleData]);

    return (
        <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-2">Construisez votre formule</h2>
            <div className="flex flex-wrap gap-2 mb-2">
                {fields.map(field => (
                    <button
                        key={field.id}
                        className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-[#F28C38]/20"
                        onClick={() => handleFieldClick(field.id)}
                        type="button"
                    >
                        {field.label}
                    </button>
                ))}
                {operators.map(op => (
                    <button
                        key={op}
                        className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 hover:bg-[#F28C38]/20"
                        onClick={() => handleOperatorClick(op)}
                        type="button"
                    >
                        {op}
                    </button>
                ))}
            </div>
            <input
                className="w-full p-2 border rounded"
                value={formula}
                onChange={handleInputChange}
                placeholder="Ex: (DocumentsCompletes / TotalDocuments) * 100"
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {preview !== null && !error && (
                <div className="text-green-600 text-sm">Aperçu (avec données d'exemple): {preview}</div>
            )}
        </div>
    );
};

export default FormulaBuilder; 