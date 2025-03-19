import { renderWithProviders } from '../../utils/test-utils';
import Blank from '../Blank';

describe('Blank', () => {
    it('renders blank page with title', () => {
        const { getByRole } = renderWithProviders(<Blank />);
        expect(getByRole('heading', { name: /blank page/i, level: 2 })).toBeInTheDocument();
    });

    it('renders breadcrumb navigation', () => {
        const { getByRole } = renderWithProviders(<Blank />);
        expect(getByRole('navigation')).toBeInTheDocument();
        expect(getByRole('list')).toBeInTheDocument();
        expect(getByRole('listitem', { name: /blank page/i })).toBeInTheDocument();
    });

    it('renders main content area', () => {
        const { container } = renderWithProviders(<Blank />);
        expect(container.querySelector('.mx-auto')).toBeInTheDocument();
        expect(container.querySelector('.text-center')).toBeInTheDocument();
    });

    it('renders with correct layout structure', () => {
        const { container } = renderWithProviders(<Blank />);
        expect(container.querySelector('.mx-auto')).toBeInTheDocument();
        expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
    });
}); 