import React from 'react';
import { HomeIcon, UserGroupIcon, ChartBarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface VerticalNavProps {
    icons: {
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
        color: string;
    }[];
}

export const VerticalNav: React.FC<VerticalNavProps> = ({ icons }) => {
    return (
        <div className="flex flex-col gap-3 mt-4 w-full items-center">
            {icons.map(({ icon: Icon, color }, idx) => (
                <div key={idx} className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
            ))}
        </div>
    );
}; 