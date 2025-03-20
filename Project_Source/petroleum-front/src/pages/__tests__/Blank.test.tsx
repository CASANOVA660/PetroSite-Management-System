import { renderWithProviders } from '../../utils/test-utils';
import Blank from '../Blank';

describe('Blank', () => {
    it('renders blank page with title', () => {
        const { getByRole } = renderWithProviders(<Blank />);
        expect(getByRole('heading', { name: /card title here/i })).toBeInTheDocument();
    });

    it('renders breadcrumb navigation', () => {
        const { getByRole, getByText } = renderWithProviders(<Blank />);
        const nav = getByRole('navigation');
        expect(nav).toBeInTheDocument();
        expect(getByRole('list')).toBeInTheDocument();
        const breadcrumbText = getByText('Blank Page', { selector: 'li.text-sm' });
        expect(breadcrumbText).toBeInTheDocument();
    });

    it('renders main content area', () => {
        const { container } = renderWithProviders(<Blank />);
        expect(container.querySelector('.mx-auto')).toBeInTheDocument();
        expect(container.querySelector('.text-center')).toBeInTheDocument();
        expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('renders with correct layout structure', () => {
        const { container } = renderWithProviders(<Blank />);
        expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
        expect(container.querySelector('.border')).toBeInTheDocument();
        expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });
}); 