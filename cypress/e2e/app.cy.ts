describe('App', () => {

    beforeEach(() => cy.visit('/'));

    it('Shows title', () => {
        cy.see('Manga Reader');
    });

});
