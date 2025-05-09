import React, { useEffect, useState } from 'react';

interface ResponsiveWrapperProps {
    children: (isMobile: boolean) => React.ReactNode;
}

export default function ResponsiveWrapper({ children }: ResponsiveWrapperProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return <div>{children(isMobile)}</div>;
} 