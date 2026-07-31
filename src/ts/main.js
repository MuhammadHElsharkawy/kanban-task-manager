"use strict";
// ============================================================
// Types
// ============================================================
// ============================================================
// Constants
// ============================================================
const TASK_STATE = {
    TODO: "todo",
    IN_PROGRESS: "in-progress",
    COMPLETED: "completed",
};
const TASK_PRIORITY = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
};
const STORAGE_KEY = "KANBAN-TASKS";
const MAX_DESCRIPTION_LENGTH = 500;
// ============================================================
// DOM references
// ============================================================
const openModalBtn = document.getElementById("add-task-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelBtn = document.getElementById("cancel-btn");
const submitBtn = document.getElementById("submit-btn");
const modal = document.getElementById("modal-overlay");
const taskForm = document.getElementById("task-form");
const todoContainer = document.getElementById("tasks-todo");
const inProgressContainer = document.getElementById("tasks-in-progress");
const completedContainer = document.getElementById("tasks-completed");
const columnsContainer = document.getElementById("columns-container");
const todoCount = document.getElementById("todo-count");
const inProgressCount = document.getElementById("in-progress-count");
const completedCount = document.getElementById("completed-count");
const modalTitle = document.getElementById("modal-title");
const taskTitle = document.getElementById("task-title");
const taskPriority = document.getElementById("task-priority");
const taskDueDate = document.getElementById("task-due-date");
const taskDescription = document.getElementById("task-description");
const titleError = document.getElementById("title-error");
const dateError = document.getElementById("date-error");
const descriptionError = document.getElementById("description-error");
const charCount = document.getElementById("char-count");
// ============================================================
// Storage / data layer
// ============================================================
const isTaskState = (value) => {
    return (value === TASK_STATE.TODO ||
        value === TASK_STATE.IN_PROGRESS ||
        value === TASK_STATE.COMPLETED);
};
const isTaskPriority = (value) => {
    return (value === TASK_PRIORITY.LOW ||
        value === TASK_PRIORITY.MEDIUM ||
        value === TASK_PRIORITY.HIGH);
};
const isTask = (value) => {
    if (!value || typeof value !== "object")
        return false;
    const task = value;
    return (typeof task.title === "string" &&
        isTaskPriority(task.priority) &&
        (task.date === undefined || typeof task.date === "string") &&
        (task.description === undefined || typeof task.description === "string") &&
        isTaskState(task.state) &&
        typeof task.id === "string" &&
        typeof task.creationDate === "string");
};
const loadTasks = () => {
    try {
        const storedTasks = localStorage.getItem(STORAGE_KEY);
        if (!storedTasks)
            return [];
        const parsed = JSON.parse(storedTasks);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(isTask);
    }
    catch (error) {
        console.error("Failed to load tasks from localStorage:", error);
        return [];
    }
};
const saveTasks = (tasks) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
    catch (error) {
        console.error("Failed to save tasks to localStorage:", error);
        showErrorToast("Could not save your changes.");
    }
};
let tasksList = loadTasks();
let editingTaskId = null;
const getTaskById = (taskId) => {
    return tasksList.find((task) => task.id === taskId);
};
const createTask = (task) => {
    tasksList.push(task);
    saveTasks(tasksList);
    renderTasks();
};
const updateTask = (taskId, updates) => {
    const task = getTaskById(taskId);
    if (!task)
        return;
    Object.assign(task, updates);
    saveTasks(tasksList);
    renderTasks();
};
const deleteTask = (taskId) => {
    const nextTasks = tasksList.filter((task) => task.id !== taskId);
    if (nextTasks.length === tasksList.length)
        return;
    tasksList = nextTasks;
    saveTasks(tasksList);
    renderTasks();
};
const changeTaskState = (taskId, state) => {
    const task = getTaskById(taskId);
    if (!task)
        return;
    task.state = state;
    saveTasks(tasksList);
    renderTasks();
};
// ============================================================
// Validation / formatting utilities
// ============================================================
const requiredValidator = (value) => {
    return value.trim().length > 0;
};
const minLengthValidator = (value, min) => {
    const trimmedValue = value.trim();
    return trimmedValue.length === 0 || trimmedValue.length >= min;
};
const dateValidator = (value) => {
    if (!value)
        return true;
    const inputDate = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
};
const getDelayStatus = (date) => {
    if (!date)
        return null;
    const targetDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffInMs = targetDate.getTime() - today.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays < 0) {
        return { status: "Overdue", style: "overdue" };
    }
    if (diffInDays <= 2) {
        return { status: "Due Soon", style: "soon" };
    }
    return null;
};
const getFromTimeStatus = (creationTime) => {
    const fromTimeSeconds = Math.max(0, Math.floor((Date.now() - Number(creationTime)) / 1000));
    if (fromTimeSeconds < 60)
        return "Just now";
    const fromTimeMinutes = Math.floor(fromTimeSeconds / 60);
    if (fromTimeMinutes < 60)
        return `${fromTimeMinutes}m ago`;
    const fromTimeHours = Math.floor(fromTimeMinutes / 60);
    if (fromTimeHours < 24)
        return `${fromTimeHours}h ago`;
    const fromTimeDays = Math.floor(fromTimeHours / 24);
    return `${fromTimeDays}d ago`;
};
const escapeHtml = (value) => {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
};
const MD_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
});
const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    background: "#00BC7D",
    color: "#fff",
});
const showSuccessToast = (title) => {
    Toast.fire({ icon: "success", title });
};
const showErrorToast = (title) => {
    Toast.fire({ icon: "error", title });
};
const showConfirmDialog = (title, confirmText = "Yes, delete it!") => {
    return Swal.fire({
        title,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6b7280",
        confirmButtonText: confirmText,
        cancelButtonText: "Cancel",
    });
};
// ============================================================
// Modal / form UI
// ============================================================
const clearValidationErrors = () => {
    titleError.textContent = "";
    dateError.textContent = "";
    descriptionError.textContent = "";
    titleError.classList.add("hidden");
    dateError.classList.add("hidden");
    descriptionError.classList.add("hidden");
    taskTitle.setAttribute("aria-invalid", "false");
    taskDueDate.setAttribute("aria-invalid", "false");
    taskDescription.setAttribute("aria-invalid", "false");
};
const resetModal = () => {
    editingTaskId = null;
    modalTitle.textContent = "Create New Task";
    submitBtn.innerHTML = `<i class="fa-solid fa-plus"></i><span>Add Task</span>`;
    taskTitle.value = "";
    taskPriority.value = TASK_PRIORITY.LOW;
    taskDueDate.value = "";
    taskDescription.value = "";
    clearValidationErrors();
    updateCharacterCount();
};
const prepareModalForEdit = (task) => {
    editingTaskId = task.id;
    modalTitle.textContent = "Edit Task";
    submitBtn.innerHTML = `<i class="fa-solid fa-save"></i><span>Save Changes</span>`;
    taskTitle.value = task.title;
    taskPriority.value = task.priority;
    taskDueDate.value = task.date ?? "";
    taskDescription.value = task.description ?? "";
    clearValidationErrors();
    updateCharacterCount();
};
const openModal = (task = null) => {
    if (task) {
        prepareModalForEdit(task);
    }
    else {
        resetModal();
    }
    modal.classList.replace("hidden", "flex");
    taskTitle.focus();
};
const closeModal = () => {
    modal.classList.replace("flex", "hidden");
    editingTaskId = null;
    openModalBtn.focus();
};
const updateCharacterCount = () => {
    charCount.textContent = `${taskDescription.value.length}/${MAX_DESCRIPTION_LENGTH}`;
};
const showValidationError = (input, errorElement, message) => {
    input.setAttribute("aria-invalid", "true");
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
};
const validateForm = () => {
    clearValidationErrors();
    let isValid = true;
    if (!requiredValidator(taskTitle.value)) {
        showValidationError(taskTitle, titleError, "Task title is required");
        isValid = false;
    }
    else if (!minLengthValidator(taskTitle.value, 3)) {
        showValidationError(taskTitle, titleError, "Title must be at least 3 characters");
        isValid = false;
    }
    if (!dateValidator(taskDueDate.value)) {
        showValidationError(taskDueDate, dateError, "Due date cannot be in the past");
        isValid = false;
    }
    return isValid;
};
// ============================================================
// Rendering / view layer
// ============================================================
const emptyColumnTemplate = () => `
  <div class="flex flex-col items-center justify-center py-12 text-slate-400">
    <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50" aria-hidden="true"></i>
    <p class="text-sm">No tasks yet</p>
    <p class="text-xs mt-1">Click + to add one</p>
  </div>
`;
const renderStatusButton = (taskId, action) => {
    const buttonConfig = {
        todo: {
            status: TASK_STATE.TODO,
            label: "To Do",
            icon: "fa-arrow-rotate-left",
            classes: "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700",
        },
        start: {
            status: TASK_STATE.IN_PROGRESS,
            label: "Start",
            icon: "fa-play",
            classes: "bg-amber-100 text-amber-700 hover:bg-amber-200",
        },
        complete: {
            status: TASK_STATE.COMPLETED,
            label: "Complete",
            icon: "fa-check",
            classes: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
        },
    };
    const config = buttonConfig[action];
    return `
    <button
      type="button"
      class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 ${config.classes}"
      data-task-id="${escapeHtml(taskId)}"
      data-status="${config.status}"
      aria-label="${config.label} task"
    >
      <i class="fa-solid ${config.icon} pointer-events-none" aria-hidden="true"></i>
      <span class="pointer-events-none">${config.label}</span>
    </button>
  `;
};
const createTaskCard = (renderableTask, actions) => {
    const { task, index } = renderableTask;
    const delayStatus = task.state === TASK_STATE.COMPLETED ? null : getDelayStatus(task.date);
    const safeTitle = escapeHtml(task.title);
    const safeDescription = escapeHtml(task.description ?? "");
    const safePriority = escapeHtml(task.priority);
    const safeTaskId = escapeHtml(task.id);
    const priorityLabel = task.priority === TASK_PRIORITY.HIGH ? "Priority" : "";
    const delayBadge = delayStatus
        ? `
      <span
        class="${delayStatus.style} text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1"
      >
        ${delayStatus.status === "Overdue"
            ? '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>'
            : ""}
        ${delayStatus.status}
      </span>
    `
        : "";
    const dateBadge = task.date
        ? `
      <div class="flex items-center gap-1.5 text-red-500">
        <i class="fa-regular fa-calendar" aria-hidden="true"></i>
        <span>${MD_DATE_FORMATTER.format(new Date(`${task.date}T00:00:00`))}</span>
      </div>
    `
        : "";
    const description = task.description
        ? `
      <p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">
        ${safeDescription}
      </p>
    `
        : "";
    return `
    <div
      class="task-item group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200"
      data-task-id="${safeTaskId}"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-slate-300" aria-hidden="true"></span>
          <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            #${index + 1}
          </span>
        </div>

        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            class="edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            data-task-id="${safeTaskId}"
            title="Edit task"
            aria-label="Edit task"
          >
            <i class="fa-solid fa-pen text-xs pointer-events-none" aria-hidden="true"></i>
          </button>

          <button
            type="button"
            class="delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            data-task-id="${safeTaskId}"
            title="Delete task"
            aria-label="Delete task"
          >
            <i class="fa-solid fa-trash-can text-xs pointer-events-none" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <h3 class="font-semibold text-slate-800 mb-2 leading-snug">
        ${safeTitle}
      </h3>

      ${description}

      <div class="flex flex-wrap items-center gap-2 mb-4">
        <span
          class="priority-${safePriority} text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide"
        >
          <i class="fa-solid fa-circle text-[6px]" aria-hidden="true"></i>
          ${safePriority} ${priorityLabel}
        </span>
        ${delayBadge}
      </div>

      <div class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
        ${dateBadge}

        <div
          class="flex items-center gap-1.5"
          title="Created ${new Date(Number(task.creationDate)).toLocaleString()}"
        >
          <i class="fa-regular fa-clock" aria-hidden="true"></i>
          <span>${getFromTimeStatus(task.creationDate)}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        ${actions.map((action) => renderStatusButton(safeTaskId, action)).join("")}
      </div>
    </div>
  `;
};
const renderColumn = (tasks, container, countElement, actions) => {
    countElement.textContent = `${tasks.length} tasks`;
    if (tasks.length === 0) {
        container.innerHTML = emptyColumnTemplate();
        return;
    }
    container.innerHTML = tasks
        .map((renderableTask) => createTaskCard(renderableTask, actions))
        .join("");
};
const renderTasks = () => {
    const todoTasks = [];
    const inProgressTasks = [];
    const completedTasks = [];
    tasksList.forEach((task, index) => {
        const renderableTask = { task, index };
        switch (task.state) {
            case TASK_STATE.TODO:
                todoTasks.push(renderableTask);
                break;
            case TASK_STATE.IN_PROGRESS:
                inProgressTasks.push(renderableTask);
                break;
            case TASK_STATE.COMPLETED:
                completedTasks.push(renderableTask);
                break;
        }
    });
    renderColumn(todoTasks, todoContainer, todoCount, ["start", "complete"]);
    renderColumn(inProgressTasks, inProgressContainer, inProgressCount, [
        "todo",
        "complete",
    ]);
    renderColumn(completedTasks, completedContainer, completedCount, [
        "todo",
        "start",
    ]);
};
// ============================================================
// Event handlers
// ============================================================
const handleSubmit = () => {
    if (!validateForm())
        return;
    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const priority = taskPriority.value;
    const date = taskDueDate.value || undefined;
    if (!isTaskPriority(priority)) {
        showErrorToast("Invalid priority selected.");
        return;
    }
    if (editingTaskId) {
        updateTask(editingTaskId, {
            title,
            description,
            priority,
            date,
        });
        showSuccessToast("Task updated successfully!");
    }
    else {
        const task = {
            title,
            priority,
            date,
            description,
            creationDate: Date.now().toString(),
            id: `task-${Date.now()}`,
            state: TASK_STATE.TODO,
        };
        createTask(task);
        showSuccessToast("Task added successfully!");
    }
    closeModal();
};
const handleColumnClick = async (event) => {
    const target = event.target;
    const deleteButton = target.closest(".delete-btn");
    const editButton = target.closest(".edit-btn");
    const statusButton = target.closest(".status-btn");
    if (deleteButton) {
        const taskId = deleteButton.dataset.taskId;
        if (!taskId)
            return;
        const result = await showConfirmDialog("Delete this task?");
        if (result.isConfirmed) {
            deleteTask(taskId);
        }
        return;
    }
    if (editButton) {
        const taskId = editButton.dataset.taskId;
        if (!taskId)
            return;
        const task = getTaskById(taskId);
        if (task)
            openModal(task);
        return;
    }
    if (statusButton) {
        const taskId = statusButton.dataset.taskId;
        const state = statusButton.dataset.status;
        if (!taskId || !isTaskState(state))
            return;
        changeTaskState(taskId, state);
    }
};
// ============================================================
// Event wiring
// ============================================================
openModalBtn.addEventListener("click", () => openModal());
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
    if (event.target === modal)
        closeModal();
});
taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
});
taskTitle.addEventListener("input", () => {
    titleError.textContent = "";
    titleError.classList.add("hidden");
    taskTitle.setAttribute("aria-invalid", "false");
});
taskDueDate.addEventListener("input", () => {
    dateError.textContent = "";
    dateError.classList.add("hidden");
    taskDueDate.setAttribute("aria-invalid", "false");
});
taskDescription.addEventListener("input", () => {
    descriptionError.textContent = "";
    descriptionError.classList.add("hidden");
    taskDescription.setAttribute("aria-invalid", "false");
    updateCharacterCount();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
    }
});
columnsContainer.addEventListener("click", (event) => {
    void handleColumnClick(event);
});
// Initial render
renderTasks();
