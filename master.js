const timerElement = document.getElementById('time');
const scoreElement = document.getElementById('score');
const russianWordElement = document.getElementById('russian-word');
const englishWordElement = document.getElementById('english-word');
const inputElement = document.getElementById('input');
const levelSelect = document.getElementById('level-select');
const wordCountElement = document.getElementById('word-count');
const warningsElement = document.getElementById('warnings');
const pausePlayButton = document.getElementById('pause-play-btn');
const wpmElement = document.getElementById('wpm');

let wordsData = {};
let words = [];
let currentWordIndex = 0;
let score = 0;
let timeLeft = 60;
let timer;
let isPaused = false;
let currentLetterIndex = 0; // Track current position in word

// tracking accuracy
let totalAttempts = 0;
let correctAttempts = 0;
const accuracyElement = document.getElementById('accuracy');

// tracking wpm
let wordsTyped = 0;
let startTime;



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
        wordCountElement.textContent = words.length; // Set the initial word count
        startGame();
    } catch (error) {
        console.error('Error loading words:', error);
    }
}

function startGame() {
    score = 0;
    timeLeft = 600;

    // reset accuracy
    totalAttempts = 0;
    correctAttempts = 0;
    accuracyElement.textContent = '100%';

    // reset wpm
    wordsTyped = 0;
    startTime = Date.now();

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

    // Calculate WPM
    // const totalTimeInMinutes = (600 - timeLeft) / 60;
    // const wpm = (wordsTyped / totalTimeInMinutes).toFixed(2);
    // wpmElement.textContent = `WPM: ${wpm}`;
}

