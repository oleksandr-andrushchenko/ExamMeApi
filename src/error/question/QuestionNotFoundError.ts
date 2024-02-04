export default class QuestionNotFoundError extends Error {

    constructor(id: string) {
        super(`Question with id="${id}" not found error`);
    }
}