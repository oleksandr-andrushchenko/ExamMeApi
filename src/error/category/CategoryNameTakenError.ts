export default class CategoryNameTakenError extends Error {

  constructor(name: string) {
    super(`Name "${ name }" is already taken`);
  }
}