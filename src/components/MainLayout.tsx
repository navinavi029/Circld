import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { motion } from 'framer-motion';

export function MainLayout() {
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
                <Outlet />
            </main>
        </div>
    );
}
