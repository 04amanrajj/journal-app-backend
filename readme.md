# Journal Backend API Documentation

This project is a backend API for a journal application, built with **Express.js**, **Knex.js** for database queries, and **PostgreSQL** as the database. It uses **bcrypt** for password hashing and **JWT** for token-based authentication. The API supports user authentication, journal entry management, and secure authorization.

## Table of Contents

- Technology Stack
- Endpoints
  - User Endpoints
  - Journal Endpoints
- Database Schema
- Middlewares
- Setup Instructions
- Environment Variables
- Example Usage
- Error Handling

## Technology Stack

- **Node.js & Express.js**: Web framework for building the API.
- **Knex.js**: SQL query builder for PostgreSQL.
- **PostgreSQL**: Relational database for persistent storage.
- **bcrypt**: Password hashing for secure user authentication.
- **JWT**: JSON Web Tokens for secure, token-based authentication.

## Endpoints

### User Endpoints

**Base URL**: `/user`

| Method | Endpoint | Description | Authentication Required |
| --- | --- | --- | --- |
| POST | `/register` | Registers a new user and returns a JWT token. | No |
| POST | `/login` | Logs in a user and returns a JWT token. | No |
| POST | `/logout` | Logs out the user by blacklisting the JWT token. | Yes |
| GET | `/` | Fetches user details and total journal entries. | Yes |

### Journal Endpoints

**Base URL**: `/journal`

| Method | Endpoint | Description | Authentication Required |
| --- | --- | --- | --- |
| POST | `/create` | Creates a new journal entry. | Yes |
| GET | `/` | Retrieves all journal entries for the user. | Yes |
| PUT | `/edit/:id` | Updates a specific journal entry by ID. | Yes |
| DELETE | `/delete/:id` | Deletes a specific journal entry by ID. | Yes |

## Database Schema

### `users` Table

Stores user information.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `journals` Table

Stores journal entries.

```sql
CREATE TABLE journals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `blacklisted_tokens` Table

Stores blacklisted JWT tokens for logout functionality.

```sql
CREATE TABLE blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Middlewares

### Authorization Middleware

- **File**: `auth.middleware.js`
- **Function**: Verifies the JWT token in the `Authorization` header.
- **Behavior**:
  - Decodes the token and attaches the `user_id` to `req.user`.
  - Rejects requests with invalid or missing tokens.

### Blacklist Middleware

- **File**: `blacklist.middleware.js`
- **Function**: `checkBlacklist`
- **Behavior**:
  - Queries the `blacklisted_tokens` table to check if the token is blacklisted.
  - Rejects requests if the token is blacklisted or invalid.

## Setup Instructions

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/04amanrajj/journal-app-backend.git
   cd journal-backend
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set Up PostgreSQL**:

   - Ensure PostgreSQL is installed and running.
   - Create a database: `createdb journal_app`.
   - Run the schema SQL (from Database Schema) to create tables.

4. **Configure Environment Variables**: Create a `.env` file in the project root:

   ```env
   DATABASE_URL=postgres://<username>:<password>@localhost:5432/journal_app
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION_TIME=1h
   ```

5. **Run the Application**:

   ```bash
   npm start
   ```

6. **Access the API**:

   - Base URL: `http://localhost:3000` (or the configured `PORT`).

## Environment Variables

| Variable | Description | Example Value |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/db` |
| `PORT` | Port for the server | `3000` |
| `JWT_SECRET` | Secret key for JWT signing | `your_jwt_secret_key` |
| `JWT_EXPIRATION_TIME` | JWT token expiration time | `1h` |

## Example Usage

### Register a User

```bash
curl -X POST http://localhost:3000/user/register \
-H "Content-Type: application/json" \
-d '{"name": "John Doe", "email": "john@example.com", "password": "securepassword"}'
```

**Response**:

```json
{
  "token": "<jwt_token>",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
}
```

### Create a Journal Entry

```bash
curl -X POST http://localhost:3000/journal/create \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <jwt_token>" \
-d '{"title": "My Day", "content": "It was a great day!"}'
```

**Response**:

```json
{
  "id": 1,
  "title": "My Day",
  "content": "It was a great day!",
  "created_at": "2025-05-02T12:00:00Z"
}
```

## Error Handling

The API returns standard HTTP status codes and error messages:

- **400 Bad Request**: Invalid input data.
- **401 Unauthorized**: Missing or invalid JWT token.
- **403 Forbidden**: Blacklisted token or insufficient permissions.
- **404 Not Found**: Resource (e.g., journal entry) not found.
- **500 Internal Server Error**: Server-side errors.

**Example Error Response**:

```json
{
  "error": "Invalid token",
  "status": 401
}
```