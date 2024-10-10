import { Resource } from 'idea-toolbox';

export class Book extends Resource {
  /**
   * The ID of the book.
   */
  bookId: string;
  title: string;


  load(x: any): void {
    super.load(x);
    this.bookId = this.clean(x.bookId, String);
    this.title = this.clean(x.title,String);
    // ...
  }

  safeLoad(newData: any, safeData: any): void {
    super.safeLoad(newData, safeData);
    this.bookId = safeData.bookId;
    // ...
  }

  validate(): string[] {
    const e = super.validate();
    // ...
    return e;
  }
}

export const BOOK_GENRES = ['Action', 'Adventure', 'Drama', 'Fantasy'];
