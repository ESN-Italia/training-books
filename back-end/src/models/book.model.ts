import { Resource } from 'idea-toolbox';

export class Book extends Resource {
  /**
   * The ID of the book.
   */
  bookId: string;
  title: string;
  author: string;
  publishedDate: string;
  isbn: string;
  pages: number;
  genre: string;
  summary?: string;


  load(x: any): void {
    super.load(x);
    this.bookId = this.clean(x.bookId, String);
    this.title = this.clean(x.title,String);
    this.author = this.clean(x.author, String);
    this.publishedDate = this.clean(x.publishedDate, String);
    this.isbn = this.clean(x.isbn, String);
    this.pages = this.clean(x.pages, Number);
    this.genre = this.clean(x.genre, String);
    this.summary = this.clean(x.summary, String);
  }

  safeLoad(newData: any, safeData: any): void {
    super.safeLoad(newData, safeData);
    this.bookId = safeData.bookId;
    this.title = newData.title || safeData.title;
    this.author = newData.author || safeData.author;
    this.publishedDate = newData.publishedDate || safeData.publishedDate;
    this.isbn = newData.isbn || safeData.isbn;
    this.pages = newData.pages || safeData.pages;
    this.genre = newData.genre || safeData.genre;
    this.summary = newData.summary || safeData.summary;
  }

  validate(): string[] {
    const e = super.validate();
    if (!this.bookId) {
      e.push('bookId is required');
    }
    if (!this.title) {
      e.push('title is required');
    }
    if (!this.author) {
      e.push('author is required');
    }
    if (!this.publishedDate) {
      e.push('publishedDate is required');
    }
    if (!this.isbn) {
      e.push('isbn is required');
    }
    if (!this.pages || this.pages <= 0) {
      e.push('pages must be a positive number');
    }
    if (!this.genre || !BOOK_GENRES.includes(this.genre)) {
      e.push(`genre must be one of: ${BOOK_GENRES.join(', ')}`);
    }
    if (this.summary && this.summary.length > 500) {
      e.push('summary must not exceed 500 characters');
    }
    return e;
  }
}

export const BOOK_GENRES = ['Action', 'Adventure', 'Drama', 'Fantasy'];
