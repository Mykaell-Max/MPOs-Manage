# MPOs Manage

_Efficient Work Order Management System for Companies_

## Overview

MPOs Manage is a comprehensive product registration and management system designed to streamline the request, approval, and execution process within a company. It enables operators to create product registration requests, facilitates review by the purchasing department, and allows the registration team to complete the process in an organized and trackable manner.

## Features

### User Management
- Role-based access control with four roles: Solicitante (Requester), Compras (Purchasing), Cadastro (Registration), and Admin
- Secure user authentication with JWT tokens
- User profile management

### Product Registration Workflow
- **Request Creation**: Requesters can create new product registration or modification requests
- **Approval Process**: Multi-step approval workflow with dedicated roles
  - Purchasing team reviews and approves/rejects requests
  - Registration team processes approved requests in the ERP system (Protheus)
- **Status Tracking**: Comprehensive status history for each request
- **Resubmission**: Ability to resubmit rejected requests with corrections

### Search and Filtering
- Advanced search capabilities with filters for product name, category, date range, and status
- Pagination and sorting options for result lists
- Role-specific views showing relevant requests

## Technical Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Bcrypt for password hashing
- **Development**: Nodemon for hot-reloading
- **Testing**: Jest and Supertest

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=your_port
   MONGO=your_mongodb_key
   JWTKEY=your_secret_key
   ```
4. Start the development server:
   ```
   npm start
   ```

## API Endpoints

### User Management
- `POST /api/user/registerUser` - Register a new user
- `POST /api/user/login` - Authenticate user and get token
- `PATCH /api/user/:userId` - Update user information
- `DELETE /api/user/:userId` - Delete user

### Product Registration (Requester)
- `POST /api/product/requests` - Create a new product registration request
- `GET /api/product/requests` - Get user's requests
- `PATCH /api/product/requests/:requestId/resubmit` - Resubmit a rejected request

### Purchasing Department
- `GET /api/product/purchasing/pending` - Get pending review requests
- `PATCH /api/product/purchasing/:requestId/review` - Approve or reject a request

### Registration Department
- `GET /api/product/registration/pending` - Get pending registration requests
- `PATCH /api/product/registration/:requestId/process` - Complete or reject a registration

### Search and Filtering
- `GET /api/product/search` - Search requests with filters

## Request Status Flow

1. **Enviado** - Request submitted by requester
2. **Em Análise (Compras)** - Under review by purchasing team
3. **Aprovado por Compras** - Approved by purchasing team
4. **Reprovado por Compras** - Rejected by purchasing team
5. **Em Cadastro (Protheus)** - Being processed in the ERP system
6. **Reprovado por Cadastro** - Rejected by registration team
7. **Finalizado** - Process completed successfully