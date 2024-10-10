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

export const handler = (ev: any, _: any, cb: any): Promise<void> => new Books(ev, cb).handleRequest();

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
    // ...
    // const book = await ddb.scan({ TableName: DDB_TABLE_BOOKS, /* ... */ });
    return [];
  }

  protected async postResources(): Promise<Book> {
    const bookId = Date.now().toString();
    // ...
    // await ddb.put({ TableName: DDB_TABLE_BOOKS, /* ... */ });
    this.logger.info(bookId);
    return null;
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
