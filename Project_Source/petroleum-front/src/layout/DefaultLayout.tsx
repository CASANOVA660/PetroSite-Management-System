import { Outlet } from 'react-router-dom';
import Sidebar from '../layout/AppSidebar';
import Header from '../layout/AppHeader';

export const DefaultLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                <Header />
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}; 