///
/// IMPORTS
///

import { DynamoDB, ResourceController } from 'idea-aws';
import { Book } from '../models/book.model';

///
/// CONSTANTS, ENVIRONMENT VARIABLES, HANDLER
///

const DDB_TABLE_BOOKS = process.env.DDB_TABLE_books; // include your initial in the name, so you don't overlap with others
const ddb = new DynamoDB();

export const handler = (ev: any, _: any, cb: any): Promise<void> =>
  new Books(ev, cb).handleRequest();

///
/// RESOURCE CONTROLLER
///

class Books extends ResourceController {
  constructor(event: any, callback: any) {
    super(event, callback, { resourceId: 'bookId' });
  }

  protected async checkAuthBeforeRequest(): Promise<void> {
    // ... (if empty: always authorized)
  }

  protected async getResources(): Promise<Book[]> {
    const books: Book[] = [];

    const result = await ddb.scan({
      TableName: DDB_TABLE_BOOKS,
      ProjectionExpression: 'bookId, title, author, publishedDate, isbn, pages, genre, summary'
    });
    console.log('Books retrieved:', result);

    for (const item of result) {
      const book = new Book();
      book.safeLoad(item, item);
      books.push(book);
    }
    return books;
  }

  protected async postResources(): Promise<Book> {
    const bookId = Date.now().toString();

    // Parsing del body se arriva come stringa
    let body = this.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        this.logger.error('Invalid JSON body', body);
        throw new Error('Malformed request');
      }
    }

    // Creazione e caricamento del libro
    const book = new Book();
    book.bookId = bookId;
    book.load(body);

    // Validazione
    const validationErrors = book.validate();
    if (validationErrors.length > 0) {
      this.logger.error('Validation errors:', validationErrors);
      throw new Error(`Malformed request: ${validationErrors.join('; ')}`);
    }

    // Salvataggio su DynamoDB
    await ddb.put({
      TableName: DDB_TABLE_BOOKS,
      Item: book
    });

    this.logger.info('Book saved with ID:', bookId);
    return book;
  }

  protected async getResource(): Promise<Book> {
    // ...
    return null;
  }

  protected async patchResource(): Promise<void> {
    // ...
    return null;
  }

  protected async putResource(): Promise<Book> {
    // ...
    return null;
  }

  protected async deleteResource(): Promise<void> {
    // ...
  }
}
