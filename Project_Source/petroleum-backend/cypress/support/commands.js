// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Command to intercept API calls
Cypress.Commands.add('interceptAPI', (method, url, fixture) => {
    return cy.intercept(method, url, {
        fixture: fixture
    });
});

// Command to check validation errors
Cypress.Commands.add('checkValidationError', (selector, expectedMessage) => {
    cy.get(selector).should('contain', expectedMessage);
});

// Command to create a test KPI
Cypress.Commands.add('createTestKpi', (kpiName) => {
    cy.visit('/kpis');
    cy.get('.add-kpi-button').click();
    cy.get('input[name="name"]').type(kpiName || 'Test KPI');
    cy.get('input[name="description"]').type('Test KPI description');
    cy.get('select[name="category"]').select('OPERATIONAL');
    cy.get('button[type="submit"]').click();
}); 