const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;
const SECOND_IN_MS = 1000;

// Кэшируем DOM-элементы
const elements = {
    eventName: document.getElementById('eventName'),
    countdown: document.getElementById('countdown'),
    hourNote: document.getElementById('hourNote'),
    clock: document.getElementById('clock'),
    initialLayout: document.getElementById('initialLayout'),
    expiredLayout: document.getElementById('expiredLayout')
};

// Проверяем наличие всех элементов
const missingElements = Object.entries(elements)
    .filter(([key, element]) => !element)
    .map(([key]) => key);

if (missingElements.length > 0) {
    console.error('Отсутствуют необходимые элементы:', missingElements);
    throw new Error('Не удалось инициализировать приложение');
}

// Применяем начальные настройки
elements.eventName.textContent = CONFIG.eventName;

function parseRussianDate(dateStr) {
    try {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('-');
        const [hours, minutes, seconds] = timePart.split(':');
        
        const date = new Date(year, month - 1, day, hours, minutes, seconds);
        
        if (isNaN(date.getTime())) {
            throw new Error('Некорректная дата');
        }
        
        return date;
    } catch (error) {
        console.error(`Ошибка при разборе даты: ${dateStr}`, error);
        throw error;
    }
}

const targetDate = parseRussianDate(CONFIG.eventDate);
let isExpired = false;

function formatTimeUnit(value) {
    return value.toString().padStart(2, '0');
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
        CONFIG.timeFormat
    );
}

// Запуск таймера с правильной очисткой
let timerInterval;

function startTimer() {
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function cleanupTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

// Запуск после загрузки DOM и очистка при выгрузке
document.addEventListener('DOMContentLoaded', startTimer);
window.addEventListener('unload', cleanupTimer);