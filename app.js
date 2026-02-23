// Life Organizer App - Main JavaScript
console.log('✅ app.js загружен успешно');

class LifeOrganizer {
    constructor() {
        this.db = null;
        this.currentView = 'eisenhower';
        this.currentTask = null;
        this.currentMode = 'eisenhower'; // for modal context
        this.pomodoroInterval = null;
        this.pomodoroState = {
            timeLeft: 25 * 60,
            isRunning: false,
            mode: 'focus', // focus, shortBreak, longBreak
            completedToday: 0
        };
        this.googleDriveToken = null;
        this.lastSyncTime = null;
        
        this.init();
    }

    async init() {
        await this.initDB();
        await this.loadSettings();
        this.setupEventListeners();
        this.loadData();
        this.checkGoogleDriveAuth();
        this.updateSyncStatus();
    }

    // IndexedDB initialization
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('LifeOrganizerDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('tasks')) {
                    const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
                    taskStore.createIndex('quadrant', 'quadrant', { unique: false });
                    taskStore.createIndex('status', 'status', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('habits')) {
                    db.createObjectStore('habits', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Menu toggle
        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('menu').classList.toggle('active');
        });

        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
                document.getElementById('menu').classList.remove('active');
            });
        });

        // Sync button
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncWithGoogleDrive();
        });

        // Add task buttons in Eisenhower Matrix
        document.querySelectorAll('.matrix-quadrant .add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quadrant = e.target.closest('.matrix-quadrant').dataset.quadrant;
                this.openTaskModal('eisenhower', null, quadrant);
            });
        });

        // Add task buttons in Kanban
        document.querySelectorAll('.kanban-column .add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.closest('.kanban-column').dataset.status;
                this.openTaskModal('kanban', null, status);
            });
        });

        // Task modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeTaskModal();
        });
        document.getElementById('cancelTask').addEventListener('click', () => {
            this.closeTaskModal();
        });
        document.getElementById('saveTask').addEventListener('click', () => {
            this.saveTask();
        });

        // Habit modal
        document.getElementById('addHabitBtn').addEventListener('click', () => {
            this.openHabitModal();
        });
        document.getElementById('closeHabitModal').addEventListener('click', () => {
            this.closeHabitModal();
        });
        document.getElementById('cancelHabit').addEventListener('click', () => {
            this.closeHabitModal();
        });
        document.getElementById('saveHabit').addEventListener('click', () => {
            this.saveHabit();
        });

        // Pomodoro controls
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startPomodoro();
        });
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pausePomodoro();
        });
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetPomodoro();
        });

        // Settings
        document.getElementById('connectGoogleDrive').addEventListener('click', () => {
            this.connectGoogleDrive();
        });
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });
        document.getElementById('importData').addEventListener('click', () => {
            this.importData();
        });
        document.getElementById('clearData').addEventListener('click', () => {
            this.clearAllData();
        });

        // Pomodoro settings
        ['focusTime', 'shortBreak', 'longBreak'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.saveSettings();
            });
        });
    }

    // View switching
    switchView(viewName) {
        this.currentView = viewName;
        
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        
        document.getElementById(viewName + 'View').classList.add('active');
        document.querySelector(`.menu-item[data-view="${viewName}"]`).classList.add('active');
        
        if (viewName === 'habits') {
            this.loadHabits();
        } else if (viewName === 'pomodoro') {
            this.updatePomodoroDisplay();
        }
    }

    // Task Management
    async saveTask() {
        const title = document.getElementById('taskTitle').value.trim();
        if (!title) {
            alert('Введите название задачи');
            return;
        }

        const task = {
            id: this.currentTask ? this.currentTask.id : Date.now().toString(),
            title: title,
            description: document.getElementById('taskDescription').value.trim(),
            completed: this.currentTask ? this.currentTask.completed : false,
            createdAt: this.currentTask ? this.currentTask.createdAt : new Date().toISOString()
        };

        if (this.currentMode === 'eisenhower') {
            task.quadrant = document.getElementById('taskQuadrant').value;
            task.type = 'eisenhower';
        } else {
            task.status = document.getElementById('taskStatus').value;
            task.type = 'kanban';
        }

        await this.saveTaskToDB(task);
        this.closeTaskModal();
        this.loadData();
    }

    async saveTaskToDB(task) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            const request = store.put(task);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTask(taskId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            const request = store.delete(taskId);
            
            request.onsuccess = () => {
                this.loadData();
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async toggleTaskComplete(taskId) {
        const task = await this.getTaskById(taskId);
        if (task) {
            task.completed = !task.completed;
            await this.saveTaskToDB(task);
            this.loadData();
        }
    }

    async getTaskById(taskId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tasks'], 'readonly');
            const store = transaction.objectStore('tasks');
            const request = store.get(taskId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllTasks() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tasks'], 'readonly');
            const store = transaction.objectStore('tasks');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    openTaskModal(mode, task = null, defaultValue = null) {
        this.currentMode = mode;
        this.currentTask = task;
        
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('modalTitle');
        const quadrantGroup = document.getElementById('quadrantGroup');
        const statusGroup = document.getElementById('statusGroup');
        
        title.textContent = task ? 'Редактировать задачу' : 'Новая задача';
        
        if (mode === 'eisenhower') {
            quadrantGroup.style.display = 'block';
            statusGroup.style.display = 'none';
            if (defaultValue) {
                document.getElementById('taskQuadrant').value = defaultValue;
            }
        } else {
            quadrantGroup.style.display = 'none';
            statusGroup.style.display = 'block';
            if (defaultValue) {
                document.getElementById('taskStatus').value = defaultValue;
            }
        }
        
        if (task) {
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            if (task.quadrant) {
                document.getElementById('taskQuadrant').value = task.quadrant;
            }
            if (task.status) {
                document.getElementById('taskStatus').value = task.status;
            }
        } else {
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
        }
        
        modal.classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
        this.currentTask = null;
    }

    async loadData() {
        const tasks = await this.getAllTasks();
        
        // Load Eisenhower Matrix
        const quadrants = ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'];
        quadrants.forEach(quadrant => {
            const container = document.getElementById(`quadrant-${quadrant}`);
            container.innerHTML = '';
            
            const quadrantTasks = tasks.filter(t => t.type === 'eisenhower' && t.quadrant === quadrant);
            quadrantTasks.forEach(task => {
                container.appendChild(this.createTaskCard(task, 'eisenhower'));
            });
        });
        
        // Load Kanban
        const statuses = ['backlog', 'in-progress', 'done'];
        statuses.forEach(status => {
            const container = document.getElementById(`kanban-${status}`);
            container.innerHTML = '';
            
            const statusTasks = tasks.filter(t => t.type === 'kanban' && t.status === status);
            statusTasks.forEach(task => {
                container.appendChild(this.createTaskCard(task, 'kanban'));
            });
        });
    }

    createTaskCard(task, type) {
        const card = document.createElement('div');
        card.className = 'task-card' + (task.completed ? ' completed' : '');
        card.dataset.taskId = task.id;
        
        card.innerHTML = `
            <div class="task-header">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="app.toggleTaskComplete('${task.id}')">✓</button>
                    <button class="task-action-btn" onclick="app.editTask('${task.id}')">✎</button>
                    <button class="task-action-btn" onclick="app.deleteTask('${task.id}')">×</button>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
        `;
        
        return card;
    }

    async editTask(taskId) {
        const task = await this.getTaskById(taskId);
        if (task) {
            this.openTaskModal(task.type, task);
        }
    }

    // Habits Management
    async saveHabit() {
        const name = document.getElementById('habitName').value.trim();
        const goal = parseInt(document.getElementById('habitGoal').value);
        
        if (!name) {
            alert('Введите название привычки');
            return;
        }

        const habit = {
            id: Date.now().toString(),
            name: name,
            goal: goal,
            currentStreak: 0,
            lastChecked: null,
            checkedDates: [],
            createdAt: new Date().toISOString()
        };

        await this.saveHabitToDB(habit);
        this.closeHabitModal();
        this.loadHabits();
    }

    async saveHabitToDB(habit) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['habits'], 'readwrite');
            const store = transaction.objectStore('habits');
            const request = store.put(habit);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteHabit(habitId) {
        if (!confirm('Удалить эту привычку?')) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['habits'], 'readwrite');
            const store = transaction.objectStore('habits');
            const request = store.delete(habitId);
            
            request.onsuccess = () => {
                this.loadHabits();
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async toggleHabitCheck(habitId) {
        const habit = await this.getHabitById(habitId);
        if (!habit) return;

        const today = new Date().toDateString();
        const lastChecked = habit.lastChecked ? new Date(habit.lastChecked).toDateString() : null;
        
        if (lastChecked === today) {
            // Uncheck today
            habit.checkedDates = habit.checkedDates.filter(d => new Date(d).toDateString() !== today);
            habit.lastChecked = habit.checkedDates.length > 0 ? habit.checkedDates[habit.checkedDates.length - 1] : null;
            habit.currentStreak = this.calculateStreak(habit.checkedDates);
        } else {
            // Check today
            habit.checkedDates.push(new Date().toISOString());
            habit.lastChecked = new Date().toISOString();
            habit.currentStreak = this.calculateStreak(habit.checkedDates);
        }

        await this.saveHabitToDB(habit);
        this.loadHabits();
    }

    calculateStreak(checkedDates) {
        if (!checkedDates || checkedDates.length === 0) return 0;
        
        const sorted = checkedDates.map(d => new Date(d).toDateString()).sort().reverse();
        let streak = 1;
        
        for (let i = 0; i < sorted.length - 1; i++) {
            const current = new Date(sorted[i]);
            const next = new Date(sorted[i + 1]);
            const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    async getHabitById(habitId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['habits'], 'readonly');
            const store = transaction.objectStore('habits');
            const request = store.get(habitId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllHabits() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['habits'], 'readonly');
            const store = transaction.objectStore('habits');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async loadHabits() {
        const habits = await this.getAllHabits();
        const container = document.getElementById('habitsList');
        container.innerHTML = '';
        
        if (habits.length === 0) {
            container.innerHTML = '<p style="color: #8e8e93; text-align: center; padding: 20px;">Нет привычек. Добавьте первую!</p>';
            return;
        }

        habits.forEach(habit => {
            const today = new Date().toDateString();
            const lastChecked = habit.lastChecked ? new Date(habit.lastChecked).toDateString() : null;
            const isCheckedToday = lastChecked === today;
            const progress = Math.min((habit.currentStreak / habit.goal) * 100, 100);
            
            const card = document.createElement('div');
            card.className = 'habit-card';
            card.innerHTML = `
                <div class="habit-header">
                    <div class="habit-name">${this.escapeHtml(habit.name)}</div>
                    <div class="habit-streak">${habit.currentStreak} 🔥</div>
                </div>
                <div class="habit-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <p style="font-size: 12px; color: #8e8e93; margin-top: 5px;">
                        ${habit.currentStreak} из ${habit.goal} дней
                    </p>
                </div>
                <div class="habit-actions">
                    <button class="habit-check-btn ${isCheckedToday ? 'checked' : ''}" 
                            onclick="app.toggleHabitCheck('${habit.id}')">
                        ${isCheckedToday ? 'Выполнено сегодня ✓' : 'Отметить сегодня'}
                    </button>
                    <button class="habit-delete-btn" onclick="app.deleteHabit('${habit.id}')">×</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    openHabitModal() {
        document.getElementById('habitName').value = '';
        document.getElementById('habitGoal').value = '30';
        document.getElementById('habitModal').classList.add('active');
    }

    closeHabitModal() {
        document.getElementById('habitModal').classList.remove('active');
    }

    // Pomodoro Timer
    startPomodoro() {
        if (this.pomodoroState.isRunning) return;
        
        this.pomodoroState.isRunning = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        this.pomodoroInterval = setInterval(() => {
            this.pomodoroState.timeLeft--;
            
            if (this.pomodoroState.timeLeft <= 0) {
                this.completePomodoro();
            }
            
            this.updatePomodoroDisplay();
        }, 1000);
    }

    pausePomodoro() {
        this.pomodoroState.isRunning = false;
        clearInterval(this.pomodoroInterval);
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }

    resetPomodoro() {
        this.pausePomodoro();
        const focusTime = parseInt(document.getElementById('focusTime').value) || 25;
        this.pomodoroState.timeLeft = focusTime * 60;
        this.pomodoroState.mode = 'focus';
        this.updatePomodoroDisplay();
    }

    completePomodoro() {
        this.pausePomodoro();
        
        if (this.pomodoroState.mode === 'focus') {
            this.pomodoroState.completedToday++;
            this.playNotification('Pomodoro завершён! Время отдохнуть.');
            
            // Start break
            const shortBreak = parseInt(document.getElementById('shortBreak').value) || 5;
            this.pomodoroState.timeLeft = shortBreak * 60;
            this.pomodoroState.mode = 'shortBreak';
        } else {
            this.playNotification('Перерыв окончен! Готовы к работе?');
            this.resetPomodoro();
        }
        
        this.updatePomodoroDisplay();
    }

    updatePomodoroDisplay() {
        const minutes = Math.floor(this.pomodoroState.timeLeft / 60);
        const seconds = this.pomodoroState.timeLeft % 60;
        
        document.getElementById('timerDisplay').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const label = this.pomodoroState.mode === 'focus' ? 'Фокус' : 'Перерыв';
        document.getElementById('timerLabel').textContent = label;
        
        document.getElementById('completedPomodoros').textContent = this.pomodoroState.completedToday;
    }

    playNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Life Organizer', { body: message });
        } else {
            alert(message);
        }
    }

    // Google Drive Integration
    async connectGoogleDrive() {
        const clientId = ''; // User needs to create OAuth credentials
        const redirectUri = window.location.origin;
        const scope = 'https://www.googleapis.com/auth/drive.file';
        
        if (!clientId) {
            alert('Google Drive синхронизация требует настройки OAuth.\n\nДля личного использования рекомендую:\n1. Использовать экспорт/импорт данных\n2. Или настроить свои OAuth credentials в Google Cloud Console');
            return;
        }
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `response_type=token&` +
            `scope=${scope}`;
        
        window.location.href = authUrl;
    }

    checkGoogleDriveAuth() {
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
            const token = hash.match(/access_token=([^&]+)/)[1];
            this.googleDriveToken = token;
            localStorage.setItem('gdrive_token', token);
            window.location.hash = '';
            this.updateSyncStatus(true);
        } else {
            const savedToken = localStorage.getItem('gdrive_token');
            if (savedToken) {
                this.googleDriveToken = savedToken;
                this.updateSyncStatus(true);
            }
        }
    }

    updateSyncStatus(connected = false) {
        const statusText = document.querySelector('.sync-text');
        const indicator = document.querySelector('.sync-indicator');
        const button = document.getElementById('driveButtonText');
        
        if (connected || this.googleDriveToken) {
            statusText.textContent = 'Подключено к Google Drive';
            indicator.classList.add('synced');
            button.textContent = '✓ Google Drive подключён';
        } else {
            statusText.textContent = 'Не синхронизировано';
            indicator.classList.remove('synced', 'syncing');
            button.textContent = '🔗 Подключить Google Drive';
        }
    }

    async syncWithGoogleDrive() {
        if (!this.googleDriveToken) {
            alert('Сначала подключите Google Drive в настройках');
            return;
        }
        
        const indicator = document.querySelector('.sync-indicator');
        indicator.classList.add('syncing');
        
        try {
            const data = await this.exportDataObject();
            const fileName = 'life-organizer-data.json';
            
            // This is a simplified version - full implementation would handle file updates
            alert('Синхронизация с Google Drive временно недоступна.\nИспользуйте экспорт/импорт для резервного копирования.');
            
        } catch (error) {
            console.error('Sync error:', error);
            alert('Ошибка синхронизации: ' + error.message);
        } finally {
            indicator.classList.remove('syncing');
        }
    }

    // Data Export/Import
    async exportDataObject() {
        const tasks = await this.getAllTasks();
        const habits = await this.getAllHabits();
        const settings = await this.getSettings();
        
        return {
            version: 1,
            exportDate: new Date().toISOString(),
            tasks: tasks,
            habits: habits,
            settings: settings,
            pomodoroState: this.pomodoroState
        };
    }

    async exportData() {
        const data = await this.exportDataObject();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `life-organizer-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (!confirm('Это заменит все текущие данные. Продолжить?')) {
                    return;
                }
                
                // Import tasks
                if (data.tasks) {
                    const transaction = this.db.transaction(['tasks'], 'readwrite');
                    const store = transaction.objectStore('tasks');
                    await store.clear();
                    for (const task of data.tasks) {
                        await store.put(task);
                    }
                }
                
                // Import habits
                if (data.habits) {
                    const transaction = this.db.transaction(['habits'], 'readwrite');
                    const store = transaction.objectStore('habits');
                    await store.clear();
                    for (const habit of data.habits) {
                        await store.put(habit);
                    }
                }
                
                // Import settings
                if (data.settings) {
                    for (const [key, value] of Object.entries(data.settings)) {
                        await this.saveSetting(key, value);
                    }
                    await this.loadSettings();
                }
                
                alert('Данные успешно импортированы!');
                this.loadData();
                this.loadHabits();
                
            } catch (error) {
                console.error('Import error:', error);
                alert('Ошибка импорта: ' + error.message);
            }
        };
        
        input.click();
    }

    async clearAllData() {
        if (!confirm('Удалить ВСЕ данные? Это действие необратимо!')) {
            return;
        }
        
        if (!confirm('Вы уверены? Все задачи, привычки и настройки будут удалены!')) {
            return;
        }
        
        const transaction = this.db.transaction(['tasks', 'habits', 'settings'], 'readwrite');
        await transaction.objectStore('tasks').clear();
        await transaction.objectStore('habits').clear();
        await transaction.objectStore('settings').clear();
        
        this.loadData();
        this.loadHabits();
        alert('Все данные удалены');
    }

    // Settings Management
    async saveSetting(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({ key, value });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSetting(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }

    async getSettings() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const settings = {};
                request.result.forEach(item => {
                    settings[item.key] = item.value;
                });
                resolve(settings);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveSettings() {
        await this.saveSetting('focusTime', parseInt(document.getElementById('focusTime').value));
        await this.saveSetting('shortBreak', parseInt(document.getElementById('shortBreak').value));
        await this.saveSetting('longBreak', parseInt(document.getElementById('longBreak').value));
    }

    async loadSettings() {
        const focusTime = await this.getSetting('focusTime') || 25;
        const shortBreak = await this.getSetting('shortBreak') || 5;
        const longBreak = await this.getSetting('longBreak') || 15;
        
        document.getElementById('focusTime').value = focusTime;
        document.getElementById('shortBreak').value = shortBreak;
        document.getElementById('longBreak').value = longBreak;
        
        this.pomodoroState.timeLeft = focusTime * 60;
    }

    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
let app;
console.log('🔄 Ожидание загрузки DOM...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM загружен, инициализация приложения...');
    try {
        app = new LifeOrganizer();
        console.log('✅ LifeOrganizer создан успешно');
    } catch (error) {
        console.error('❌ Ошибка при создании LifeOrganizer:', error);
        alert('Ошибка инициализации приложения. Откройте консоль (F12) для подробностей.');
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    // Service Worker работает только через HTTP/HTTPS, не через file://
    const swPath = window.location.pathname.includes('.html') 
        ? './sw.js' 
        : '/sw.js';
    navigator.serviceWorker.register(swPath).catch(err => {
        console.log('Service Worker registration failed (это нормально для file://):', err);
    });
}
