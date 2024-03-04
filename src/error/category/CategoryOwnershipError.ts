export default class CategoryOwnershipError extends Error {

  constructor(id: string) {
    super(`Category with id="${ id }" ownership error`);
  }
}