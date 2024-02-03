export default class UserWrongCredentialsError extends Error {

    constructor() {
        super('Passwords not matched');
    }
}