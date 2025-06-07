describe('Basic Page Test', () => {
    it('should load a page with form elements', () => {
        // Visit the root URL with failure allowed
        cy.visit('/', { failOnStatusCode: false });

        // Just check if the page loaded
        cy.get('body').should('exist');

        // Look for any input fields
        cy.get('input').should('exist');
    });
}); 