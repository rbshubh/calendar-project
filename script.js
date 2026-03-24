const YEAR = 2026;

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const holidayData = [
  { date: "2026-01-01", name: "New Year's Day", type: "international" },
  { date: "2026-01-14", name: "Makar Sankranti / Pongal", type: "india" },
  { date: "2026-01-26", name: "Republic Day", type: "india" },
  { date: "2026-02-15", name: "Maha Shivratri", type: "india" },
  { date: "2026-03-08", name: "International Women's Day", type: "international" },
  { date: "2026-03-04", name: "Holi", type: "india" },
  { date: "2026-03-21", name: "Eid-ul-Fitr", type: "india" },
  { date: "2026-04-03", name: "Good Friday", type: "india" },
  { date: "2026-05-01", name: "Buddha Purnima", type: "india" },
  { date: "2026-06-21", name: "International Day of Yoga", type: "international" },
  { date: "2026-08-15", name: "Independence Day", type: "india" },
  { date: "2026-08-26", name: "Milad-un-Nabi", type: "india" },
  { date: "2026-09-21", name: "International Day of Peace", type: "international" },
  { date: "2026-10-02", name: "Gandhi Jayanti", type: "india" },
  { date: "2026-10-20", name: "Dussehra", type: "india" },
  { date: "2026-10-24", name: "United Nations Day", type: "international" },
  { date: "2026-11-08", name: "Diwali", type: "india" },
  { date: "2026-11-24", name: "Guru Nanak Jayanti", type: "india" },
  { date: "2026-12-25", name: "Christmas Day", type: "india" }
];

const holidaysByDate = holidayData.reduce((map, holiday) => {
  if (!map[holiday.date]) {
    map[holiday.date] = [];
  }

  map[holiday.date].push(holiday);
  return map;
}, {});

const calendarGrid = document.getElementById("calendar-grid");
const holidayHighlights = document.getElementById("holiday-highlights");
const selectedDateLabel = document.getElementById("selected-date-label");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskTimeInput = document.getElementById("task-time");
const taskList = document.getElementById("task-list");
const enableNotificationsButton = document.getElementById("enable-notifications");
const alarmStatus = document.getElementById("alarm-status");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");
const monthSliderTitle = document.getElementById("month-slider-title");
const todayKey = formatDateKey(new Date());
const TASK_STORAGE_KEY = "calendar-tasks-2026";
let selectedDateKey = todayKey.startsWith(`${YEAR}-`) ? todayKey : `${YEAR}-01-01`;
let tasksByDate = loadTasks();
let alarmTimer = null;
let activeMonthIndex = todayKey.startsWith(`${YEAR}-`) ? new Date().getMonth() : 0;

renderHighlights();
renderCalendar();
updateSelectedDateLabel();
renderTaskList();
updateAlarmStatus();
startAlarmWatcher();

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = taskInput.value.trim();
  const time = taskTimeInput.value;

  if (!text || !time) {
    return;
  }

  const existingTasks = tasksByDate[selectedDateKey] || [];
  const newTask = {
    id: crypto.randomUUID(),
    text,
    time,
    completed: false,
    alarmTriggered: false
  };

  tasksByDate[selectedDateKey] = [newTask, ...existingTasks];
  persistTasks();
  taskForm.reset();
  taskTimeInput.value = "";
  renderTaskList();
  renderCalendar();
});

if (enableNotificationsButton) {
  enableNotificationsButton.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      setAlarmStatus("This browser does not support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    updateAlarmStatus(permission);
  });
}

if (prevMonthButton) {
  prevMonthButton.addEventListener("click", () => {
    activeMonthIndex = (activeMonthIndex + 11) % 12;
    renderCalendar();
  });
}

if (nextMonthButton) {
  nextMonthButton.addEventListener("click", () => {
    activeMonthIndex = (activeMonthIndex + 1) % 12;
    renderCalendar();
  });
}

