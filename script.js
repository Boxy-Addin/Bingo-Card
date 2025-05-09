const cardContainer = document.getElementById("cardContainer");
const addCardBtn = document.getElementById("addCardBtn");
const editModeToggle = document.getElementById("editModeToggle");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");
const shakeSound = new Audio("shake.mp3");
const totalBalls = 75;

let cards = [];
let drawnBalls = new Set();

const ranges = {
    B: [1, 15],
    I: [16, 30],
    N: [31, 45],
    G: [46, 60],
    O: [61, 75]
};

function generateColumn(range, count) {
    const nums = [];
    while (nums.length < count) {
        const num = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
        if (!nums.includes(num)) nums.push(num);
    }
    return nums;
}

function generateCardData() {
    const card = { rows: [] };
    const cols = Object.values(ranges).map(r => generateColumn(r, 5));
    for (let row = 0; row < 5; row++) {
        card.rows[row] = [];
        for (let col = 0; col < 5; col++) {
            card.rows[row][col] = {
                number: (row === 2 && col === 2) ? "FREE" : cols[col][row],
                active: (row === 2 && col === 2)
            };
        }
    }
    return card;
}

function saveGameState() {
    localStorage.setItem("bingoCards", JSON.stringify(cards));
    localStorage.setItem("drawnBalls", JSON.stringify(Array.from(drawnBalls)));
    localStorage.setItem("editMode", editModeToggle.checked);
}

function loadGameState() {
    try {
        const savedCards = JSON.parse(localStorage.getItem("bingoCards"));
        const savedBalls = JSON.parse(localStorage.getItem("drawnBalls"));
        const savedEditMode = localStorage.getItem("editMode");

        if (Array.isArray(savedCards)) cards = savedCards;
        else cards = [generateCardData()];

        if (Array.isArray(savedBalls)) {
            drawnBalls = new Set(savedBalls);
            savedBalls.forEach(ball => {
                const ballEl = document.createElement("div");
                ballEl.className = "history-ball";
                ballEl.textContent = ball;
                document.getElementById("ballHistory").appendChild(ballEl);
            });
        }

        if (savedEditMode !== null) editModeToggle.checked = savedEditMode === "true";
    } catch (e) {
        cards = [generateCardData()];
    }
}

function checkBingo(card) {
    const isActive = (r, c) => card.rows[r][c].active;

    const patternMap = {
        horizontal: [0, 1, 2, 3, 4].map(r => [[r, 0], [r, 1], [r, 2], [r, 3], [r, 4]]),
        vertical: [0, 1, 2, 3, 4].map(c => [[0, c], [1, c], [2, c], [3, c], [4, c]]),
        diagonal: [
            [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]],
            [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]]
        ],
        x: [
            [[0, 0], [0, 4], [2, 2], [4, 0], [4, 4]]
        ],
        y: [
            [[0, 0], [1, 1], [2, 2], [3, 2], [4, 2], [1, 3], [0, 4]]
        ],
        diamond: [
            [[0, 2], [1, 1], [2, 2], [3, 3], [4, 2], [3, 1], [1, 3], [2, 0], [2, 4]]
        ],
        full: ["FULL"]
    };

    const selectedPatterns = Array.from(document.querySelectorAll('#patternCheckboxes input[type=checkbox]:checked')).map(cb => cb.value);
    const patternsToCheck = selectedPatterns.flatMap(p => patternMap[p]);

    for (let pattern of patternsToCheck) {
        if (pattern === "FULL") {
            const full = card.rows.every(row => row.every(cell => cell.active));
            if (full) return "FULL";
        } else {
            if (pattern.every(([r, c]) => isActive(r, c))) {
                return pattern; // return coordinate array
            }
        }
    }

    return false;
}

function showBingoCelebration() {
    Swal.fire({
        title: "🎉 Bingo!",
        text: "Congratulations, you won!",
        icon: "success",
        confirmButtonText: "Continue"
    });
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
}

function createCardElement(card, index) {
    const col = document.createElement("div");
    col.className = "col-md-4";
    const cardDiv = document.createElement("div");
    cardDiv.className = "bingo-card";

    const headerRow = document.createElement("div");
    headerRow.className = "card-grid bingo-header";
    ["B", "I", "N", "G", "O"].forEach(l => {
        const div = document.createElement("div");
        div.textContent = l;
        headerRow.appendChild(div);
    });
    cardDiv.appendChild(headerRow);

    const grid = document.createElement("div");
    grid.className = "card-grid";

    card.rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const div = document.createElement("div");
            div.className = "bingo-cell";

            if (cell.number === "FREE") {
                div.classList.add("free", "active");
                div.textContent = "FREE";
            } else if (editModeToggle.checked) {
                const input = document.createElement("input");
                input.className = "bingo-input";
                input.value = cell.number;
                input.addEventListener("change", (e) => {
                    cards[index].rows[rowIndex][colIndex].number = e.target.value;
                    saveGameState();
                });
                div.appendChild(input);
            } else {
                div.textContent = cell.number;
                div.addEventListener("click", () => {
                    cell.active = !cell.active;
                    div.classList.toggle("active", cell.active);
                    saveGameState();

                    const result = checkBingo(card);
                    if (result) {
                        showBingoCelebration();
                        const cardElement = cardContainer.children[index];
                        highlightWinningPattern(card, result, cardElement);
                    }
                });
                if (cell.active) div.classList.add("active");
            }
            grid.appendChild(div);
        });
    });

    cardDiv.appendChild(grid);

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-sm btn-danger mt-2 w-100";
    removeBtn.textContent = "Remove Card";
    removeBtn.addEventListener("click", () => {
        Swal.fire({
            title: "Remove this card?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, remove it"
        }).then((result) => {
            if (result.isConfirmed) {
                cards.splice(index, 1);
                renderCards();
                saveGameState();
                Swal.fire("Removed!", "The card has been removed.", "success");
            }
        });
    });

    cardDiv.appendChild(removeBtn);
    col.appendChild(cardDiv);
    cardContainer.appendChild(col);
}

