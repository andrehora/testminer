describe('TestMiner App', () => {
  beforeEach(() => {
    cy.visit('index.html')
  })

  it('clicking a owner button populates the search input', () => {
    cy.contains('.suggestion-btn', 'apache').click()
    cy.get('#repo-input').should('have.value', 'apache')
  })

  it('clicking the owner/repo button with a valid input shows results', () => {
    cy.contains('.suggestion-btn', 'electron/electron').click()
    cy.get('#repo-input').should('have.value', 'electron/electron')
  })

})
