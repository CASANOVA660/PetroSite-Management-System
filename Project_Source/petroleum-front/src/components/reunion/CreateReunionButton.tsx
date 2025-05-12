import React from 'react';

interface CreateReunionButtonProps {
    onClick: () => void;
}

export const CreateReunionButton: React.FC<CreateReunionButtonProps> = ({ onClick }) => {
    return (
        <button
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#FF6F61] shadow-lg flex items-center justify-center text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6F61] transform transition-all duration-300 z-10 hover:bg-[#ff8177]"
            onClick={onClick}
            aria-label="Créer une nouvelle réunion"
        >
            <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
            </svg>
        </button>
    );
}; 