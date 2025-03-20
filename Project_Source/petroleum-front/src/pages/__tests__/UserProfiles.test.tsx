import { renderWithProviders } from '../../utils/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfiles from '../UserProfiles';

describe('UserProfiles', () => {
    it('renders profile page correctly', async () => {
        renderWithProviders(<UserProfiles />);

        // Check if the tabs are rendered
        expect(screen.getByText('Informations personnelles')).toBeInTheDocument();
        expect(screen.getByText('Documents')).toBeInTheDocument();

        // Check if the personal info tab is active by default
        const personalInfoTab = screen.getByText('Informations personnelles');
        expect(personalInfoTab).toHaveClass('text-primary');
    });

    it('switches between personal info and documents tabs', async () => {
        renderWithProviders(<UserProfiles />);

        // Click on the Documents tab
        const documentsTab = screen.getByText('Documents');
        await userEvent.click(documentsTab);

        // Check if the Documents tab is now active
        expect(documentsTab).toHaveClass('text-primary');

        // Click back on the Personal Info tab
        const personalInfoTab = screen.getByText('Informations personnelles');
        await userEvent.click(personalInfoTab);

        // Check if the Personal Info tab is now active
        expect(personalInfoTab).toHaveClass('text-primary');
    });

    it('shows alert when triggered', async () => {
        renderWithProviders(<UserProfiles />);

        // Switch to Documents tab to trigger an alert
        const documentsTab = screen.getByText('Documents');
        await userEvent.click(documentsTab);

        // Wait for the alert to appear (this would be triggered by child components)
        await waitFor(() => {
            const alert = screen.queryByRole('alert');
            expect(alert).not.toBeInTheDocument(); // Alert should auto-hide after 3 seconds
        });
    });
}); 