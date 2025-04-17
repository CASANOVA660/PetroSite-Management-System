# Tasks Module

This module handles all task-related functionality in the Petroleum application, including:

1. **Personal Tasks** - Tasks created by users for themselves
2. **Action Tasks** - Tasks generated automatically from project actions
3. **Global Action Tasks** - Tasks generated from global actions

## Features

- Task creation and management
- Task status workflow (todo → inProgress → inReview → done)
- Manager validation workflow
- Comments for task communication
- File uploads with Cloudinary integration
- Project document integration for approved files
- Subtasks for granular progress tracking
- Automatic task archiving
- Redis caching for performance

## Task Status Workflow

- Default status: "todo"
- Responsible person can change status to: "todo", "inProgress", "inReview"
- When status is "inReview", manager gets notification
- Manager can accept (→ "done"), decline, or return task with feedback

## File Management

- Files can be uploaded to tasks
- Manager can approve files
- When a task is marked as "done", all approved files are stored in the appropriate project document categories
- Uses Cloudinary for storage

## Notification System

- Notifications are sent when:
  - Tasks are assigned
  - Comments are added
  - Tasks are ready for review
  - Tasks are accepted/declined/returned
- Uses existing notification module
- Real-time updates via socket.io

## Caching Strategy

- Uses Redis for caching frequently accessed data
- User tasks are cached for better performance
- Cache is invalidated automatically when data changes

## API Endpoints

### User Tasks
- `GET /api/tasks/user` - Get all tasks for the current user
- `GET /api/tasks/history` - Get task history

### Personal Tasks
- `POST /api/tasks/personal` - Create a personal task

### Task Management
- `PATCH /api/tasks/:taskId/status` - Update task status
- `PATCH /api/tasks/:taskId/progress` - Update task progress
- `POST /api/tasks/:taskId/comments` - Add comment to task
- `POST /api/tasks/:taskId/files` - Upload file to task
- `PATCH /api/tasks/:taskId/files/:fileId/approve` - Approve file
- `PATCH /api/tasks/:taskId/subtasks/:subtaskId/toggle` - Toggle subtask completion
- `POST /api/tasks/:taskId/subtasks` - Add subtask
- `POST /api/tasks/:taskId/review` - Review task (accept/decline/return)

### Maintenance
- `POST /api/tasks/archive` - Archive old tasks

## Integration with Other Modules

- **Actions Module** - Tasks are generated from project actions
- **Global Actions Module** - Tasks are generated from global actions
- **Documents Module** - Approved files are stored as project documents
- **Notifications Module** - Notifications are sent for task events
- **Users Module** - Tasks are assigned to users 