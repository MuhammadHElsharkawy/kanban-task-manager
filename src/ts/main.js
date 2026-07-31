"use strict";
const App = (() => {
    const openModalBtn = document.getElementById("add-task-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const submitBtn = document.getElementById("submit-btn");
    const modal = document.getElementById("modal-overlay");
    const todoContainer = document.getElementById("tasks-todo");
    const inProgressContainer = document.getElementById("tasks-in-progress");
    const completedContainer = document.getElementById("tasks-completed");
    const columnsContainer = document.getElementById("columns-container");
    const todoCount = document.getElementById("todo-count");
    const inProgressCount = document.getElementById("in-progress-count");
    const completedCount = document.getElementById("completed-count");
    let editTask;
    // Modal DOM
    const modalTitle = document.getElementById("modal-title");
    const taskTitle = document.getElementById("task-title");
    const taskPriority = document.getElementById("task-priority");
    const taskDueDate = document.getElementById("task-due-date");
    const taskDescription = document.getElementById("task-description");
    const titleError = document.getElementById("title-error");
    const dateError = document.getElementById("date-error");
    // LocalStorage Key
    const KEY = "KANBAN-TASKS";
    let tasksList = JSON.parse(localStorage.getItem(KEY) || "[]");
    const MD_Date_Formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    });
    const openModal = (task = null) => {
        if (task)
            prepareModalForEdit(task);
        else
            resetModal();
        modal?.classList.replace("hidden", "flex");
    };
    const closeModal = () => modal?.classList.replace("flex", "hidden");
    const resetModal = () => {
        modalTitle.innerHTML = "Create New Task";
        submitBtn.innerHTML = `<i class="fa-solid fa-plus"></i><span>Add Task</span>`;
        submitBtn.dataset.mode = "add";
        taskTitle.value = "";
        taskPriority.value = "low";
        taskDueDate.value = "";
        taskDescription.value = "";
    };
    const prepareModalForEdit = (task) => {
        modalTitle.innerHTML = "Edit Task";
        submitBtn.innerHTML = `<i class="fa-solid fa-save"></i><span>Save Changes</span>`;
        submitBtn.dataset.mode = "update";
        taskTitle.value = task.title;
        taskPriority.value = task.priority;
        taskDueDate.value = task.date || "";
        taskDescription.value = task.description || "";
    };
    const getTaskById = (taskId) => {
        return tasksList.find((item) => item.id === taskId);
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Validators
    const requiredValidator = (value) => {
        value = value.trim();
        return !(value === null || value === undefined || value === "");
    };
    const minLengthValidator = (value, min) => {
        value = value.trim();
        return !(!!value && value.length < min);
    };
    const dateValidator = (value) => {
        if (!value)
            return true;
        const inputDate = new Date(value);
        return inputDate >= today;
    };
    const addTask = (task) => {
        tasksList.push(task);
        saveToLocalStorage();
        renderTasks();
    };
    const deleteTask = (taskId) => {
        tasksList = tasksList.filter((item) => item.id !== taskId);
        saveToLocalStorage();
        renderTasks();
    };
    const saveToLocalStorage = () => {
        localStorage.setItem(KEY, JSON.stringify(tasksList));
    };
    const getDelayStatus = (date) => {
        const targetDate = new Date(date);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffInMs = targetDate.getTime() - today.getTime();
        const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
        if (diffInDays === 0)
            return { status: "Overdue", style: "overdue" };
        if (diffInDays === 1 || diffInDays === 2)
            return { status: "Due Soon", style: "soon" };
        return null;
    };
    const getFromTimeStatus = (creationTime) => {
        const fromTimeSeconds = Math.floor((Date.now() - Number(creationTime)) / 1000);
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
    const showConfirmDialog = (title, confirmText = "نعم، قم بالحذف!") => {
        return Swal.fire({
            title: title,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: confirmText,
            cancelButtonText: "Cancel",
        });
    };
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
    const renderTasks = () => {
        let todoTasks = [];
        let inProgressTasks = [];
        let completedTasks = [];
        tasksList.forEach((task, index) => {
            if (task.state === "todo")
                todoTasks.push({ ...task, index });
            if (task.state === "in-progress")
                inProgressTasks.push({ ...task, index });
            if (task.state === "completed")
                completedTasks.push({ ...task, index });
        });
        renderTodo(todoTasks);
        renderInProgress(inProgressTasks);
        renderCompleted(completedTasks);
    };
    const renderTodo = (todoTasks) => {
        let box = "";
        if (todoTasks.length === 0) {
            box = `<div class="flex flex-col items-center justify-center py-12 text-slate-400">
              <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
              <p class="text-sm">No tasks yet</p>
              <p class="text-xs mt-1">Click + to add one</p>
            </div>`;
        }
        else {
            todoTasks.forEach((task, index) => {
                if (task.date)
                    getDelayStatus(task.date);
                box += `
        <div class="task-item group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200   "
          data-task-id="${task.id}">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-slate-300"></span>
              <span
                class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">#${task.index + 1}</span>
            </div>
            <div
              class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  data-task-id="${task.id}" title="Edit task">
                  <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
              </button>
              <button
                class="delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                data-task-id="${task.id}" title="Delete task">
                  <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
              </button>
            </div>
          </div>
          <h3 class="font-semibold text-slate-800 mb-2 leading-snug ">
            ${task.title}
          </h3>
          ${task.description
                    ? `<p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">
            ${task.description}
          </p>`
                    : ""}
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span
              class="priority-${task.priority} text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <i class="fa-solid fa-circle text-[6px]"></i>
                ${task.priority} ${task.priority === "high" ? "Priority" : ""}
            </span>
            ${task.date
                    ? `${getDelayStatus(task.date)
                        ? `<span
              class="${getDelayStatus(task.date)?.style} text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                ${getDelayStatus(task.date)?.status === "Overdue" ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ""}
                ${getDelayStatus(task.date)?.status}
            </span>`
                        : ""}`
                    : ""}
          </div>
          <div
            class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
            ${task.date
                    ? `<div class="flex items-center gap-1.5 text-red-500">
              <i class="fa-regular fa-calendar"></i>
              <span>${MD_Date_Formatter.format(new Date(task.date))}</span>
            </div>`
                    : ""}
            <div class="flex items-center gap-1.5" title="Created 7/30/2026, 11:51:54 AM">
              <i class="fa-regular fa-clock"></i>
              <span>${getFromTimeStatus(task.creationDate)}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-amber-100 text-amber-700 hover:bg-amber-200"
              data-task-id="${task.id}" data-status="in-progress">
              <i class="fa-solid fa-play pointer-events-none"></i>
              <span class="pointer-events-none">Start</span>
            </button>
            <button
              class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              data-task-id="${task.id}" data-status="completed">
              <i class="fa-solid fa-check pointer-events-none"></i>
              <span class="pointer-events-none">Complete</span>
            </button>
          </div>
        </div>
        `;
            });
        }
        todoContainer.innerHTML = box;
        todoCount.innerHTML = `${todoTasks.length} tasks`;
    };
    const renderInProgress = (inProgressTasks) => {
        let box = "";
        if (inProgressTasks.length === 0) {
            box = `<div class="flex flex-col items-center justify-center py-12 text-slate-400">
              <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
              <p class="text-sm">No tasks yet</p>
              <p class="text-xs mt-1">Click + to add one</p>
             </div>`;
        }
        else {
            inProgressTasks.forEach((task, index) => {
                if (task.date)
                    getDelayStatus(task.date);
                box += `
        <div class="task-item group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200   "
          data-task-id="${task.id}">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-slate-300"></span>
              <span
                class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">#${task.index + 1}</span>
            </div>
            <div
              class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  data-task-id="${task.id}" title="Edit task">
                  <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
              </button>
              <button
                class="delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                data-task-id="${task.id}" title="Delete task">
                  <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
              </button>
            </div>
          </div>
          <h3 class="font-semibold text-slate-800 mb-2 leading-snug ">
            ${task.title}
          </h3>
          ${task.description
                    ? `<p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">
            ${task.description}
          </p>`
                    : ""}
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span
              class="priority-${task.priority} text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <i class="fa-solid fa-circle text-[6px]"></i>
                ${task.priority} ${task.priority === "high" ? "Priority" : ""}
            </span>
            ${task.date
                    ? `${getDelayStatus(task.date)
                        ? `<span
              class="${getDelayStatus(task.date)?.style} text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                ${getDelayStatus(task.date)?.status === "Overdue" ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ""}
                ${getDelayStatus(task.date)?.status}
            </span>`
                        : ""}`
                    : ""}
          </div>
          <div
            class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
            ${task.date
                    ? `<div class="flex items-center gap-1.5 text-red-500">
              <i class="fa-regular fa-calendar"></i>
              <span>${MD_Date_Formatter.format(new Date(task.date))}</span>
            </div>`
                    : ""}
            <div class="flex items-center gap-1.5" title="Created 7/30/2026, 11:51:54 AM">
              <i class="fa-regular fa-clock"></i>
              <span>${getFromTimeStatus(task.creationDate)}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700"
              data-task-id="${task.id}" data-status="todo">
            <i class="fa-solid fa-arrow-rotate-left pointer-events-none"></i> <span class="pointer-events-none">To Do</span>
          </button>
            <button
              class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              data-task-id="${task.id}" data-status="completed">
              <i class="fa-solid fa-check pointer-events-none"></i>
              <span class="pointer-events-none">Complete</span>
            </button>
          </div>
        </div>
        `;
            });
        }
        inProgressContainer.innerHTML = box;
        inProgressCount.innerHTML = `${inProgressTasks.length} tasks`;
    };
    const renderCompleted = (completedTasks) => {
        let box = "";
        if (completedTasks.length === 0) {
            box = `<div class="flex flex-col items-center justify-center py-12 text-slate-400">
              <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
              <p class="text-sm">No tasks yet</p>
              <p class="text-xs mt-1">Click + to add one</p>
             </div>`;
        }
        else {
            completedTasks.forEach((task, index) => {
                if (task.date)
                    getDelayStatus(task.date);
                box += `
        <div class="task-item group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200   "
          data-task-id="${task.id}">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-slate-300"></span>
              <span
                class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">#${task.index + 1}</span>
            </div>
            <div
              class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  data-task-id="${task.id}" title="Edit task">
                  <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
              </button>
              <button
                class="delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                data-task-id="${task.id}" title="Delete task">
                  <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
              </button>
            </div>
          </div>
          <h3 class="font-semibold text-slate-800 mb-2 leading-snug ">
            ${task.title}
          </h3>
          ${task.description
                    ? `<p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">
            ${task.description}
          </p>`
                    : ""}
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span
              class="priority-${task.priority} text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <i class="fa-solid fa-circle text-[6px]"></i>
                ${task.priority} ${task.priority === "high" ? "Priority" : ""}
            </span>
            ${task.date
                    ? `${getDelayStatus(task.date)
                        ? `<span
              class="${getDelayStatus(task.date)?.style} text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                ${getDelayStatus(task.date)?.status === "Overdue" ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ""}
                ${getDelayStatus(task.date)?.status}
            </span>`
                        : ""}`
                    : ""}
          </div>
          <div
            class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
            ${task.date
                    ? `<div class="flex items-center gap-1.5 text-red-500">
              <i class="fa-regular fa-calendar"></i>
              <span>${MD_Date_Formatter.format(new Date(task.date))}</span>
            </div>`
                    : ""}
            <div class="flex items-center gap-1.5" title="Created 7/30/2026, 11:51:54 AM">
              <i class="fa-regular fa-clock"></i>
              <span>${getFromTimeStatus(task.creationDate)}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
          <button
            class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700"
            data-task-id="${task.id}" data-status="todo">
            <i class="fa-solid fa-arrow-rotate-left pointer-events-none"></i>
            <span class="pointer-events-none">To Do</span>
          </button>
          <button
            class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-amber-100 text-amber-700 hover:bg-amber-200"
            data-task-id="${task.id}" data-status="in-progress">
            <i class="fa-solid fa-play pointer-events-none"></i>
            <span class="pointer-events-none">Start</span>
          </button>
          </div>
        </div>
        `;
            });
        }
        completedContainer.innerHTML = box;
        completedCount.innerHTML = `${completedTasks.length} tasks`;
    };
    renderTasks();
    // Events
    openModalBtn?.addEventListener("click", () => {
        openModal();
    });
    closeModalBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (event) => {
        if (event.target === modal)
            closeModal();
    });
    const changeState = (taskId, state) => {
        const task = getTaskById(taskId);
        if (task) {
            task.state = state;
            const index = tasksList.findIndex((t) => t.id === taskId);
            if (index !== -1)
                tasksList.splice(index, 1, task);
            saveToLocalStorage();
            renderTasks();
        }
    };
    submitBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        let isValidTitle = false;
        let isValidDate = false;
        if (!requiredValidator(taskTitle.value)) {
            titleError.classList.remove("hidden");
            titleError.innerHTML = "Task title is required";
            isValidTitle = false;
        }
        else if (!minLengthValidator(taskTitle.value, 3)) {
            titleError.classList.remove("hidden");
            titleError.innerHTML = "Title must be at least 3 characters";
            isValidTitle = false;
        }
        else
            isValidTitle = true;
        taskTitle.addEventListener("input", () => {
            titleError.innerHTML = "";
            titleError.classList.add("hidden");
        });
        if (!dateValidator(taskDueDate.value)) {
            dateError.classList.remove("hidden");
            dateError.innerHTML = "Due date cannot be in the past";
            isValidDate = false;
        }
        else
            isValidDate = true;
        taskDueDate.addEventListener("click", () => {
            dateError.innerHTML = "";
            dateError.classList.add("hidden");
        });
        if (isValidTitle && isValidDate) {
            const btn = event.currentTarget;
            if (btn.dataset.mode === "add") {
                const taskObj = {
                    title: taskTitle.value,
                    priority: taskPriority.value,
                    date: taskDueDate.value,
                    description: taskDescription.value,
                    creationDate: Date.now().toString(),
                    id: `task-${Date.now().toString()}`,
                    state: "todo",
                };
                addTask(taskObj);
                showSuccessToast("Task added successfully!");
            }
            else {
                editTask.title = taskTitle.value;
                editTask.description = taskDescription.value;
                editTask.priority = taskPriority.value;
                editTask.date = taskDueDate.value;
                const index = tasksList.findIndex((t) => t.id === editTask.id);
                if (index !== -1)
                    tasksList.splice(index, 1, editTask);
                saveToLocalStorage();
                renderTasks();
                showSuccessToast("Task updated successfully!");
            }
            closeModal();
        }
    });
    columnsContainer?.addEventListener("click", async (event) => {
        event.stopPropagation();
        const target = event.target;
        const deleteBtn = target.closest(".delete-btn");
        const updateBtn = target.closest(".edit-btn");
        const goToInProgressBtn = target.closest('button[data-status="in-progress"]');
        const goToInCompletedBtn = target.closest('button[data-status="completed"]');
        const goToTodoBtn = target.closest('button[data-status="todo"]');
        if (deleteBtn) {
            const result = await showConfirmDialog("Delete this task?", "Yes, delete it!");
            if (result.isConfirmed) {
                if (target.dataset.taskId)
                    deleteTask(target.dataset.taskId);
            }
        }
        if (updateBtn) {
            if (target.dataset.taskId) {
                let task = getTaskById(target.dataset.taskId);
                if (task) {
                    openModal(task);
                    editTask = task;
                }
            }
        }
        if (goToInProgressBtn) {
            if (goToInProgressBtn.dataset.taskId) {
                changeState(goToInProgressBtn.dataset.taskId, "in-progress");
            }
        }
        if (goToInCompletedBtn) {
            if (goToInCompletedBtn.dataset.taskId) {
                changeState(goToInCompletedBtn.dataset.taskId, "completed");
            }
        }
        if (goToTodoBtn) {
            if (goToTodoBtn.dataset.taskId) {
                changeState(goToTodoBtn.dataset.taskId, "todo");
            }
        }
    });
})();
