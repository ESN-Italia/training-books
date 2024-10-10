# CRUD Exercise: Book Resource

In this exercise, you will be implementing CRUD (Create, Read, Update, Delete) operations for a `Book` resource within the project. The goal is to create a fully functional API that can handle basic operations on books, including creating a new book, retrieving books, updating book details, and deleting a book. Below are the step-by-step instructions to complete this task.

## Steps to Complete the Exercise

### 1. Define the Book Model

First, you'll need to define the structure of the `Book` resource by adding properties in the `book.model.ts` file.

1. **Navigate to the `back-end/src/models` directory**:

   - Locate the `book.model.ts` file.

2. **Add properties to the `Book` model**:
   - Open `book.model.ts` and define the properties for the `Book` resource. A book might typically have properties like:
     ```typescript
     export class Book extends Resource {
       bookId: string; // do not remove this
       title: string;
       author: string;
       publishedDate: string;
       isbn: string;
       pages: number;
       genre: string;
       summary?: string;
       ...
     }
     ```
   - Implement the `load` method, this acts as the constructor for your resource, loading the properties from another object, cleaning them.
     ```typescript
     load(x: any): void {
       super.load(x);
       this.bookId = this.clean(x.bookId, String);
       this.title = this.clean(x.title,String);
       // ...
     }
     ```
   - Implement the `safeLoad` method. This method ensures that properties that you do not want to be changed accidentally are preserved (i.e. when updating an existing resource you want to maintain its Id).
     ```typescript
     safeLoad(newData: any, safeData: any): void {
     super.safeLoad(newData, safeData);
     this.bookId = safeData.bookId;
     // ...
     }
     ```
   - Implement the `validate` method. This method checks the properties of a resource for errors. (i.e. empty book title, empty id ecc)
     ```typescript
     validate(): string[] {
     const e = super.validate();
     // ...
     return e;
     }
     ```

### 2. Implement CRUD Operations in `handlers/books.ts`

Now, implement the CRUD operations in the `books.ts` file located in the `handlers` directory.

1. **Navigate to the `handlers` directory**:

   - Locate the `books.ts` file. You'll see several empty methods available to be completed. the return value of each function will be sent as a Json response of the api call. If there is an error, `throw` an object of type `HandledError("message")` with details,and a `400` error code will be added to the response, as well as the message.
   - HINT: explore the methods of `ddb`

2. **Implement the `getResources` function**:

   - This function should return a list of all books.
   - Implementation example:
     ```typescript
     protected async getResources(): Promise<Book[]> {
     // ...
     // const books = await ddb.scan({ TableName: DDB_TABLE_BOOKS, /*...*/ });
      return [];
     }
     ```

3. **Implement the `postResources` function**:

   - This function should allow the creation of a new book.
   - use `ddb.put()`;

4. **Implement the `getResource` function**:

   - This function should retrieve a specific book by its ID.
   - Use `ddb.get()`

5. **Implement the `putResource` function**:

   - This function should replace an existing book or create it if it does not exist.
   - Use `ddb.update()`

6. **Implement the `patchResource` function**:

   - This function should update specific properties of an existing book.
   - Use `ddb.update()`

7. **Implement the `deleteResource` function**:
   - This function should delete a specific book by its ID.
   - Use `ddb.delete()`

### 3. Test Your Implementation

After implementing the CRUD operations, test each operation using tools like Postman, or directly from your application’s frontend.

1. **Run your application**:

   - Deploy the backend with `./deploy.sh <your_initials>`.
   - Ensure the frontend is connected to the correct API endpoint.

2. **Test CRUD operations**: you can use the SwaggerPreview VSCode extension
   - Create a new book.
   - Retrieve the list of all books.
   - Retrieve a specific book by ID.
   - Update a book using PUT and PATCH.
   - Delete a book and verify it no longer exists.

### 4. Implement CRUD Operations in the Frontend

Now that the backend is set up to handle CRUD operations for the `Book` resource, you'll implement the corresponding functionality in the Angular frontend to interact with the API.

1. **Create a Book Service**:

   First, create an Angular service to manage API requests related to the `Book` resource.

   - Open the `book.service.ts` file.
   - Define methods for each CRUD operation (the following is a VERY VERY essential implementation):

     ```typescript
     ...
     export class BookService {
       /*...*/


       async getBooks(){
        return this.apiService.getResource('books') as Book[];
       }

       async getBook(id: string): Promise<Book> {
         return this.apiService.getResource(['books',id]);
       }

       async createBook(book: Book): Promise<Book> {
         return this.apiService.postResource('books', book);
       }

       async updateBook(id: string, book: Book): Promise<Book> {
         return this.apiService.putResource(['books',id],{body:book});
       }

       async patchBook(id: string, updates: Partial<Book>): Promise<Book> {
         return this.apiService.patchResource(['books',id], {body:{action:"ACTIONCODE",param:{...}}});
         // define methods to handle every action that you want in the backend
       }

       async deleteBook(id: string): Promise<void> {
         return this.apiService.deleteResource(['books',id]);
       }
     }
     ```

#### 3. Create Standalone Book Components

Create standalone components for listing books, viewing a single book, and creating/editing/deleting books.

- **Generate standalone components using Angular CLI**:
  ```bash
  ng generate component components/book-list --standalone
  ng generate component components/book-detail --standalone
  ng generate component components/book-form --standalone
  ```

