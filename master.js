const timerElement = document.getElementById('time');
const scoreElement = document.getElementById('score');
const russianWordElement = document.getElementById('russian-word');
const englishWordElement = document.getElementById('english-word');
const inputElement = document.getElementById('input');
const levelSelect = document.getElementById('level-select');


let wordsData = {};
let words = [];
let currentWordIndex = 0;
let score = 0;
let timeLeft = 60;
let timer;

let currentLetterIndex = 0; // Track current position in word


async function loadWords(level) {
    try {
        const response = await fetch("data/" + level);
        const text = await response.text();
        wordsData = {};
        text.split('\n').forEach(line => {
            const [english, russian] = line.split(':');
            if (english && russian) {
                wordsData[english.trim()] = russian.trim();
            }
        });
        words = Object.keys(wordsData);
        startGame();
    } catch (error) {
        console.error('Error loading words:', error);
    }
}

function startGame() {
    score = 0;
    timeLeft = 600;
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    inputElement.disabled = false;
    inputElement.value = '';
    inputElement.focus();
    timer = setInterval(updateTimer, 1000);
    showNextWord();
}

function updateTimer() {
    timeLeft--;
    timerElement.textContent = timeLeft;
    if (timeLeft <= 0) {
        clearInterval(timer);
        inputElement.disabled = true;
        alert('Time is up! Your score is ' + score);
    }
}

function showNextWord() {
    currentWordIndex = Math.floor(Math.random() * words.length);
    const englishWord = words[currentWordIndex];
    const russianWord = wordsData[englishWord];
    russianWordElement.textContent = russianWord;
    englishWordElement.textContent = englishWord;
    currentLetterIndex = 0; // Reset index for new word
    speakWord(russianWord);
    inputElement.value = '';
    highlightNextLetter(russianWord[currentLetterIndex]); // Highlight the first letter
}


function speakWord(word) {
    // console.log('speakWord!')
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'ru-RU';
    window.speechSynthesis.speak(utterance);
}

inputElement.addEventListener('input', () => {
    const typedValue = inputElement.value.trim();
    const currentEnglishWord = words[currentWordIndex];
    const currentRussianWord = wordsData[currentEnglishWord];
    
    if (typedValue === currentRussianWord) {
        score++;
        scoreElement.textContent = score;
        showNextWord();
    } else {
        // Highlight the next letter
        if (typedValue === currentRussianWord.substring(0, typedValue.length)) {
            currentLetterIndex = typedValue.length; // Update current position
            highlightNextLetter(currentRussianWord[currentLetterIndex]); // Highlight next letter
        } else {
            removeHighlightNextKey(); // If typing is wrong, remove the highlight
        }
    }
});


// Function to highlight the next letter
function highlightNextLetter(nextLetter) {
    removeHighlightNextKey(); // Remove previous highlights
    if (nextLetter) {
        highlightNextKey(nextLetter); // Highlight the next letter on virtual keyboard
    }
    setTimeout(removeHighlightNextKey, 500); // flash off
}

// Function to remove all highlights from the virtual keyboard
function removeHighlightNextKey() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('next');
    });
}

// Highlight the key that corresponds to the given character
function highlightNextKey(char) {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        if (key.dataset.char === char) {
            key.classList.add('next');
        }
    });
}

levelSelect.addEventListener('change', () => {
    if (timer) clearInterval(timer);
    inputElement.disabled = true;
    loadWords(levelSelect.value);

    window.location.hash = `level ${levelSelect.value.split('.')[0].replace('level', '')}`;
});


// if the url hash has a level option set
const hash = decodeURIComponent(window.location.hash.substr(1)).toLowerCase(); // Remove the '#'
// console.log("hurray!")
console.log(hash)
if (hash) {
    for (let i = 0; i < levelSelect.options.length; i++) {
        const optionText = levelSelect.options[i].textContent.trim().toLowerCase();
        // Find the position of colon
        const colonIndex = optionText.indexOf(':');
        // Compare option text before colon with hash
        const optionTextBeforeColon = optionText.substring(0, colonIndex).trim();
        
        window.console.log(optionTextBeforeColon , hash)
        if (optionTextBeforeColon === hash) {
            levelSelect.selectedIndex = i;
            break;
        }
    }
}

// Load initial level
loadWords(levelSelect.value);


// keyboard --------

document.addEventListener('DOMContentLoaded', () => {
    const keys = document.querySelectorAll('.key');

    keys.forEach(key => {
        key.addEventListener('mousedown', () => {
            key.classList.add('highlight');
        });

        key.addEventListener('mouseup', () => {
            key.classList.remove('highlight');
        });

        key.addEventListener('mouseleave', () => {
            key.classList.remove('highlight');
        });
    });


    const keyMap = {
        'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']',
        'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': '\'',
        'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.', '.': '/'
    };

    // Highlight key on virtual keyboard
    function highlightKey(char) {
        window.console.log('highlights')
        keys.forEach(key => {
            if (key.dataset.char === char) {
                key.classList.add('highlight');
            }
        });
    }

    // Remove highlight from all keys
    function removeHighlight() {
        window.console.log('remove highlights')
        keys.forEach(key => {
            key.classList.remove('highlight');
        });
    }

    // Map physical key press to virtual keyboard key
    document.addEventListener('keydown', (event) => {
        window.console.log('KEYDOWN')
        removeHighlight();
        window.console.log(event.key);
        // const keyChar = Object.keys(keyMap).find(key => keyMap[key] === event.key);
        const keyChar = event.key;
        if (keyChar) {
            highlightKey(keyChar);
        }
    });

    document.addEventListener('keyup', () => {
        removeHighlight();
    });

});