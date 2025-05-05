import { motion } from 'framer-motion';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export const AnimatedUploadIcon: React.FC = () => {
    const containerVariants = {
        initial: {
            y: 0,
        },
        animate: {
            y: [0, -10, 0],
            transition: {
                y: {
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                }
            }
        }
    };

    const glowVariants = {
        initial: {
            opacity: 0.3,
            scale: 1,
        },
        animate: {
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
            transition: {
                opacity: {
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                },
                scale: {
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                }
            }
        }
    };

    return (
        <div className="relative flex flex-col items-center">
            <motion.div
                className="absolute inset-0 bg-green-400 rounded-full -z-10 blur-lg"
                variants={glowVariants}
                initial="initial"
                animate="animate"
            />
            <motion.div
                className="p-6 rounded-full bg-white shadow-md flex items-center justify-center"
                variants={containerVariants}
                initial="initial"
                animate="animate"
            >
                <ArrowUpTrayIcon className="w-10 h-10 text-green-500" />
            </motion.div>
            <motion.p
                className="mt-6 text-lg font-medium text-gray-700"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                Téléverser des Fichiers
            </motion.p>
        </div>
    );
}; 