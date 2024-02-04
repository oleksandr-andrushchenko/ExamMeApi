export default class CategoryNotFoundError extends Error {

    constructor(id: string) {
        super(`Category with id="${id}" not found error`);
    }
}