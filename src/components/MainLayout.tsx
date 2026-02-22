import { Outlet, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { PageTransition } from './PageTransition';
import { AnimatePresence, motion } from 'framer-motion';

export function MainLayout() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col font-sans overflow-x-hidden">
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            >
                <Navigation />
            </motion.div>
            <main className="flex-1 flex flex-col">
                <AnimatePresence mode="wait" initial={false}>
                    <PageTransition key={location.pathname} variant="page">
                        <Outlet />
                    </PageTransition>
                </AnimatePresence>
            </main>
        </div>
    );
}
