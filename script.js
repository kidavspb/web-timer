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

// Определяем Safari
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Кэшируем DOM-элементы
const elements = {
    eventName: document.getElementById('eventName'),
    countdown: document.getElementById('countdown'),
    hourNote: document.getElementById('hourNote'),
    clock: document.getElementById('clock'),
    initialLayout: document.getElementById('initialLayout'),
    expiredLayout: document.getElementById('expiredLayout'),
    videoLayout: document.getElementById('videoLayout'),
    expirationVideo: document.getElementById('expirationVideo'),
    timerInput: document.getElementById('timerInput'),
    targetDateTime: document.getElementById('targetDateTime'),
    eventNameInput: document.getElementById('eventNameInput'),
    soundEnabled: document.getElementById('soundEnabled'),
    safariSoundButton: document.getElementById('safariSoundButton')
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
    0,
    0
);

let targetDate = initialTargetDate;
let isExpired = false;
let timerInterval;
let isVideoPreloaded = false;

// Функция предзагрузки видео
function preloadVideo() {
    console.log('Начинаем предзагрузку видео');
    
    elements.expirationVideo.currentTime = 0;
    elements.expirationVideo.muted = true;
    elements.expirationVideo.pause();
    
    return new Promise((resolve, reject) => {
        elements.expirationVideo.load();
        
        const onCanPlayThrough = () => {
            console.log('Видео полностью загружено и готово к воспроизведению');
            elements.expirationVideo.removeEventListener('canplaythrough', onCanPlayThrough);
            isVideoPreloaded = true;
            resolve();
        };

        const onError = (e) => {
            console.error('Ошибка при предзагрузке видео:', e);
            elements.expirationVideo.removeEventListener('error', onError);
            reject(e);
        };

        elements.expirationVideo.addEventListener('canplaythrough', onCanPlayThrough, { once: true });
        elements.expirationVideo.addEventListener('error', onError, { once: true });
    });
}

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
    elements.targetDateTime.value = formatDateForInput(targetDate);
    elements.eventNameInput.value = elements.eventName.textContent;
    
    elements.timerInput.classList.add('visible');
    elements.targetDateTime.focus();
}

function hideTimerInput() {
    elements.timerInput.classList.remove('visible');
}

// Функция воспроизведения видео
function startPlayback() {
    elements.expirationVideo.muted = true;
    
    return elements.expirationVideo.play().then(() => {
        console.log('Видео запущено');
        
        if (elements.soundEnabled.checked) {
            if (isSafari) {
                elements.safariSoundButton.classList.add('visible');
            } else {
                elements.expirationVideo.muted = false;
                console.log('Звук включен');
            }
        }
    });
}

function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;

    if (distance <= 0) {
        if (!isExpired) {
            isExpired = true;
            console.log('Таймер истёк, показываем видео');
            
            elements.initialLayout.style.display = 'none';
            elements.videoLayout.style.display = 'block';
            elements.expirationVideo.style.display = 'block';
            
            // Если видео еще не предзагружено, загружаем его
            const playVideo = isVideoPreloaded 
                ? Promise.resolve() 
                : preloadVideo();
            
            // Создаем promise для отслеживания окончания видео
            const videoEndPromise = new Promise((resolve) => {
                elements.expirationVideo.addEventListener('ended', resolve, { once: true });
            });

            // Начинаем воспроизведение
            playVideo
                .then(() => startPlayback())
                .then(() => videoEndPromise)
                .then(() => {
                    console.log('Видео закончилось, показываем часы');
                    elements.videoLayout.style.display = 'none';
                    elements.expiredLayout.style.display = 'flex';
                    document.body.classList.add('expired');
                    updateClock();
                    setInterval(updateClock, 1000);
                })
                .catch(error => {
                    console.error('Критическая ошибка при работе с видео:', error);
                    // В случае ошибки все равно показываем часы
                    elements.videoLayout.style.display = 'none';
                    elements.expiredLayout.style.display = 'flex';
                    document.body.classList.add('expired');
                    updateClock();
                    setInterval(updateClock, 1000);
                });
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

function handleEnterKey(e) {
    if (e.key === 'Enter') {
        updateTargetTime();
    }
}

function updateTargetTime() {
    const newDateTime = elements.targetDateTime.value;
    const newEventName = elements.eventNameInput.value;
    
    if (!newDateTime) {
        alert('Пожалуйста, выберите дату и время');
        return;
    }

    targetDate = new Date(newDateTime);
    targetDate.setSeconds(0, 0);
    
    if (newEventName) {
        elements.eventName.textContent = newEventName;
    }

    if (isExpired) {
        isExpired = false;
        elements.initialLayout.style.display = 'flex';
        elements.videoLayout.style.display = 'none';
        elements.expiredLayout.style.display = 'none';
        elements.expirationVideo.pause();
        elements.expirationVideo.currentTime = 0;
        elements.expirationVideo.muted = true;
        elements.safariSoundButton.classList.remove('visible');
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

// Обработчики событий для видео
elements.expirationVideo.addEventListener('loadstart', () => {
    console.log('Началась загрузка видео');
});

elements.expirationVideo.addEventListener('loadeddata', () => {
    console.log('Видео загружено и готово к воспроизведению');
    console.log('Длительность видео:', elements.expirationVideo.duration);
    console.log('Размеры видео:', {
        width: elements.expirationVideo.videoWidth,
        height: elements.expirationVideo.videoHeight
    });
});

elements.expirationVideo.addEventListener('canplay', () => {
    console.log('Видео можно воспроизводить');
});

// Обработчик для кнопки включения звука в Safari
elements.safariSoundButton.addEventListener('click', () => {
    elements.expirationVideo.muted = false;
    elements.safariSoundButton.style.display = 'none';
});

// Сохранение состояния звука
elements.soundEnabled.addEventListener('change', () => {
    localStorage.setItem('soundEnabled', elements.soundEnabled.checked);
});

// Установка минимальной даты как текущая
elements.targetDateTime.min = formatDateForInput(new Date());

// Инициализация начальных значений
elements.targetDateTime.value = formatDateForInput(targetDate);
elements.eventNameInput.value = elements.eventName.textContent;

// Загружаем сохранённое состояние звука
document.addEventListener('DOMContentLoaded', () => {
    const savedSoundState = localStorage.getItem('soundEnabled');
    if (savedSoundState !== null) {
        elements.soundEnabled.checked = savedSoundState === 'true';
    }
    
    // Начинаем предзагрузку видео
    preloadVideo().catch(error => {
        console.error('Не удалось предзагрузить видео:', error);
    });
});

// Обработчики событий
document.addEventListener('DOMContentLoaded', startTimer);
window.addEventListener('unload', cleanupTimer);

// Обработка Enter в полях ввода
elements.targetDateTime.addEventListener('keypress', handleEnterKey);
elements.eventNameInput.addEventListener('keypress', handleEnterKey);

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