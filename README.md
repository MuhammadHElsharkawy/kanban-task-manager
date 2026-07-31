# Kanban Task Manager

A clean, responsive Kanban-style task management application built with
**Vanilla TypeScript**, **Tailwind CSS**, **Font Awesome**, and
**SweetAlert2**.

The application provides a simple CRUD workflow for managing tasks
across three stages:

**To Do → In Progress → Completed**

It uses browser `localStorage` for persistence, includes client-side
validation, confirmation dialogs, toast notifications, relative creation
times, task priorities, due-date status indicators, and an accessible
task modal.

------------------------------------------------------------------------

## 🌐 Demo

### Live Demo

**[🚀 View Live Demo](https://kanban-task-manager-bice.vercel.app/)**

### Repository

**[💻 View Source Code](https://github.com/MuhammadHElsharkawy/kanban-task-manager)**

------------------------------------------------------------------------

## ✨ Features

### Task Management

-   Create new tasks
-   Edit existing tasks
-   Delete tasks with confirmation
-   Move tasks between:
    -   To Do
    -   In Progress
    -   Completed
-   Persist tasks in browser `localStorage`

### Task Information

Each task can contain: - Title - Priority - Due date - Description -
Current status - Creation timestamp

### Validation

-   Required task title
-   Minimum title length
-   Due date cannot be in the past
-   Description character counter
-   Accessible validation feedback using `aria-invalid`,
    `aria-describedby`, and alert regions

### Status & Date Feedback

-   `Overdue` indicator for past due dates
-   `Due Soon` indicator for tasks due within two days
-   Completed tasks do not display overdue/due-soon indicators
-   Relative creation time such as:
    -   `Just now`
    -   `5m ago`
    -   `2h ago`
    -   `3d ago`

### UI / UX

-   Responsive Kanban layout
-   Empty-state messages for columns without tasks
-   Hover-based task actions
-   Toast notifications for successful/error operations
-   SweetAlert2 confirmation dialog before deletion
-   Keyboard-friendly modal behavior
-   Escape key support for closing the modal
-   Focus management when opening and closing the modal

### Data Safety

-   Runtime validation of data loaded from `localStorage`
-   Safe fallback when stored JSON is invalid or corrupted
-   HTML escaping before user-controlled values are inserted into
    rendered HTML

------------------------------------------------------------------------

## 🛠️ Tech Stack

  -----------------------------------------------------------------------
  Technology                          Purpose
  ----------------------------------- -----------------------------------
  **HTML5**                           Semantic page structure and forms

  **TypeScript**                      Application logic, types,
                                      validation, and state handling

  **Tailwind CSS**                    Utility-first styling and
                                      responsive layout

  **Font Awesome**                    UI icons

  **SweetAlert2**                     Confirmation dialogs and toast
                                      notifications

  **localStorage**                    Client-side task persistence
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 📁 Project Structure

``` text
APP/
│
├── src/
│   ├── css/
│   │   ├── input.css
│   │   └── output.css
│   │
│   ├── images/
│   │   └── Vite.js.svg
│   │
│   └── ts/
│       ├── main.ts
│       └── main.js
│
├── .gitignore
├── index.html
├── package.json
└── package-lock.json
```

### Directory Responsibilities

#### `src/ts/`

Contains the application logic.

-   `main.ts` --- TypeScript source containing:
    -   Task types and constants
    -   `localStorage` data layer
    -   Validation utilities
    -   Modal/form handling
    -   Task rendering
    -   Event handling
    -   Toast and confirmation feedback
-   `main.js` --- compiled JavaScript output used by the browser.

#### `src/css/`

Contains Tailwind CSS source and generated output.

-   `input.css` --- Tailwind input/source file
-   `output.css` --- compiled CSS consumed by `index.html`

#### `src/images/`

Static image assets used by the application.

#### `index.html`

Main application entry point and UI structure.

------------------------------------------------------------------------

## 🧠 Application Architecture

The application keeps the project lightweight while separating
responsibilities inside `main.ts`.

``` text
                    ┌─────────────────────┐
                    │      index.html     │
                    │    DOM / UI layer   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       main.ts       │
                    ├─────────────────────┤
                    │ Types & Constants   │
                    │ Data / Storage      │
                    │ Validation          │
                    │ Modal / Form UI     │
                    │ Rendering           │
                    │ Event Handling      │
                    └───────┬─────┬───────┘
                            │     │
                 ┌──────────┘     └──────────┐
                 ▼                           ▼
        ┌─────────────────┐        ┌─────────────────┐
        │  localStorage   │        │      DOM        │
        │ Task persistence │       │ Rendered board  │
        └─────────────────┘        └─────────────────┘
```

The rendering logic follows a reusable structure:

``` text
renderTasks()
     │
     ├── renderColumn() ──► To Do
     │
     ├── renderColumn() ──► In Progress
     │
     └── renderColumn() ──► Completed
                │
                ▼
        createTaskCard()
```

This avoids maintaining three separate, duplicated task-card rendering
implementations.

------------------------------------------------------------------------

## 📦 Task Data Model

Tasks are represented using TypeScript types:

``` ts
type TaskState = "todo" | "in-progress" | "completed";
type TaskPriority = "low" | "medium" | "high";

interface Task {
  title: string;
  priority: TaskPriority;
  date?: string;
  description?: string;
  state: TaskState;
  id: string;
  creationDate: string;
}
```

The application also centralizes task states and priorities:

``` ts
const TASK_STATE = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
} as const;

const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;
```

This reduces repeated magic strings and makes state transitions easier
to maintain.

------------------------------------------------------------------------

## 💾 Data Persistence

Tasks are stored under the following localStorage key:

``` text
KANBAN-TASKS
```

The application safely loads persisted data using:

1.  `localStorage.getItem()`
2.  `JSON.parse()`
3.  Runtime task validation
4.  Safe fallback to an empty array when data is invalid

Saving is also wrapped in error handling so storage failures do not
silently break the application.

> **Note:** Data is stored locally in the current browser. Clearing
> browser storage will remove the saved tasks.

------------------------------------------------------------------------

## 🔄 Task Workflow

``` text
┌─────────┐
│  To Do  │
└────┬────┘
     │ Start
     ▼
┌─────────────┐
│ In Progress │
└──────┬──────┘
       │ Complete
       ▼
┌───────────┐
│ Completed │
└───────────┘
```

Tasks can also be moved back to previous states when required by the UI.

------------------------------------------------------------------------

## ✅ Validation Rules

  Field         Rule
  ------------- ------------------------
  Title         Required
  Title         Minimum 3 characters
  Due date      Optional
  Due date      Cannot be in the past
  Description   Optional
  Description   Maximum 500 characters

Validation errors are displayed directly next to the corresponding
fields.

------------------------------------------------------------------------

## 🎨 Priority System

Tasks support three priority levels:

-   **Low**
-   **Medium**
-   **High**

Priority values are strongly typed in TypeScript to prevent invalid
values from being assigned accidentally.

------------------------------------------------------------------------

## ⏰ Due-Date Status

Tasks are evaluated against the current date.

``` text
Past date        → Overdue
Today / next 2d  → Due Soon
Later            → No delay badge
```

Completed tasks intentionally skip the delay-status badge because their
workflow state already indicates completion.

------------------------------------------------------------------------

## ♿ Accessibility

The UI includes several accessibility improvements:

-   Proper `<label>` / input associations
-   Dialog semantics using:
    -   `role="dialog"`
    -   `aria-modal="true"`
    -   `aria-labelledby`
-   `aria-describedby` for validation messages
-   `aria-invalid` for invalid fields
-   Alert regions for validation feedback
-   Accessible names for icon-only buttons
-   Decorative icons marked with `aria-hidden="true"`
-   Escape key support for closing the modal
-   Focus placed in the title field when the modal opens
-   Focus returned to the create-task trigger when the modal closes

------------------------------------------------------------------------

## 🔐 Security Considerations

Because task data is user-controlled and rendered dynamically, the
application escapes task values before inserting them into HTML.

For example:

``` ts
const safeTitle = escapeHtml(task.title);
const safeDescription = escapeHtml(task.description ?? "");
```

This helps prevent user-entered HTML from being interpreted as markup
when task cards are rendered.

The application also validates data loaded from `localStorage` at
runtime instead of assuming that parsed JSON is automatically a valid
`Task[]`.

------------------------------------------------------------------------

## 🚀 Getting Started

### 1. Clone the project

``` bash
git clone <your-repository-url>
cd <project-folder>
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Run the project

Use your configured local development environment / TypeScript build
process to compile `main.ts` to `main.js` and Tailwind's `input.css` to
`output.css`.

Then serve the project through a local HTTP server and open
`index.html`.

> The current project structure contains the generated `main.js` and
> `output.css` files consumed by the HTML page.

### 4. Start using the application

Click the **+** button to create a task.

From each task card you can: - Edit the task - Delete the task - Move it
to another status

------------------------------------------------------------------------

## 🧩 Main Functions

Some of the key functions in `main.ts` include:

### Data Layer

``` ts
loadTasks()
saveTasks()
getTaskById()
createTask()
updateTask()
deleteTask()
changeTaskState()
```

### Validation / Utilities

``` ts
requiredValidator()
minLengthValidator()
dateValidator()
getDelayStatus()
getFromTimeStatus()
escapeHtml()
```

### Rendering

``` ts
renderTasks()
renderColumn()
createTaskCard()
renderStatusButton()
```

### Modal / Form

``` ts
openModal()
closeModal()
resetModal()
prepareModalForEdit()
validateForm()
clearValidationErrors()
```

------------------------------------------------------------------------

## 📈 Future Improvements

The current implementation is intentionally lightweight. Possible next
steps include:

### Architecture

-   Split `main.ts` into dedicated modules:
    -   `types.ts`
    -   `storage.ts`
    -   `validators.ts`
    -   `render.ts`
    -   `events.ts`
    -   `main.ts`

### Testing

-   Add unit tests for:
    -   Validators
    -   Date calculations
    -   Task storage
    -   Task state transitions

### UX

-   Add undo for destructive actions
-   Add search and filtering
-   Add task sorting
-   Automatically refresh relative timestamps
-   Add drag-and-drop between Kanban columns

### Performance

-   Render only the affected column after mutations
-   Avoid unnecessary DOM replacement as the number of tasks grows

### Tooling

-   Add a dedicated build script
-   Add ESLint
-   Add Prettier
-   Add strict TypeScript configuration
-   Add a test runner such as Vitest

------------------------------------------------------------------------

## 📌 Current Scope

This project is designed as a lightweight client-side Kanban task
manager.

It does **not** currently include:

-   User authentication
-   Backend/API
-   Database
-   Multi-user synchronization
-   Server-side persistence
-   Real-time collaboration

All task data is stored locally in the browser.

------------------------------------------------------------------------

## 👨‍💻 Development Notes

The codebase was refactored around a few core maintainability
principles:

1.  **Single source of truth for task states and priorities**
2.  **Reusable rendering functions instead of duplicated column
    renderers**
3.  **Explicit edit state using `editingTaskId`**
4.  **Runtime validation for persisted data**
5.  **Typed task and validation logic**
6.  **Escaping user-controlled content before HTML rendering**
7.  **Clear separation of data, validation, UI, and rendering
    responsibilities**

The goal is to keep the application simple enough for a vanilla
TypeScript project while avoiding unnecessary duplication and fragile
state management.

------------------------------------------------------------------------

## 📄 License

This project is intended for educational and portfolio purposes.

If you plan to publish it publicly, add the license that best matches
your intended usage.
