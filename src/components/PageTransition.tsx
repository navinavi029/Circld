import { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

type Variant = 'page' | 'auth';

interface PageTransitionProps {
    children: ReactNode;
    variant?: Variant;
}

// Variants for main layout pages (smooth, native-feeling spring transition)
const pageVariants: Variants = {
    initial: { opacity: 0, scale: 0.97, filter: 'blur(4px)', y: 12 },
    animate: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 350,
            damping: 28,
            mass: 0.8
        },
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        filter: 'blur(4px)',
        y: -8,
        transition: { duration: 0.15, ease: 'easeIn' },
    },
};

// Variants for auth pages (richer, deeper scale and blur for dramatic entrances)
const authVariants: Variants = {
    initial: { opacity: 0, scale: 0.95, filter: 'blur(8px)', y: 20 },
    animate: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25,
            mass: 0.9
        },
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        filter: 'blur(6px)',
        y: -15,
        transition: { duration: 0.2, ease: 'easeIn' },
    },
};

export function PageTransition({ children, variant = 'page' }: PageTransitionProps) {
    const variants = variant === 'auth' ? authVariants : pageVariants;

    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col w-full"
        >
            {children}
        </motion.div>
    );
}
