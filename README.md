# BPM System

_A comprehensive Business Process Management platform for designing, executing, and monitoring workflows_

## Overview

This BPM System is a flexible platform that allows organizations to design custom workflows, manage processes across departments, and automate business procedures. It supports dynamic form generation, role-based access control, and real-time process monitoring.

## Core Features

### Workflow Management
- Design custom workflows with multiple states and transitions
- Version control for workflows with activity tracking
- Visual diagram generation for workflow visualization
- Dynamic form association with workflows

### Process Execution
- Instantiate processes from workflow definitions
- Track process state and history
- Role-based assignments and notifications
- SLA monitoring and deadline management

### User & Role Management
- Flexible role-based access control system
- Custom permission management
- User substitution for handling absences
- User preferences and settings

### Form Builder
- Create dynamic form definitions
- Conditional field visibility and validation
- Multi-step forms tied to workflow states
- Form versioning and history

### Dashboard & Analytics
- Process performance metrics
- Workflow statistics and bottleneck identification
- User activity monitoring
- Custom reports and exports

## Technical Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with role-based authorization
- **Architecture**: Service-oriented with Controller-Service pattern
- **Process Engine**: Custom workflow execution engine
- **Form Rendering**: Dynamic form generation service
- **Development**: Modular component design with clear separation of concerns

## API Endpoints

### Authentication
- `POST /api/users/login` - Login to get access token ✅
- `POST /api/users/register` - Register new user (admin only) ✅

### User Management
- `GET /api/users/profile` - Get current user profile ✅
- `PUT /api/users/preferences` - Update user preferences ✅
- `PUT /api/users/:userId` - Update user (admin) ✅
- `DELETE /api/users/:userId` - Deactivate user (admin) ✅
- `POST /api/users/:userId/substitute` - Set user substitute ✅

### Role Management
- `GET /api/roles` - Get all roles ✅
- `POST /api/roles` - Create new role ✅
- `POST /api/roles/assign` - Assign role to user ✅
- `POST /api/roles/remove` - Remove role from user ✅

### Workflows
- `GET /api/workflows` - Get all workflows ✅
- `GET /api/workflows/:id` - Get workflow by ID ✅
- `POST /api/workflows` - Create new workflow ✅
- `PUT /api/workflows/:id` - Update workflow ✅
- `GET /api/workflows/versions/:name` - Get workflow versions ✅
- `GET /api/workflows/search` - Search workflows ✅
- `GET /api/workflows/stats` - Get workflow statistics ✅
- `GET /api/workflows/:id/states` - Get workflow states ✅
- `GET /api/workflows/:id/diagram` - Get workflow diagram data ✅
- `POST /api/workflows/:id/start` - Start process from workflow ✅
- `POST /api/workflows/:id/clone` - Clone workflow ✅
- `PATCH /api/workflows/:id/status` - Toggle workflow status ✅
- `DELETE /api/workflows/:id` - Delete workflow ✅
- `POST /api/workflows/:id/form` - Associate form with workflow ❌
- `GET /api/workflows/:workflowId/states/:stateName` - Get state details ✅

### Forms
- `GET /api/forms` - Get all forms 🚧
- `GET /api/forms/:id` - Get form by ID 🚧
- `POST /api/forms` - Create new form 🚧
- `PUT /api/forms/:id` - Update form 🚧
- `DELETE /api/forms/:id` - Delete form 🚧
- `GET /api/forms/versions/:name` - Get form versions 🚧
- `GET /api/forms/name/:name` - Get form by name 🚧
- `POST /api/forms/validate` - Validate form data 🚧
- `PATCH /api/forms/:id/status` - Toggle form status 🚧
- `POST /api/forms/:id/clone` - Clone form 🚧
- `POST /api/forms/:id/workflows` - Associate with workflow 🚧
- `DELETE /api/forms/:id/workflows/:workflowId` - Remove workflow association 🚧
- `GET /api/forms/:id/permissions` - Get form permissions 🚧

### Process Instances
- `POST /api/processes/start` - Start a new process 🚧
- `GET /api/processes` - Get all processes with filters 🚧
- `GET /api/processes/:id` - Get process by ID 🚧
- `POST /api/processes/:id/actions/:action` - Execute action on process 🚧
- `GET /api/processes/:id/history` - Get process history 🚧
- `GET /api/processes/:id/timeline` - Get process timeline 🚧
- `POST /api/processes/:id/comments` - Add comment to process 🚧
- `GET /api/processes/tasks/my` - Get tasks assigned to current user 🚧
- `GET /api/processes/:id/actions` - Get available actions for a process 🚧
- `GET /api/processes/stats` - Get process statistics 🚧
- `POST /api/processes/bulk` - Perform bulk actions on processes 🚧
- `GET /api/processes/:id/export/:format` - Export process to PDF/CSV 🚧
- `POST /api/processes/:id/reassign` - Reassign process to different users 🚧
- `PATCH /api/processes/:id/priority` - Set process priority 🚧
- `PATCH /api/processes/:id/due-date` - Set process due date 🚧

### Documents
- `POST /api/documents/upload` - Upload document 🚧
- `GET /api/documents/:id` - Get document metadata 🚧
- `GET /api/documents/download/:id` - Download document 🚧
- `GET /api/documents/view/:id` - View document 🚧
- `PUT /api/documents/:id` - Update document metadata 🚧
- `POST /api/documents/:id/version` - Upload new version 🚧
- `GET /api/documents/:id/versions` - Get document versions 🚧
- `POST /api/documents/:id/lock` - Lock document 🚧
- `POST /api/documents/:id/unlock` - Unlock document 🚧
- `DELETE /api/documents/:id` - Delete document 🚧
- `PUT /api/documents/:id/permissions` - Set document permissions 🚧
- `POST /api/documents/:documentId/link/:processId` - Link document to process 🚧
- `GET /api/documents/search` - Search documents 🚧

### Folders
- `POST /api/documents/folders` - Create folder 🚧
- `GET /api/documents/folders/:id` - Get folder details 🚧
- `GET /api/documents/folders/:id/contents` - List folder contents 🚧
- `PUT /api/documents/folders/:id` - Update folder 🚧
- `DELETE /api/documents/folders/:id` - Delete folder 🚧

## Development

This project uses a modular architecture with:
- Controllers for API endpoints
- Services for business logic
- Models for data structure
- Middleware for request processing
- Utils for helper functions

## License

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE.md)

This project is licensed under the [Business Source License 1.1](LICENSE.md).

**Key Terms:**
- Licensor: Mykaell Max
- Licensed Work: MPOs_Manage 1.0
- Additional Use Grant: None
- Change Date: None

The Licensor hereby grants you the right to copy, modify, create derivative
works, redistribute, and make non-production use of the Licensed Work.
The Licensor does not grant you rights to use the Licensed Work for
production purposes or to offer it as a service to third parties.

**See [LICENSE.md](LICENSE.md) for the complete license text.**