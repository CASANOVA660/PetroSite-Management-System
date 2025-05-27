import React, { createContext, useContext, useState } from 'react';

interface ModalContextType {
    isModalOpen: boolean;
    setModalOpen: (isOpen: boolean) => void;
}

export const ModalContext = createContext<ModalContextType>({
    isModalOpen: false,
    setModalOpen: () => { },
});

export const useModalContext = () => useContext(ModalContext);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isModalOpen, setModalOpen] = useState(false);

    return (
        <ModalContext.Provider value={{ isModalOpen, setModalOpen }}>
            {children}
        </ModalContext.Provider>
    );
}; 