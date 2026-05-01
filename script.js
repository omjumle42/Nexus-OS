document.addEventListener('DOMContentLoaded', () => {
    // === STATE MANAGEMENT ===
    let currentSelectedDate = getFormattedDate(new Date()); // YYYY-MM-DD
    let currentCalendarViewMonth = new Date(); // Date object to track which month is shown in calendar
    
    let currentData = {
        tasks: [],
        reflection: ''
    };

    // === DOM ELEMENTS ===
    // Calendar
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const monthYearText = document.getElementById('month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const btnToday = document.getElementById('btn-today');

    // Dashboard
    const currentDateEl = document.getElementById('current-date');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const priorityInput = document.getElementById('priority-input');
    const taskList = document.getElementById('task-list');
    const taskCountBadge = document.getElementById('task-count-badge');
    
    // Analysis
    const progressRing = document.getElementById('progress-ring');
    const progressText = document.getElementById('progress-text');
    const barHigh = document.getElementById('bar-high');
    const barMedium = document.getElementById('bar-medium');
    const barLow = document.getElementById('bar-low');
    const valHigh = document.getElementById('val-high');
    const valMedium = document.getElementById('val-medium');
    const valLow = document.getElementById('val-low');

    // Journal
    const reflectionInput = document.getElementById('reflection-input');
    const saveReflectionBtn = document.getElementById('save-reflection');
    const saveStatus = document.getElementById('save-status');

    // === INITIALIZATION ===
    init();

    function init() {
        renderCalendar();
        loadDataForDate(currentSelectedDate);
    }

    // === CALENDAR LOGIC ===
    function getFormattedDate(dateObj) {
        // Returns YYYY-MM-DD
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function renderCalendar() {
        const year = currentCalendarViewMonth.getFullYear();
        const month = currentCalendarViewMonth.getMonth();
        
        // Setup Header
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthYearText.textContent = `${monthNames[month]} ${year}`;

        // Clear grid
        calendarGrid.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty slots before first day
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDiv);
        }

        const todayStr = getFormattedDate(new Date());

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dateStr = getFormattedDate(dateObj);
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;
            
            if (dateStr === todayStr) {
                dayDiv.classList.add('today');
            }
            if (dateStr === currentSelectedDate) {
                dayDiv.classList.add('selected');
            }

            dayDiv.addEventListener('click', () => {
                currentSelectedDate = dateStr;
                renderCalendar(); // re-render to show selected class
                loadDataForDate(currentSelectedDate);
            });

            calendarGrid.appendChild(dayDiv);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentCalendarViewMonth.setMonth(currentCalendarViewMonth.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalendarViewMonth.setMonth(currentCalendarViewMonth.getMonth() + 1);
        renderCalendar();
    });

    btnToday.addEventListener('click', () => {
        const today = new Date();
        currentCalendarViewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        currentSelectedDate = getFormattedDate(today);
        renderCalendar();
        loadDataForDate(currentSelectedDate);
    });

    // === DATA LOGIC ===
    function loadDataForDate(dateStr) {
        // Update header
        const dateObj = new Date(dateStr + "T00:00:00"); // Avoid timezone shift
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = dateObj.toLocaleDateString('en-US', options);

        const storageKey = `data-${dateStr}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
            currentData = JSON.parse(stored);
        } else {
            currentData = { tasks: [], reflection: '' };
        }

        // Render UI
        reflectionInput.value = currentData.reflection;
        renderTasks();
        updateAnalysis();
    }

    function saveData() {
        const storageKey = `data-${currentSelectedDate}`;
        localStorage.setItem(storageKey, JSON.stringify(currentData));
    }

    // === EVENT LISTENERS FOR DASHBOARD ===
    
    // Add Task
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(taskInput.value, priorityInput.value);
        taskInput.value = '';
    });

    // Save Reflection
    saveReflectionBtn.addEventListener('click', () => {
        currentData.reflection = reflectionInput.value.trim();
        saveData();
        
        saveStatus.textContent = 'Saved successfully!';
        saveStatus.classList.add('show');
        
        setTimeout(() => {
            saveStatus.classList.remove('show');
        }, 2000);
    });

    // === CORE FUNCTIONS ===

    function addTask(text, priority) {
        if (!text.trim()) return;

        const newTask = {
            id: Date.now().toString(),
            text: text.trim(),
            priority: priority,
            completed: false,
            createdAt: new Date().getTime()
        };

        currentData.tasks.unshift(newTask);
        saveData();
        renderTasks();
        updateAnalysis();
    }

    function toggleTask(id) {
        currentData.tasks = currentData.tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveData();
        renderTasks();
        updateAnalysis();
    }

    function deleteTask(id) {
        currentData.tasks = currentData.tasks.filter(task => task.id !== id);
        saveData();
        renderTasks();
        updateAnalysis();
    }

    // === RENDER FUNCTIONS ===

    function renderTasks() {
        taskList.innerHTML = '';
        taskCountBadge.textContent = `${currentData.tasks.length} task${currentData.tasks.length !== 1 ? 's' : ''}`;
        
        if (currentData.tasks.length === 0) {
            taskList.innerHTML = `
                <li class="empty-state">
                    <p>No tasks for this day. Enjoy the break!</p>
                </li>
            `;
            return;
        }

        currentData.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as complete">
                    <span class="task-text">${escapeHTML(task.text)}</span>
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                </div>
                <button class="delete-btn" aria-label="Delete task">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;

            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTask(task.id));

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                deleteTask(task.id);
            });

            taskList.appendChild(li);
        });
    }

    function updateAnalysis() {
        const tasks = currentData.tasks;
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        
        let percentage = 0;
        if (total > 0) {
            percentage = Math.round((completed / total) * 100);
        }
        
        progressText.textContent = `${percentage}%`;
        progressRing.style.background = `conic-gradient(var(--text-main) ${percentage}%, var(--border-color) ${percentage}%)`;

        const totalHigh = tasks.filter(t => t.priority === 'High').length;
        const totalMedium = tasks.filter(t => t.priority === 'Medium').length;
        const totalLow = tasks.filter(t => t.priority === 'Low').length;

        valHigh.textContent = totalHigh;
        valMedium.textContent = totalMedium;
        valLow.textContent = totalLow;

        const maxCount = Math.max(totalHigh, totalMedium, totalLow, 1); 

        barHigh.style.width = `${(totalHigh / maxCount) * 100}%`;
        barMedium.style.width = `${(totalMedium / maxCount) * 100}%`;
        barLow.style.width = `${(totalLow / maxCount) * 100}%`;
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
