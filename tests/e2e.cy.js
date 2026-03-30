describe('TestMiner App', () => {
  beforeEach(() => {
    cy.visit('index.html')
  })

  it('clicking a suggestion button populates the search input', () => {
    cy.contains('.suggestion-btn', 'google').click()
    cy.get('#repo-input').should('have.value', 'google')
  })
})