function renderHighlights() {
  holidayData.forEach((holiday) => {
    const card = document.createElement("article");
    card.className = `highlight-card ${holiday.type}`;

    const holidayDate = new Date(`${holiday.date}T00:00:00`);
    const dateLabel = holidayDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short"
    });

    card.innerHTML = `
      <p class="highlight-date">${dateLabel}</p>
      <h3 class="highlight-name">${holiday.name}</h3>
      <p class="highlight-type">${holiday.type === "india" ? "Indian holiday" : "International day"}</p>
    `;

    holidayHighlights.appendChild(card);
  });
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  monthSliderTitle.textContent = `${months[activeMonthIndex]} ${YEAR}`;

  const monthCard = document.createElement("article");
  monthCard.className = "month-card";

  const header = document.createElement("div");
  header.className = "month-header";
  header.innerHTML = `
    <h3 class="month-title">${months[activeMonthIndex]}</h3>
    <p class="month-subtitle">${YEAR}</p>
  `;

  const weekdaysRow = document.createElement("div");
  weekdaysRow.className = "weekdays";
  weekdays.forEach((weekday) => {
    const dayName = document.createElement("span");
    dayName.textContent = weekday;
    weekdaysRow.appendChild(dayName);
  });

  const daysGrid = document.createElement("div");
  daysGrid.className = "days-grid";

  const firstDay = new Date(YEAR, activeMonthIndex, 1).getDay();
  const totalDays = new Date(YEAR, activeMonthIndex + 1, 0).getDate();

  for (let blank = 0; blank < firstDay; blank += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day empty";
    daysGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(YEAR, activeMonthIndex, day);
    const dateKey = formatDateKey(date);
    const holidayList = holidaysByDate[dateKey] || [];
    const isSunday = date.getDay() === 0;
    const taskCount = (tasksByDate[dateKey] || []).length;

    const cell = document.createElement("div");
    cell.className = "day";
    cell.setAttribute("role", "button");
    cell.setAttribute("tabindex", "0");
    cell.setAttribute("aria-label", `${day} ${months[activeMonthIndex]} ${YEAR}`);

    if (isSunday) {
      cell.classList.add("sunday");
    }

    if (dateKey === todayKey) {
      cell.classList.add("today");
    }

    if (dateKey === selectedDateKey) {
      cell.classList.add("selected");
    }

    if (holidayList.some((holiday) => holiday.type === "india")) {
      cell.classList.add("india-holiday");
    }

    if (holidayList.some((holiday) => holiday.type === "international")) {
      cell.classList.add("international-holiday");
    }

    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = day;
    cell.appendChild(number);

    if (taskCount > 0) {
      const taskBadge = document.createElement("span");
      taskBadge.className = "task-count-badge";
      taskBadge.textContent = `${taskCount}`;
      cell.appendChild(taskBadge);
    }

    if (holidayList.length > 0) {
      const tags = document.createElement("div");
      tags.className = "holiday-tags";

      holidayList.forEach((holiday) => {
        const tag = document.createElement("span");
        tag.className = `holiday-tag ${holiday.type}`;
        tag.textContent = holiday.name;
        tags.appendChild(tag);
      });

      cell.appendChild(tags);
    }

    cell.addEventListener("click", () => selectDate(dateKey));
    cell.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectDate(dateKey);
      }
    });

    daysGrid.appendChild(cell);
  }

  monthCard.appendChild(header);
  monthCard.appendChild(weekdaysRow);
  monthCard.appendChild(daysGrid);
  calendarGrid.appendChild(monthCard);
}

function selectDate(dateKey) {
  selectedDateKey = dateKey;
  activeMonthIndex = new Date(`${dateKey}T00:00:00`).getMonth();
  updateSelectedDateLabel();
  renderTaskList();
  renderCalendar();
  taskInput.focus();
}

function updateSelectedDateLabel() {
  const date = new Date(`${selectedDateKey}T00:00:00`);
  selectedDateLabel.textContent = date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function renderTaskList() {
  taskList.innerHTML = "";
  const tasks = tasksByDate[selectedDateKey] || [];

  if (tasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "task-empty";
    emptyState.textContent = "No task for this date yet. Select any day and add your plan here.";
    taskList.appendChild(emptyState);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-item";
    if (task.completed) {
      item.classList.add("done");
    }

    const checkbox = document.createElement("input");
    checkbox.className = "task-toggle";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const time = document.createElement("span");
    time.className = "task-time-label";
    time.textContent = `Alarm ${formatTime(task.time)}`;

    meta.appendChild(text);
    meta.appendChild(time);

    const removeButton = document.createElement("button");
    removeButton.className = "task-remove";
    removeButton.type = "button";
    removeButton.textContent = "Delete";
    removeButton.addEventListener("click", () => deleteTask(task.id));

    item.appendChild(checkbox);
    item.appendChild(meta);
    item.appendChild(removeButton);
    taskList.appendChild(item);
  });
}