function showNextWord() {

    // removes words that have been typed already. progress to next level if all words are done
    if (words.length === 0) {
        clearInterval(timer);
        alert('Congratulations! You completed this level.');
        // Redirect to next level or handle level completion
        let nextLevelIndex = levelSelect.selectedIndex + 1;
        if (nextLevelIndex < levelSelect.options.length) {
            levelSelect.selectedIndex = nextLevelIndex;
            loadWords(levelSelect.value);
        } else {
            alert('You completed all levels!');
            // Optional: Handle what happens when all levels are completed
        }
        return;
    }

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



const russianCharacters = new Set('йцукенгшщзфывапролджэячсмитьбюё');

function detectKeyboardLayout(typedValue) {
    // Check if all characters in the typed value are Russian characters
    for (let char of typedValue) {
        if (!russianCharacters.has(char)) {
            // alert('Please switch to the Russian keyboard layout!');
            // return false;
            warningsElement.textContent = '⚠️ You may need to switch to the Russian keyboard layout';
            return false;
        }
    }
    // return true;
    warningsElement.textContent = "";
    return true;
}


inputElement.addEventListener('input', () => {
    const typedValue = inputElement.value.trim();  // TODO - bug with spaces in words on detect keyboard << NOT THIS
    const currentEnglishWord = words[currentWordIndex];
    const currentRussianWord = wordsData[currentEnglishWord];
    
    detectKeyboardLayout(typedValue);

    // accuracy rating
    totalAttempts++;

    // only allows the correct letter to be typed
    if (currentRussianWord.startsWith(typedValue)) {
        currentLetterIndex = typedValue.length;

        if (typedValue === currentRussianWord.substring(0, typedValue.length)) {
            correctAttempts++; // Increment correct attempts
        }

    } else {
        inputElement.value = currentRussianWord.substring(0, currentLetterIndex);
    }

    // update accuracy display
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;
    // window.console.log(totalAttempts, correctAttempts);
    accuracyElement.textContent = `${accuracy}%`;

    if (typedValue === currentRussianWord) {
        score++;
        wordsTyped++;
        scoreElement.textContent = score;

        // Remove the word from the array to prevent repetition
        words.splice(currentWordIndex, 1);
        wordCountElement.textContent = words.length; // Update the word count

        const level = levelSelect.value.match(/\d+/)[0]; // extract the number of the current level
        savePersonalBest( level, 600 - timeLeft, score, words.length, accuracy)

        showNextWord();
    } else {
        // Highlight next letter
        if (typedValue === currentRussianWord.substring(0, typedValue.length)) {
            currentLetterIndex = typedValue.length;
            highlightNextLetter(currentRussianWord[currentLetterIndex]);
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

    // set the window location for deeplinking into a given level
    window.location.hash = `level ${levelSelect.value.split('.')[0].replace('level', '')}`;

    // Update personal bests for the selected level
    const level = levelSelect.value.match(/\d+/)[0]; // extract the number of the current level
    loadPersonalBests(level);
});


// if the url hash has a level option set
const hash = decodeURIComponent(window.location.hash.substr(1)).toLowerCase(); // Remove the '#'
// console.log("hurray!")
// console.log(hash)
if (hash) {
    for (let i = 0; i < levelSelect.options.length; i++) {
        const optionText = levelSelect.options[i].textContent.trim().toLowerCase();
        // Find the position of colon
        const colonIndex = optionText.indexOf(':');
        // Compare option text before colon with hash
        const optionTextBeforeColon = optionText.substring(0, colonIndex).trim();
        
        // window.console.log(optionTextBeforeColon , hash)
        if (optionTextBeforeColon === hash) {
            levelSelect.selectedIndex = i;
            break;
        }
    }
}

// Load initial level
loadWords(levelSelect.value);


function togglePausePlay() {
    if (isPaused) {
        // Resume the game
        timer = setInterval(updateTimer, 1000);
        inputElement.disabled = false;
        pausePlayButton.textContent = '⏸️'; // Change button to pause icon
    } else {
        // Pause the game
        clearInterval(timer);
        inputElement.disabled = true;
        pausePlayButton.textContent = '▶️'; // Change button to play icon
    }
    isPaused = !isPaused; // Toggle the pause state
}
pausePlayButton.addEventListener('click', togglePausePlay);



// STORING PERSONAL BESTS ------

function savePersonalBest(level, time, score, wordsLeft, accuracy) {
    let personalBests = JSON.parse(localStorage.getItem('personalBests')) || {};
    
    if (!personalBests[level]) {
        personalBests[level] = [];
    }

    const newRecord = { time, score, wordsLeft, accuracy };

    // Check if this is better than the current best
    const currentBest = personalBests[level][0];  // Assuming best scores are sorted at index 0

    if (!currentBest || isBetterScore(newRecord, currentBest)) {
        // Add the new score as the best and sort the array
        personalBests[level].unshift(newRecord);  // Add to the front of the list
        personalBests[level] = personalBests[level].slice(0, 1);  // Keep only top 1 score
        
        // Save back to localStorage
        localStorage.setItem('personalBests', JSON.stringify(personalBests));
    }
}

// Higher score is better.
// If scores are tied, fewer words left is better.
// If both score and words left are the same, higher accuracy is better.
// If all of the above are the same, faster time is better.
function isBetterScore(newRecord, currentBest) {
    if (newRecord.score > currentBest.score) {
        return true;
    } else if (newRecord.score === currentBest.score) {
        if (newRecord.wordsLeft < currentBest.wordsLeft) {
            return true;
        } else if (newRecord.wordsLeft === currentBest.wordsLeft) {
            if (newRecord.accuracy > currentBest.accuracy) {
                return true;
            } else if (newRecord.accuracy === currentBest.accuracy) {
                return newRecord.time < currentBest.time;  // Faster time is better
            }
        }
    }
    return false;
}

function loadPersonalBests(level) {
    const personalBests = JSON.parse(localStorage.getItem('personalBests')) || {};
    const bests = personalBests[level] || [];
    const previousScoresDiv = document.getElementById('previous-scores');
    
    // Clear previous contents
    previousScoresDiv.innerHTML = '';

    if (bests.length === 0) {
        previousScoresDiv.innerHTML = '<p>No previous scores for this level.</p>';
    } else {
        bests.forEach((record, index) => {
            const scoreHTML = `
                <div>
                    <h5>Personal Best for this level:</h5>
                    <p>Time: ${record.time} | Score: ${record.score} | Words Left: ${record.wordsLeft} | Accuracy: ${record.accuracy}%</p>
                </div>
            `;
            previousScoresDiv.innerHTML += scoreHTML;
        });
    }
}

document.getElementById('medal').addEventListener('click', () => {
    const previousScoresDiv = document.getElementById('previous-scores');
    if (previousScoresDiv.style.display === 'none') {
        previousScoresDiv.style.display = 'block';
        // loadPersonalBests(levelSelect.value);  // Load bests for the current level
        const level = levelSelect.value.match(/\d+/)[0]; // extract the number of the current level
        loadPersonalBests(level);
    } else {
        previousScoresDiv.style.display = 'none';
    }
});

// levelSelect.addEventListener('change', () => {
//     // Existing code for handling level change...
//     loadPersonalBests(levelSelect.value);  // Update personal bests for the selected level
// });

// END STORING PERSONAL BESTS ------


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
        'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': '\'', 'ё': '\\',
        'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.', '.': '/'
    };

    // Highlight key on virtual keyboard
    function highlightKey(char) {
        // window.console.log('highlights')
        keys.forEach(key => {
            if (key.dataset.char === char) {
                key.classList.add('highlight');
            }
        });
    }

    // Remove highlight from all keys
    function removeHighlight() {
        // window.console.log('remove highlights')
        keys.forEach(key => {
            key.classList.remove('highlight');
        });
    }

    // Map physical key press to virtual keyboard key
    document.addEventListener('keydown', (event) => {
        // window.console.log('KEYDOWN')
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