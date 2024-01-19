export default class CategoryNotFoundError extends Error {

    constructor(idOrMessage: string = null) {
        super(idOrMessage ? `Category with id="${idOrMessage}" not found error` : idOrMessage);
    }
}