function toggleTask(taskId) {
  const tasks = tasksByDate[selectedDateKey] || [];
  tasksByDate[selectedDateKey] = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  persistTasks();
  renderTaskList();
}

function deleteTask(taskId) {
  const tasks = tasksByDate[selectedDateKey] || [];
  const updatedTasks = tasks.filter((task) => task.id !== taskId);

  if (updatedTasks.length > 0) {
    tasksByDate[selectedDateKey] = updatedTasks;
  } else {
    delete tasksByDate[selectedDateKey];
  }

  persistTasks();
  renderTaskList();
  renderCalendar();
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(TASK_STORAGE_KEY);
    const parsedTasks = savedTasks ? JSON.parse(savedTasks) : {};
    return normalizeTasks(parsedTasks);
  } catch {
    return {};
  }
}

function persistTasks() {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasksByDate));
}

function normalizeTasks(taskMap) {
  const normalized = {};

  Object.entries(taskMap).forEach(([dateKey, tasks]) => {
    normalized[dateKey] = tasks.map((task) => ({
      id: task.id || crypto.randomUUID(),
      text: task.text || "",
      time: task.time || "09:00",
      completed: Boolean(task.completed),
      alarmTriggered: Boolean(task.alarmTriggered)
    }));
  });

  return normalized;
}

function startAlarmWatcher() {
  checkDueAlarms();
  alarmTimer = window.setInterval(checkDueAlarms, 30000);
}

function checkDueAlarms() {
  const now = new Date();
  let changed = false;

  Object.entries(tasksByDate).forEach(([dateKey, tasks]) => {
    tasks.forEach((task) => {
      if (task.completed || task.alarmTriggered) {
        return;
      }

      const dueAt = new Date(`${dateKey}T${task.time}:00`);
      if (Number.isNaN(dueAt.getTime())) {
        return;
      }

      if (now >= dueAt) {
        triggerAlarm(dateKey, task);
        task.alarmTriggered = true;
        changed = true;
      }
    });
  });

  if (changed) {
    persistTasks();
    renderTaskList();
  }
}

function triggerAlarm(dateKey, task) {
  const readableDate = new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const message = `${task.text} at ${formatTime(task.time)} on ${readableDate}`;

  playAlarmSound();
  window.alert(`Reminder\n${message}`);

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Calendar Task Reminder", {
      body: message
    });
  }
}

function playAlarmSound() {
  const audioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!audioContextClass) {
    return;
  }

  const audioContext = new audioContextClass();
  const totalDuration = 4.5;

  for (let ring = 0; ring < 6; ring += 1) {
    const startAt = audioContext.currentTime + ring * 0.75;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(ring % 2 === 0 ? 1040 : 880, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.24, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.55);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.55);
  }

  window.setTimeout(() => {
    audioContext.close();
  }, totalDuration * 1000);
}

function updateAlarmStatus(permission = window.Notification ? Notification.permission : "unsupported") {
  if (permission === "granted") {
    setAlarmStatus("Notifications enabled. Reminders will appear at the chosen time while this page is open.");
    return;
  }

  if (permission === "denied") {
    setAlarmStatus("Notifications are blocked. The page can still show an alert popup when the alarm time arrives.");
    return;
  }

  if (permission === "unsupported") {
    setAlarmStatus("This browser does not support notifications. Alert popups will still work while the page is open.");
    return;
  }

  setAlarmStatus("Enable notifications to get browser reminders at the selected date and time.");
}

function setAlarmStatus(message) {
  alarmStatus.textContent = message;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(timeValue) {
  const [hours, minutes] = timeValue.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
}