- **Implement the logic for each component**:

  - **Book List Component (`book-list.component.ts`)**:
    ```typescript
    import { Component, OnInit } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { RouterModule } from '@angular/router';
    import { BookService } from '../../services/book.service';
    import { Book } from '../../models/book.model';

    @Component({
      selector: 'app-book-list',
      standalone: true,
      imports: [CommonModule, RouterModule],
      templateUrl: './book-list.component.html',
      styleUrls: ['./book-list.component.css'],
    })
    export class BookListComponent implements OnInit {
      books: Book[] = [];

      constructor(private bookService: BookService) {}

      async ngOnInit(): Promise<void> {
        this.books = await this.bookService.getBooks();
      }

      async deleteBook(id: string): Promise<void> {
        await this.bookService.deleteBook(id);
        this.books = this.books.filter((book) => book.id !== id);
      }
    }
    ```

  - **Book Detail Component (`book-detail.component.ts`)**:
    ```typescript
    import { Component, OnInit } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { ActivatedRoute } from '@angular/router';
    import { BookService } from '../../services/book.service';
    import { Book } from '../../models/book.model';

    @Component({
      selector: 'app-book-detail',
      standalone: true,
      imports: [CommonModule],
      templateUrl: './book-detail.component.html',
      styleUrls: ['./book-detail.component.css'],
    })
    export class BookDetailComponent implements OnInit {
      book: Book | undefined;

      constructor(
        private bookService: BookService,
        private route: ActivatedRoute
      ) {}

      async ngOnInit(): Promise<void> {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.book = await this.bookService.getBook(id);
      }
    }
    ```

  - **Book Form Component (`book-form.component.ts`)**:
    This component will be used for both creating and editing books.

    ```typescript
    import { Component, OnInit } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
    import { BookService } from '../../services/book.service';
    import { Router, ActivatedRoute } from '@angular/router';
    import { Book } from '../../models/book.model';

    @Component({
      selector: 'app-book-form',
      standalone: true,
      imports: [CommonModule, ReactiveFormsModule],
      templateUrl: './book-form.component.html',
      styleUrls: ['./book-form.component.css'],
    })
    export class BookFormComponent implements OnInit {
      bookForm: FormGroup;
      isEditMode = false;
      bookId: string | null = null;

      constructor(
        private fb: FormBuilder,
        private bookService: BookService,
        private router: Router,
        private route: ActivatedRoute
      ) {
        this.bookForm = this.fb.group({
          title: ['', Validators.required],
          author: ['', Validators.required],
          publishedDate: ['', Validators.required],
          isbn: ['', Validators.required],
          pages: ['', Validators.required],
          genre: ['', Validators.required],
          summary: [''],
        });
      }

      async ngOnInit(): Promise<void> {
        this.bookId = this.route.snapshot.paramMap.get('id');
        if (this.bookId) {
          this.isEditMode = true;
          const book = await this.bookService.getBook(this.bookId);
          this.bookForm.patchValue(book);
        }
      }

      async onSubmit(): Promise<void> {
        if (this.bookForm.valid) {
          const bookData: Book = this.bookForm.value;

          if (this.isEditMode) {
            await this.bookService.updateBook(this.bookId!, bookData);
          } else {
            await this.bookService.createBook(bookData);
          }

          this.router.navigate(['/books']);
        }
      }
    }
    ```

#### 4. Integrate Components into the Application

Add routes directly in the `main.ts` or within a central routing component since you're using standalone components.

- **Add Routes**:
  ```typescript
  import { bootstrapApplication } from '@angular/platform-browser';
  import { provideRouter } from '@angular/router';
  import { AppComponent } from './app/app.component';
  import { BookListComponent } from './app/components/book-list/book-list.component';
  import { BookDetailComponent } from './app/components/book-detail/book-detail.component';
  import { BookFormComponent } from './app/components/book-form/book-form.component';
  import { provideHttpClient } from '@angular/common/http';

  bootstrapApplication(AppComponent, {
    providers: [
      provideRouter([
        { path: 'books', component: BookListComponent },
        { path: 'books/new', component: BookFormComponent },
        { path: 'books/:id', component: BookDetailComponent },
        { path: 'books/:id/edit', component: BookFormComponent },
        { path: '', redirectTo: '/books', pathMatch: 'full' },
      ]),
      provideHttpClient(),
    ],
  }).catch((err) => console.error(err));
  ```

- **Update Templates**:
  - For `book-list.component.html`, create a table or list to display books with options for editing and deleting.
  - For `book-detail.component.html`, display the book's details.
  - For `book-form.component.html`, create a form with inputs bound to the reactive form controls.

#### 5. Test the Frontend CRUD Operations

- **Start the Angular development server**:
  ```bash
  ng serve
  ```
- **Navigate to `http://localhost:8100/books`**:
  - Test creating, reading, updating, and deleting books to ensure the frontend correctly interacts with the backend API.

## Conclusion

By following these steps, you've implemented CRUD operations using Angular standalone components, allowing users to interact with the `Book` resource managed by the backend. This approach makes the application structure simpler and more modular.

**REMEMBER**
The code in this file is meant as a suggestion, it was generated with ChatGPT and never actually implemented (so it may not work as is). **Use it as a guideline on how to implement the functionalities.**
