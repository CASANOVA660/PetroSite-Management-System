// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Basic login command without intercepts
Cypress.Commands.add('login', (email, password) => {
    cy.visit('/', { failOnStatusCode: false });
    cy.get('input[type="email"], input[type="text"], input[name="email"], input[name="username"]')
        .first()
        .type(email || 'test@example.com');

    cy.get('input[type="password"]')
        .first()
        .type(password || 'password123');

    cy.get('button[type="submit"], button:contains("Login"), button:contains("Sign in"), input[type="submit"], .login-button')
        .first()
        .click();
}); 