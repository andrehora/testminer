beforeEach(() => {
  const token = Cypress.env('gh_token');
  if (token) {
    cy.on('window:before:load', (win) => {
      win.localStorage.setItem('testminer_gh_token', token);
    });
  }
});
