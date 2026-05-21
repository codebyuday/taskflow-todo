// ========================================
// TaskFlow — To-Do List App
// ========================================

(function () {
    'use strict';

    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('taskflow-tasks') || '[]');
    let currentFilter = 'all';
    let selectedPriority = 'low';

    // --- DOM Elements ---
    const taskInput = document.getElementById('task-input');
    const addForm = document.getElementById('add-task-form');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const filterTabs = document.getElementById('filter-tabs');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const prioritySelector = document.getElementById('priority-selector');

    const statTotal = document.querySelector('#stat-total .stat-number');
    const statActive = document.querySelector('#stat-active .stat-number');
    const statDone = document.querySelector('#stat-done .stat-number');

    // --- Toast ---
    let toastEl = null;
    let toastTimer = null;

    function showToast(message) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'toast';
            document.body.appendChild(toastEl);
        }
        clearTimeout(toastTimer);
        toastEl.textContent = message;
        // Force reflow for re-triggering animation
        toastEl.classList.remove('visible');
        void toastEl.offsetWidth;
        toastEl.classList.add('visible');
        toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 2200);
    }

    // --- Persistence ---
    function saveTasks() {
        localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
    }

    // --- Stats ---
    function updateStats() {
        const total = tasks.length;
        const done = tasks.filter(t => t.completed).length;
        const active = total - done;
        statTotal.textContent = total;
        statActive.textContent = active;
        statDone.textContent = done;
    }

    // --- Formatting ---
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // --- Render ---
    function getFilteredTasks() {
        if (currentFilter === 'active') return tasks.filter(t => !t.completed);
        if (currentFilter === 'completed') return tasks.filter(t => t.completed);
        return tasks;
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        li.dataset.id = task.id;
        li.dataset.priority = task.priority;

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" id="check-${task.id}" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-text">${escapeHTML(task.text)}</span>
                <span class="task-time">${formatTime(task.createdAt)}</span>
            </div>
            <button class="task-delete-btn" title="Delete task" aria-label="Delete task">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        `;

        // Checkbox toggle
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task.id));

        // Delete button
        const deleteBtn = li.querySelector('.task-delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id, li));

        return li;
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function render() {
        const filtered = getFilteredTasks();
        taskList.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.classList.add('visible');
            if (currentFilter === 'completed') {
                emptyState.querySelector('.empty-title').textContent = 'No completed tasks';
                emptyState.querySelector('.empty-subtitle').textContent = 'Complete some tasks to see them here';
            } else if (currentFilter === 'active') {
                emptyState.querySelector('.empty-title').textContent = 'All caught up!';
                emptyState.querySelector('.empty-subtitle').textContent = 'No active tasks remaining';
            } else {
                emptyState.querySelector('.empty-title').textContent = 'No tasks yet';
                emptyState.querySelector('.empty-subtitle').textContent = 'Add your first task above to get started';
            }
        } else {
            emptyState.classList.remove('visible');
            filtered.forEach(task => {
                taskList.appendChild(createTaskElement(task));
            });
        }

        updateStats();
    }

    // --- Actions ---
    function addTask(text, priority) {
        const task = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            text: text.trim(),
            priority: priority,
            completed: false,
            createdAt: Date.now()
        };
        tasks.unshift(task);
        saveTasks();
        render();
        showToast('✓ Task added');
    }

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            // Small delay for checkbox animation
            setTimeout(() => render(), 200);
        }
    }

    function deleteTask(id, element) {
        element.classList.add('removing');
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            render();
            showToast('Task removed');
        }, 300);
    }

    function clearCompleted() {
        const count = tasks.filter(t => t.completed).length;
        if (count === 0) {
            showToast('No completed tasks to clear');
            return;
        }
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        render();
        showToast(`Cleared ${count} task${count > 1 ? 's' : ''}`);
    }

    // --- Event Listeners ---

    // Add task form submission
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) {
            taskInput.focus();
            return;
        }
        addTask(text, selectedPriority);
        taskInput.value = '';
        taskInput.focus();
    });

    // Priority selector
    prioritySelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.priority-btn');
        if (!btn) return;
        prioritySelector.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPriority = btn.dataset.priority;
    });

    // Filter tabs
    filterTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        filterTabs.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        render();
    });

    // Clear completed
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Keyboard shortcut: press "/" to focus input
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== taskInput) {
            e.preventDefault();
            taskInput.focus();
        }
    });

    // --- Init ---
    render();
})();
