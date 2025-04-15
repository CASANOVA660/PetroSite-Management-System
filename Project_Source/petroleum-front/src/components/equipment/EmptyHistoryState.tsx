import React from 'react';
import { CalenderIcon } from '../../icons';

interface EmptyHistoryStateProps {
    message: string;
}

const EmptyHistoryState: React.FC<EmptyHistoryStateProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center">
            <CalenderIcon className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );
};

export default EmptyHistoryState; 