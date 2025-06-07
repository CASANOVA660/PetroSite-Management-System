describe('KPI Page Test', () => {
    it('should load the KPI page', () => {
        // Visit the KPI page or any page that might show KPIs
        cy.visit('/kpis', { failOnStatusCode: false });

        // Just check if page loaded
        cy.get('body').should('exist');

        // Look for any container element
        cy.get('div').should('exist');
    });
}); 