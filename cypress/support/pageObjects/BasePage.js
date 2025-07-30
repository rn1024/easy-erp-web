export class BasePage {
  constructor() {
    this.selectors = {
      loadingSpinner: '.ant-spin',
      successMessage: '.ant-message-success',
      errorMessage: '.ant-message-error',
      modal: '.ant-modal',
      confirmButton: '.ant-modal-confirm-btns .ant-btn-primary',
      cancelButton: '.ant-modal-confirm-btns .ant-btn-default'
    }
  }

  waitForLoading() {
    cy.get(this.selectors.loadingSpinner).should('not.exist')
  }

  waitForApi(alias) {
    cy.wait(`@${alias}`).then((interception) => {
      expect(interception.response.statusCode).to.be.oneOf([200, 201])
    })
  }

  verifySuccessMessage(message) {
    cy.contains(this.selectors.successMessage, message).should('be.visible')
  }

  verifyErrorMessage(message) {
    cy.contains(this.selectors.errorMessage, message).should('be.visible')
  }

  clickConfirmButton() {
    cy.get(this.selectors.confirmButton).click()
  }

  clickCancelButton() {
    cy.get(this.selectors.cancelButton).click()
  }

  waitForModal() {
    cy.get(this.selectors.modal).should('be.visible')
  }

  closeModal() {
    cy.get('.ant-modal-close').click()
  }

  verifyUrlContains(urlPart) {
    cy.url().should('include', urlPart)
  }

  verifyPageTitle(title) {
    cy.get('h1').should('contain', title)
  }

  scrollToTop() {
    cy.scrollTo('top')
  }

  scrollToBottom() {
    cy.scrollTo('bottom')
  }

  takeScreenshot(name) {
    cy.screenshot(name)
  }
}