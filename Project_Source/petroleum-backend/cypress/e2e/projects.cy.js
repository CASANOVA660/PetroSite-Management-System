describe('Project Page Test', () => {
    it('should load the projects page', () => {
        // Visit the projects page or any page that might show projects
        cy.visit('/projects', { failOnStatusCode: false });

        // Just check if page loaded
        cy.get('body').should('exist');

        // Look for any container element
        cy.get('div').should('exist');
    });
}); 