import { Injectable, inject } from '@angular/core';
import { IDEAApiService } from '@idea-ionic/common';

import { Book } from '@models/book.model';

@Injectable({
  providedIn: 'root',
})
export class BooksService {
  private apiService = inject(IDEAApiService);
  protected books: Book[] = [];
  constructor() {}

  public async load(){
    this.books = (await this.apiService.getResource('books')) as Book[];
  }

  public get getBooks(): Book[] {
    return this.books;
  }
  putBook(book:Book){
    this.apiService.putResource(['books',book.bookId],{body: book})
  }

}
