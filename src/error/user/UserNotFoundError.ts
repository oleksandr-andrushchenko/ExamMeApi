export default class UserNotFoundError extends Error {

    constructor(idOrMessage: string = null) {
        super(idOrMessage ? `User with id="${idOrMessage}" not found error` : idOrMessage);
    }
}