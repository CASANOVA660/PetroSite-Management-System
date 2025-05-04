import { motion } from 'framer-motion';
import { FolderIcon } from '@heroicons/react/24/solid';

// Define rings: [radius, dotCount, dotSize]
const RINGS = [
    { radius: 44, count: 18, size: 3 },
    { radius: 62, count: 26, size: 2.5 },
    { radius: 80, count: 34, size: 2 },
    { radius: 98, count: 42, size: 1.5 },
];

export const AnimatedUploadIcon: React.FC = () => {
    return (
        <div className="relative w-[276px] h-[200px] flex items-center justify-center">
            {/* Animated dots in multiple rings */}
            {RINGS.map((ring, ringIdx) => {
                return Array.from({ length: ring.count }, (_, i) => {
                    const angle = (i * 360) / ring.count;
                    const rad = (angle * Math.PI) / 180;
                    const x = Math.cos(rad) * ring.radius;
                    const y = Math.sin(rad) * ring.radius;
                    return (
                        <motion.div
                            key={`ring-${ringIdx}-dot-${i}`}
                            className="absolute bg-green-300"
                            style={{
                                left: "50%",
                                top: "50%",
                                marginLeft: x,
                                marginTop: y,
                                width: ring.size,
                                height: ring.size,
                                borderRadius: '50%',
                            }}
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.6,
                                delay: (i + ringIdx * 3) * (1.2 / (ring.count * RINGS.length)),
                                ease: 'easeInOut',
                            }}
                        />
                    );
                });
            })}
            {/* Center circle and icon */}
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                <FolderIcon className="w-8 h-8 text-white" />
            </div>
        </div>
    );
}; 