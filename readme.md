# Journal Backend API Documentation

A robust backend API for a [journal application](https://github.com/04amanrajj/journal-native) , built with Express.js, Knex.js, and PostgreSQL. Features secure authentication, journal management, and RESTful endpoints.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Middleware](#middleware)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Examples](#api-examples)
- [Error Handling](#error-handling)
- [Security](#security)
- [Contributing](#contributing)

## Technology Stack

- **Node.js & Express.js**: Web framework for building the API
- **Knex.js**: SQL query builder for PostgreSQL
- **PostgreSQL**: Relational database for persistent storage
- **AWS S3**: Cloud storage for media files (photos, videos, music)
- **AWS SDK**: AWS JavaScript SDK for S3 integration
- **bcrypt**: Password hashing for secure user authentication
- **JWT**: JSON Web Tokens for secure, token-based authentication
- **dotenv**: Environment variable management

## Features

- 🔐 Secure user authentication with JWT
- 📝 CRUD operations for journal entries
- 🔒 Password hashing with bcrypt
- 🚫 Token blacklisting for secure logout
- 📊 PostgreSQL database with Knex.js ORM
- 🔄 Automatic timestamp management
- 🛡️ Security middleware implementation
- 📎 File upload support for journal entries

## API Endpoints

### User Endpoints

**Base URL**: `/user`

| Method | Endpoint    | Description       | Auth Required | Request Body                |
| ------ | ----------- | ----------------- | ------------- | --------------------------- |
| POST   | `/register` | Register new user | No            | `{ name, email, password }` |
| POST   | `/login`    | User login        | No            | `{ email, password }`       |
| POST   | `/logout`   | User logout       | Yes           | `{ token }`                 |
| GET    | `/`         | Get user profile  | Yes           | -                           |

### Journal Endpoints

**Base URL**: `/journal`

| Method | Endpoint      | Description          | Auth Required | Request Body         |
| ------ | ------------- | -------------------- | ------------- | -------------------- |
| POST   | `/create`     | Create journal entry | Yes           | `{ title, content }` |
| GET    | `/`           | Get all entries      | Yes           | -                    |
| PUT    | `/edit/:id`   | Update entry         | Yes           | `{ title, content }` |
| DELETE | `/delete/:id` | Delete entry         | Yes           | -                    |

### File Upload Endpoints

**Base URL**: `/journal`

| Method | Endpoint     | Description                                | Auth Required | Request Body          |
| ------ | ------------ | ------------------------------------------ | ------------- | --------------------- |
| POST   | `/upload`    | Import journal entries from file           | Yes           | `multipart/form-data` |
| POST   | `/upload-s3` | Upload media file to S3 storage            | Yes           | `multipart/form-data` |

Notes:

- For `/upload`: Supported file types are JSON files and ZIP files containing JSON
- For `/upload-s3`: Supported file types are audio, video, and photo files
- Files uploaded to S3 are stored persistently in AWS S3 bucket
- For imports, files are temporarily stored locally and deleted after processing
- The JSON import file should contain an array of entries with the following structure:
  ```json
  {
    "entries": [
      {
        "text": "Title\nContent",
        "creationDate": "2024-03-20T10:00:00Z", 
        "modifiedDate": "2024-03-20T10:00:00Z"
      }
    ]
  }
  ```

#### Journal Filters

The GET `/journal` endpoint supports the following query parameters for filtering:

| Parameter | Type   | Description                                   | Example                    |
| --------- | ------ | --------------------------------------------- | -------------------------- |
| `id`      | number | Get a specific journal by ID                  | `/journal?id=123`          |
| `title`   | string | Filter journals by title (case-insensitive)   | `/journal?title=My Day`    |
| `date`    | string | Filter journals by creation date (YYYY-MM-DD) | `/journal?date=2024-03-20` |
| `search`  | string | Search in both title and content              | `/journal?search=keyword`  |

Notes:

- The `date` filter uses UTC timezone
- The `search` parameter performs a case-insensitive search in both title and content
- All filters are optional

## Database Schema

### Users Table

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

### Journals Table

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

### Blacklisted Tokens Table

```sql
CREATE TABLE blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Token Generation**: On successful login/register
2. **Token Validation**: Required for protected routes
3. **Token Blacklisting**: Implemented for secure logout
4. **Token Expiration**: Configurable via environment variables

## Middleware

### Authentication Middleware

- Verifies JWT tokens
- Attaches user data to request object
- Handles token validation errors

### Blacklist Middleware

- Checks for blacklisted tokens
- Prevents use of logged-out tokens
- Maintains security after logout

## Setup & Installation

1. **Clone Repository**

   ```bash
   git clone https://github.com/04amanrajj/journal-app-backend.git
   cd journal-backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Database Setup**

   ```bash
   # Create PostgreSQL database
   createdb journal_app

   # Run migrations (if using Knex)
   npx knex migrate:latest
   ```

4. **Environment Setup**
   Create `.env` file:

   ```env
   DATABASE_URL=postgres://<username>:<password>@localhost:5432/journal_app
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION_TIME=1h
   ```

5. **Start Server**
   ```bash
   npm start
   ```

## Environment Variables

| Variable              | Description                  | Required | Default |
| --------------------- | ---------------------------- | -------- | ------- |
| `DATABASE_URL`        | PostgreSQL connection string | Yes      | -       |
| `PORT`                | Server port                  | No       | 3000    |
| `JWT_SECRET`          | JWT signing key              | Yes      | -       |
| `JWT_EXPIRATION_TIME` | Token expiration             | No       | 1h      |

## API Examples

### User Registration

```bash
curl -X POST http://localhost:3000/user/register \
-H "Content-Type: application/json" \
-d '{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}'
```

### Create Journal Entry

```bash
curl -X POST http://localhost:3000/journal/create \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <jwt_token>" \
-d '{
  "title": "My Day",
  "content": "It was a great day!"
}'
```

### Upload Journal File

```bash
# Local upload
curl -X POST http://localhost:3000/journal/upload \
-H "Authorization: Bearer <jwt_token>" \
-F "file=@/path/to/your/journal.json"

# S3 upload
curl -X POST http://localhost:3000/journal/upload-s3 \
-H "Authorization: Bearer <jwt_token>" \
-F "file=@/path/to/your/image.jpeg"
```

Response for local upload:

```json
{
  "message": "Journals imported successfully",
  "importedCount": 2,
  "importedJournals": [
    {
      "id": 1,
      "title": "First Journal",
      "created_at": "2024-03-20T10:00:00Z",
      "updated_at": "2024-03-20T10:00:00Z"
    },
    {
      "id": 2,
      "title": "Second Journal",
      "created_at": "2024-03-20T11:00:00Z",
      "updated_at": "2024-03-20T11:00:00Z"
    }
  ]
}
```

Response for S3 upload:

- Returns the file with appropriate content type and disposition headers
- File is streamed directly from S3

## Error Handling

The API implements standardized error responses:

| Status Code | Description  | Example Response                       |
| ----------- | ------------ | -------------------------------------- |
| 400         | Bad Request  | `{ "error": "Invalid input" }`         |
| 401         | Unauthorized | `{ "error": "Invalid token" }`         |
| 403         | Forbidden    | `{ "error": "Token blacklisted" }`     |
| 404         | Not Found    | `{ "error": "Resource not found" }`    |
| 500         | Server Error | `{ "error": "Internal server error" }` |

## Security

- Password hashing with bcrypt
- JWT token-based authentication
- CORS protection
- Security headers with helmet
- Token blacklisting
- Input validation
- SQL injection prevention with Knex.js

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
