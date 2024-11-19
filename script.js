// Константы и конфигурация
const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;
const SECOND_IN_MS = 1000;
const TIME_FORMAT = {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
};

// Кэшируем DOM-элементы
const elements = {
    eventName: document.getElementById('eventName'),
    countdown: document.getElementById('countdown'),
    hourNote: document.getElementById('hourNote'),
    clock: document.getElementById('clock'),
    initialLayout: document.getElementById('initialLayout'),
    expiredLayout: document.getElementById('expiredLayout'),
    timerInput: document.getElementById('timerInput'),
    targetDateTime: document.getElementById('targetDateTime'),
    eventNameInput: document.getElementById('eventNameInput')
};

// Проверяем наличие всех элементов
const missingElements = Object.entries(elements)
    .filter(([key, element]) => !element)
    .map(([key]) => key);

if (missingElements.length > 0) {
    console.error('Отсутствуют необходимые элементы:', missingElements);
    throw new Error('Не удалось инициализировать приложение');
}

// Установка начального времени (текущее время + 1 час, секунды = 0)
const now = new Date();
const initialTargetDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours() + 1,
    now.getMinutes(),
    0, // устанавливаем секунды в 0
    0  // устанавливаем миллисекунды в 0
);

let targetDate = initialTargetDate;
let isExpired = false;
let timerInterval;

// Форматирование даты для input type="datetime-local"
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatTimeUnit(value) {
    return value.toString().padStart(2, '0');
}

function showTimerInput() {
    // Устанавливаем в поле ввода текущее целевое время
    elements.targetDateTime.value = formatDateForInput(targetDate);
    elements.eventNameInput.value = elements.eventName.textContent;
    
    elements.timerInput.classList.add('visible');
    elements.targetDateTime.focus();
}

function hideTimerInput() {
    elements.timerInput.classList.remove('visible');
}

function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;

    if (distance <= 0) {
        if (!isExpired) {
            isExpired = true;
            elements.initialLayout.style.display = 'none';
            elements.expiredLayout.style.display = 'flex';
            document.body.classList.add('expired');
            updateClock();
            setInterval(updateClock, 1000);
        }
        return;
    }

    // Вычисление оставшегося времени
    const hours = Math.floor(distance / HOUR_IN_MS);
    const minutes = Math.floor((distance % HOUR_IN_MS) / MINUTE_IN_MS);
    const seconds = Math.floor((distance % MINUTE_IN_MS) / SECOND_IN_MS);

    // Обновление элементов
    if (hours > 0) {
        elements.hourNote.style.display = 'block';
        elements.countdown.style.display = 'none';
    } else {
        elements.hourNote.style.display = 'none';
        elements.countdown.style.display = 'block';
        elements.countdown.textContent = `${formatTimeUnit(minutes)}:${formatTimeUnit(seconds)}`;
    }
}

function updateClock() {
    elements.clock.textContent = new Date().toLocaleTimeString(
        undefined,
        TIME_FORMAT
    );
}

function updateTargetTime() {
    const newDateTime = elements.targetDateTime.value;
    const newEventName = elements.eventNameInput.value;
    
    if (!newDateTime) {
        alert('Пожалуйста, выберите дату и время');
        return;
    }

    // Устанавливаем новое время с обнулением секунд
    targetDate = new Date(newDateTime);
    targetDate.setSeconds(0, 0); // устанавливаем секунды и миллисекунды в 0
    
    if (newEventName) {
        elements.eventName.textContent = newEventName;
    }

    // Сброс состояния истекшего таймера
    if (isExpired) {
        isExpired = false;
        elements.initialLayout.style.display = 'flex';
        elements.expiredLayout.style.display = 'none';
        document.body.classList.remove('expired');
    }

    hideTimerInput();
    cleanupTimer();
    startTimer();
}

function startTimer() {
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function cleanupTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

// Установка минимальной даты как текущая
elements.targetDateTime.min = formatDateForInput(new Date());

// Инициализация начальных значений
elements.targetDateTime.value = formatDateForInput(targetDate);
elements.eventNameInput.value = elements.eventName.textContent;

// Обработчики событий
document.addEventListener('DOMContentLoaded', startTimer);
window.addEventListener('unload', cleanupTimer);

// Клик по таймеру или часам открывает форму ввода
elements.countdown.addEventListener('click', showTimerInput);
elements.hourNote.addEventListener('click', showTimerInput);
elements.clock.addEventListener('click', showTimerInput);

// Закрытие формы по клику вне её
document.addEventListener('click', (e) => {
    if (!elements.timerInput.contains(e.target) && 
        !elements.countdown.contains(e.target) && 
        !elements.hourNote.contains(e.target) && 
        !elements.clock.contains(e.target)) {
        hideTimerInput();
    }
});