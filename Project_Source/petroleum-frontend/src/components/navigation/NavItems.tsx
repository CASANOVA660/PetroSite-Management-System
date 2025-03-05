import navItems from 'data/nav-items';
import NavItem from 'layouts/main-layout/Sidebar/NavItem';
import { useAppSelector } from '../../hooks/useAppSelector';

const NavItems = () => {
    const { user } = useAppSelector((state) => state.auth);

    return (
        <>
            {navItems.map((item) => {
                if (item.requiresManager && user?.role !== 'Manager') {
                    return null;
                }
                return <NavItem navItem={item} open={true} key={item.id} />;
            })}
        </>
    );
};

export default NavItems; 