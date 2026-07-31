interface iTask {
  title: string;
  priority: string;
  date?: string;
  description?: string;
  state: "todo" | "in-progress" | "completed";
  id: string;
  creationDate: string;
  index?: number;
}

interface iDelayStatus {
  status: "Overdue" | "Due Soon";
  style: "overdue" | "soon";
}

const App = (() => {
  const openModalBtn = document.getElementById(
    "add-task-btn",
  ) as HTMLButtonElement;
  const closeModalBtn = document.getElementById(
    "close-modal-btn",
  ) as HTMLButtonElement;
  const cancelBtn = document.getElementById("cancel-btn") as HTMLButtonElement;
  const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
  const modal = document.getElementById("modal-overlay") as HTMLElement;
  const todoContainer = document.getElementById("tasks-todo") as HTMLElement;
  const inProgressContainer = document.getElementById(
    "tasks-in-progress",
  ) as HTMLElement;
  const completedContainer = document.getElementById(
    "tasks-completed",
  ) as HTMLElement;
  const columnsContainer = document.getElementById(
    "columns-container",
  ) as HTMLElement;
  const todoCount = document.getElementById("todo-count") as HTMLElement;
  const inProgressCount = document.getElementById(
    "in-progress-count",
  ) as HTMLElement;
  const completedCount = document.getElementById(
    "completed-count",
  ) as HTMLElement;

  let editTask: iTask;

  // Modal DOM
  const modalTitle = document.getElementById("modal-title") as HTMLElement;
  const taskTitle = document.getElementById("task-title") as HTMLInputElement;
  const taskPriority = document.getElementById(
    "task-priority",
  ) as HTMLInputElement;
  const taskDueDate = document.getElementById(
    "task-due-date",
  ) as HTMLInputElement;
  const taskDescription = document.getElementById(
    "task-description",
  ) as HTMLInputElement;
  const titleError = document.getElementById("title-error") as HTMLElement;
  const dateError = document.getElementById("date-error") as HTMLElement;

  // LocalStorage Key
  const KEY: string = "KANBAN-TASKS";

  let tasksList: iTask[] = JSON.parse(localStorage.getItem(KEY) || "[]");
  const MD_Date_Formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  const openModal = (task: iTask | null = null) => {
    if (task) prepareModalForEdit(task);
    else resetModal();

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

  const prepareModalForEdit = (task: iTask) => {
    modalTitle.innerHTML = "Edit Task";
    submitBtn.innerHTML = `<i class="fa-solid fa-save"></i><span>Save Changes</span>`;
    submitBtn.dataset.mode = "update";
    taskTitle.value = task.title;
    taskPriority.value = task.priority;
    taskDueDate.value = task.date || "";
    taskDescription.value = task.description || "";
  };

  const getTaskById = (taskId: string): iTask | undefined => {
    return tasksList.find((item) => item.id === taskId);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Validators
  const requiredValidator = (value: any): boolean => {
    value = value.trim();
    return !(value === null || value === undefined || value === "");
  };

  const minLengthValidator = (value: string, min: number): boolean => {
    value = value.trim();
    return !(!!value && value.length < min);
  };

  const dateValidator = (value: string): boolean => {
    if (!value) return true;
    const inputDate: Date = new Date(value);
    return inputDate >= today;
  };

  const addTask = (task: iTask) => {
    tasksList.push(task);
    saveToLocalStorage();
    renderTasks();
  };

  const deleteTask = (taskId: string) => {
    tasksList = tasksList.filter((item) => item.id !== taskId);
    saveToLocalStorage();
    renderTasks();
  };

  const saveToLocalStorage = () => {
    localStorage.setItem(KEY, JSON.stringify(tasksList));
  };

  const getDelayStatus = (date: string): iDelayStatus | null => {
    const targetDate = new Date(date);
    const today = new Date();

    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffInMs = targetDate.getTime() - today.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return { status: "Overdue", style: "overdue" };
    if (diffInDays === 1 || diffInDays === 2)
      return { status: "Due Soon", style: "soon" };
    return null;
  };

  const getFromTimeStatus = (creationTime: string): string => {
    const fromTimeSeconds: number = Math.floor(
      (Date.now() - Number(creationTime)) / 1000,
    );
    if (fromTimeSeconds < 60) return "Just now";
    const fromTimeMinutes: number = Math.floor(fromTimeSeconds / 60);
    if (fromTimeMinutes < 60) return `${fromTimeMinutes}m ago`;
    const fromTimeHours: number = Math.floor(fromTimeMinutes / 60);
    if (fromTimeHours < 24) return `${fromTimeHours}h ago`;
    const fromTimeDays: number = Math.floor(fromTimeHours / 24);
    return `${fromTimeDays}d ago`;
  };

  // Sweet alert
  declare const Swal: any;
  const showConfirmDialog = (
    title: string,
    confirmText = "نعم، قم بالحذف!",
  ) => {
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

  const showSuccessToast = (title: string) => {
    Toast.fire({ icon: "success", title });
  };

  const renderTasks = () => {
    let todoTasks: iTask[] = [];
    let inProgressTasks: iTask[] = [];
    let completedTasks: iTask[] = [];
    tasksList.forEach((task, index) => {
      if (task.state === "todo") todoTasks.push({ ...task, index });
      if (task.state === "in-progress")
        inProgressTasks.push({ ...task, index });
      if (task.state === "completed") completedTasks.push({ ...task, index });
    });

    renderTodo(todoTasks);
    renderInProgress(inProgressTasks);
    renderCompleted(completedTasks);
  };
  const renderTodo = (todoTasks: iTask[]) => {
    let box = "";
    if (todoTasks.length === 0) {
      box = `<div class="flex flex-col items-center justify-center py-12 text-slate-400">
              <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
              <p class="text-sm">No tasks yet</p>
              <p class="text-xs mt-1">Click + to add one</p>
            </div>`;
    } else {
      todoTasks.forEach((task, index) => {
        if (task.date) getDelayStatus(task.date);
        box += `
        <div class="task-item group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200   "
          data-task-id="${task.id}">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-slate-300"></span>
              <span
                class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">#${task.index! + 1}</span>
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
          ${
            task.description
              ? `<p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">
            ${task.description}
          </p>`
              : ""
          }
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span
              class="priority-${task.priority} text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <i class="fa-solid fa-circle text-[6px]"></i>
                ${task.priority} ${task.priority === "high" ? "Priority" : ""}
            </span>
            ${
              task.date
                ? `${
                    getDelayStatus(task.date)
                      ? `<span
              class="${getDelayStatus(task.date)?.style} text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                ${getDelayStatus(task.date)?.status === "Overdue" ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ""}
                ${getDelayStatus(task.date)?.status}
            </span>`
                      : ""
                  }`
                : ""
            }
          </div>
          <div
            class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
            ${
              task.date
                ? `<div class="flex items-center gap-1.5 text-red-500">
              <i class="fa-regular fa-calendar"></i>
              <span>${MD_Date_Formatter.format(new Date(task.date))}</span>
            </div>`
                : ""
            }
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
  const renderInProgress = (inProgressTasks: iTask[]) => {
    let box = "";
    if (inProgressTasks.length === 0) {
      box = `<div class="flex flex-col items-center justify-center py-12 text-slate-400">
              <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
              <p class="text-sm">No tasks yet</p>
              <p class="text-xs mt-1">Click + to add one</p>
             </div>`;
    } else {
      inProgressTasks.forEach((task, index) => {
        if (task.date) getDelayStatus(task.date);
        box += `
        <div class="task-item group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200   "
          data-task-id="${task.id}">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-slate-300"></span>
              <span
                class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">#${task.index! + 1}</span>
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
          ${
            task.description
              ? `<p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">
            ${task.description}
          </p>`
              : ""
          }
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span
              class="priority-${task.priority} text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <i class="fa-solid fa-circle text-[6px]"></i>
                ${task.priority} ${task.priority === "high" ? "Priority" : ""}
            </span>
            ${
              task.date
                ? `${
                    getDelayStatus(task.date)
                      ? `<span
              class="${getDelayStatus(task.date)?.style} text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                ${getDelayStatus(task.date)?.status === "Overdue" ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ""}
                ${getDelayStatus(task.date)?.status}
            </span>`
                      : ""
                  }`
                : ""
            }
          </div>
          <div
            class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
            ${
              task.date
                ? `<div class="flex items-center gap-1.5 text-red-500">
              <i class="fa-regular fa-calendar"></i>
              <span>${MD_Date_Formatter.format(new Date(task.date))}</span>
            </div>`
                : ""
            }
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
  const renderCompleted = (completedTasks: iTask[]) => {
    let box = "";
    if (completedTasks.length === 0) {
      box = `<div class="flex flex-col items-center justify-center py-12 text-slate-400">
              <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
              <p class="text-sm">No tasks yet</p>
              <p class="text-xs mt-1">Click + to add one</p>
             </div>`;
    } else {
      completedTasks.forEach((task, index) => {
        if (task.date) getDelayStatus(task.date);
        box += `
        <div class="task-item group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200   "
          data-task-id="${task.id}">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-slate-300"></span>
              <span
                class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">#${task.index! + 1}</span>
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
          ${
            task.description
              ? `<p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">
            ${task.description}
          </p>`
              : ""
          }
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span
              class="priority-${task.priority} text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <i class="fa-solid fa-circle text-[6px]"></i>
                ${task.priority} ${task.priority === "high" ? "Priority" : ""}
            </span>
            ${
              task.date
                ? `${
                    getDelayStatus(task.date)
                      ? `<span
              class="${getDelayStatus(task.date)?.style} text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                ${getDelayStatus(task.date)?.status === "Overdue" ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ""}
                ${getDelayStatus(task.date)?.status}
            </span>`
                      : ""
                  }`
                : ""
            }
          </div>
          <div
            class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
            ${
              task.date
                ? `<div class="flex items-center gap-1.5 text-red-500">
              <i class="fa-regular fa-calendar"></i>
              <span>${MD_Date_Formatter.format(new Date(task.date))}</span>
            </div>`
                : ""
            }
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
    if (event.target === modal) closeModal();
  });

  const changeState = (
    taskId: string,
    state: "todo" | "in-progress" | "completed",
  ) => {
    const task: iTask | undefined = getTaskById(taskId);

    if (task) {
      task.state = state;
      const index = tasksList.findIndex((t) => t.id === taskId);
      if (index !== -1) tasksList.splice(index, 1, task);
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
    } else if (!minLengthValidator(taskTitle.value, 3)) {
      titleError.classList.remove("hidden");
      titleError.innerHTML = "Title must be at least 3 characters";
      isValidTitle = false;
    } else isValidTitle = true;

    taskTitle.addEventListener("input", () => {
      titleError.innerHTML = "";
      titleError.classList.add("hidden");
    });

    if (!dateValidator(taskDueDate.value)) {
      dateError.classList.remove("hidden");
      dateError.innerHTML = "Due date cannot be in the past";
      isValidDate = false;
    } else isValidDate = true;

    taskDueDate.addEventListener("click", () => {
      dateError.innerHTML = "";
      dateError.classList.add("hidden");
    });

    if (isValidTitle && isValidDate) {
      const btn = event.currentTarget as HTMLButtonElement;
      if (btn.dataset.mode === "add") {
        const taskObj: iTask = {
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
      } else {
        editTask.title = taskTitle.value;
        editTask.description = taskDescription.value;
        editTask.priority = taskPriority.value;
        editTask.date = taskDueDate.value;

        const index = tasksList.findIndex((t) => t.id === editTask.id);
        if (index !== -1) tasksList.splice(index, 1, editTask);
        saveToLocalStorage();
        renderTasks();
        showSuccessToast("Task updated successfully!");
      }
      closeModal();
    }
  });

  columnsContainer?.addEventListener("click", async (event) => {
    event.stopPropagation();
    const target = event.target as HTMLButtonElement;
    const deleteBtn: HTMLButtonElement | null = target.closest(".delete-btn");
    const updateBtn: HTMLButtonElement | null = target.closest(".edit-btn");
    const goToInProgressBtn: HTMLButtonElement | null = target.closest(
      'button[data-status="in-progress"]',
    );
    const goToInCompletedBtn: HTMLButtonElement | null = target.closest(
      'button[data-status="completed"]',
    );
    const goToTodoBtn: HTMLButtonElement | null = target.closest(
      'button[data-status="todo"]',
    );

    if (deleteBtn) {
      const result = await showConfirmDialog(
        "Delete this task?",
        "Yes, delete it!",
      );
      if (result.isConfirmed) {
        if (target.dataset.taskId) deleteTask(target.dataset.taskId);
      }
    }
    if (updateBtn) {
      if (target.dataset.taskId) {
        let task: iTask | undefined = getTaskById(target.dataset.taskId);

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
