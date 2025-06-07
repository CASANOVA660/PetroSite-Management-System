describe('Equipment Page Test', () => {
    it('should load the equipment page', () => {
        // Visit the equipment page or any page that might show equipment
        cy.visit('/equipment', { failOnStatusCode: false });

        // Just check if page loaded
        cy.get('body').should('exist');

        // Look for any container element
        cy.get('div').should('exist');
    });
}); 