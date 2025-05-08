const cardContainer = document.getElementById("cardContainer");
const addCardBtn = document.getElementById("addCardBtn");
const editModeToggle = document.getElementById("editModeToggle");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");

let cards = [];

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
                active: false
            };
        }
    }
    return card;
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
                div.classList.add("free");
                div.textContent = "FREE";
            } else if (editModeToggle.checked) {
                const input = document.createElement("input");
                input.className = "bingo-input";
                input.value = cell.number;
                input.addEventListener("change", (e) => {
                    cards[index].rows[rowIndex][colIndex].number = e.target.value;
                });
                div.appendChild(input);
            } else {
                div.textContent = cell.number;
                div.addEventListener("click", () => {
                    cell.active = !cell.active;
                    div.classList.toggle("active", cell.active);
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
    cards.forEach((card, index) => {
        createCardElement(card, index);
    });
}

addCardBtn.addEventListener("click", () => {
    cards.push(generateCardData());
    renderCards();
});

editModeToggle.addEventListener("change", renderCards);

exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(cards)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bingo-presets.json";
    a.click();
    URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => {
    importInput.click();
});

importInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                cards = JSON.parse(event.target.result);
                renderCards();
            } catch (err) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    }
});

// Initialize with 1 card
cards.push(generateCardData());
renderCards();