function renderCards() {
    cardContainer.innerHTML = "";
    document.querySelectorAll(".winning-cell").forEach(el => el.classList.remove("winning-cell"));
    cards.forEach((card, index) => {
        createCardElement(card, index);
    });
}

function updateBallCounts() {
    document.getElementById("ballsDrawnCount").textContent = drawnBalls.size;
    document.getElementById("ballsRemainingCount").textContent = totalBalls - drawnBalls.size;
}

addCardBtn.addEventListener("click", () => {
    cards.push(generateCardData());
    renderCards();
    saveGameState();
});

editModeToggle.addEventListener("change", () => {
    renderCards();
    saveGameState();
});

exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(cards)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Bingo-Preset.json";
    a.click();
    URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                cards = JSON.parse(event.target.result);
                renderCards();
                saveGameState();
            } catch {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    }
});

document.getElementById("rollBallBtn").addEventListener("click", () => {
    const overlay = document.getElementById("bottleOverlay");
    overlay.classList.remove("d-none");
    const bottle = overlay.querySelector(".bottle-shake");
    bottle.classList.remove("bottle-shake");
    void bottle.offsetWidth;
    bottle.classList.add("bottle-shake");
    shakeSound.currentTime = 0;
    shakeSound.play().catch(console.error);

    setTimeout(() => {
        overlay.classList.add("d-none");

        const letters = ["B", "I", "N", "G", "O"];
        let drawnBall = '';
        let rawBall = '';
        do {
            const letter = letters[Math.floor(Math.random() * 5)];
            const range = ranges[letter];
            const number = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
            rawBall = `${letter}${number}`;
            drawnBall = `${letter}-${number}`;
        } while (drawnBalls.has(drawnBall) && drawnBalls.size < totalBalls);

        drawnBalls.add(drawnBall);

        // Auto-mark matching numbers on all cards
        const drawnNum = parseInt(rawBall.slice(1)); // Get number part like 5 from B5

        cards.forEach((card, cardIndex) => {
            card.rows.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell.number == drawnNum && !cell.active) {
                        cell.active = true;

                        // Visually update the cell in the DOM
                        const cardElement = cardContainer.children[cardIndex];
                        const grid = cardElement.querySelectorAll(".card-grid")[1];
                        const cellIndex = rowIndex * 5 + colIndex;
                        const cellDiv = grid.children[cellIndex];
                        cellDiv.classList.add("active");
                    }
                });
            });

            const result = checkBingo(card);

            if (result) {
            showBingoCelebration();

            const cardElement = cardContainer.children[cardIndex];
            const grid = cardElement.querySelectorAll(".card-grid")[1];

            // Clear old highlights
            grid.querySelectorAll(".winning-cell").forEach(el => el.classList.remove("winning-cell"));

            highlightWinningPattern(card, result, cardElement);

        }

        });


        Swal.fire({
            title: '🎉 Ball Drawn!',
            html: `<div style="width:120px;height:120px;margin:auto;border-radius:50%;background:white;border:4px solid black;font-size:1.8rem;font-weight:bold;display:flex;align-items:center;justify-content:center;color:#0d6efd;box-shadow:0 4px 10px rgba(0,0,0,0.3);">${drawnBall}</div>`,
            showConfirmButton: false,
            timer: 2000,
        });

        const ballEl = document.createElement("div");
        ballEl.className = "history-ball";
        ballEl.textContent = drawnBall;
        document.getElementById("ballHistory").appendChild(ballEl);

        updateBallCounts();
        saveGameState();
    }, 2800);
});

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    drawnBalls.clear();
    document.getElementById("ballHistory").innerHTML = '';
    updateBallCounts();
    saveGameState();
});

document.getElementById("resetBtn").addEventListener("click", () => {
    cards.forEach(card => {
        card.rows.forEach(row => {
            row.forEach(cell => {
                if (cell.number !== "FREE") cell.active = false;
            });
        });
    });
    drawnBalls.clear();
    document.getElementById("ballHistory").innerHTML = '';
    updateBallCounts();
    renderCards();
    saveGameState();

    Swal.fire({
        title: "Reset Complete!",
        text: "All cards and ball history have been reset.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
    });
});

function highlightWinningPattern(card, result, cardElement) {
    const grid = cardElement.querySelectorAll(".card-grid")[1];
    grid.querySelectorAll(".winning-cell").forEach(el => el.classList.remove("winning-cell"));

    if (result === "FULL") {
        [...grid.children].forEach(cell => cell.classList.add("winning-cell"));
    } else {
        result.forEach(([r, c]) => {
            const index = r * 5 + c;
            grid.children[index].classList.add("winning-cell");
        });
    }
}


loadGameState();
renderCards();
updateBallCounts();
