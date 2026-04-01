describe('TestMiner App', () => {

  beforeEach(() => {
    cy.visit('index.html')
  });

  it('clicking a owner button populates the search input', () => {
    cy.contains('apache').click();
    cy.get('#repo-input').should('have.value', 'apache')
  })

  it('clicking the owner/repo button with a valid input shows results', () => {
    cy.contains('electron/electron').click();
    cy.get('#repo-input').should('have.value', 'electron/electron')
  })

  // it('clear cache', function() {
  //   cy.contains('Recently viewed').should('not.exist');
  //   cy.contains('apache').click();
  //   cy.contains('Recently viewed').should('exist');
  //   cy.contains('Clear all').click();
  //   // cy.contains('Recently viewed').should('not.exist');
  // });
})

