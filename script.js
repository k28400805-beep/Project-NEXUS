```javascript
/* =========================================================
   KUT GAMES
   ========================================================= */

const STORAGE_KEY = "kut_games_data";


/* =========================================================
   DATA
   ========================================================= */

const defaultData = {
    xp: 0,
    level: 1,

    gamesPlayed: 0,
    wins: 0,

    achievements: 0,

    dailyStreak: 1,
    dailyGames: [],

    cityLevel: 1,
    kingdomPower: 35,
    carPower: 120,
    footballWins: 0,

    activities: [],

    settings: {
        theme: "dark",
        sound: true
    }
};


let data = loadData();


function loadData() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return structuredClone(defaultData);
    }

    try {
        return {
            ...structuredClone(defaultData),
            ...JSON.parse(saved)
        };
    } catch {
        return structuredClone(defaultData);
    }
}


function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}


/* =========================================================
   HELPERS
   ========================================================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => document.querySelectorAll(selector);


function showToast(message) {

    const container = $("#toastContainer");

    const toast = document.createElement("div");

    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2800);
}


function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   XP SYSTEM
   ========================================================= */

function xpNeeded(level) {
    return 100 + ((level - 1) * 50);
}


function addXP(amount, reason = "") {

    data.xp += amount;

    let leveledUp = false;

    while (data.xp >= xpNeeded(data.level)) {

        data.xp -= xpNeeded(data.level);

        data.level++;

        leveledUp = true;
    }

    saveData();
    updateUI();

    if (reason) {
        showToast(`+${amount} XP — ${reason}`);
    }

    if (leveledUp) {
        showToast(`🎉 Seviye atladın! Seviye ${data.level}`);
    }
}


function calculateTotalXP() {

    let total = data.xp;

    for (let i = 1; i < data.level; i++) {
        total += xpNeeded(i);
    }

    return total;
}


/* =========================================================
   UI
   ========================================================= */

function updateUI() {

    const needed = xpNeeded(data.level);

    $("#gamesPlayed").textContent = data.gamesPlayed;
    $("#totalXP").textContent = calculateTotalXP();

    $("#achievements").textContent = data.achievements;

    $("#dailyStreak").textContent =
        `${data.dailyStreak} gün`;

    $("#sidebarLevel").textContent =
        `Seviye ${data.level}`;

    $("#topLevel").textContent =
        `Seviye ${data.level}`;

    $("#levelBadge").textContent =
        `LVL ${data.level}`;

    $("#xpText").textContent =
        `${data.xp} / ${needed} XP`;

    $("#xpFill").style.width =
        `${Math.min(100, (data.xp / needed) * 100)}%`;

    $("#wins").textContent = data.wins;
    $("#profileGames").textContent = data.gamesPlayed;
    $("#profileAchievements").textContent = data.achievements;

    const dailyUnique =
        new Set(data.dailyGames).size;

    $("#questText").textContent =
        `${Math.min(3, dailyUnique)} / 3`;

    $("#questPercent").textContent =
        `${Math.min(100, Math.round((dailyUnique / 3) * 100))}%`;

    $("#questFill").style.width =
        `${Math.min(100, (dailyUnique / 3) * 100)}%`;
}


/* =========================================================
   NAVIGATION
   ========================================================= */

const pageNames = {
    home: "Ana Sayfa",
    games: "Oyun Merkezi",
    city: "Şehrim",
    kingdom: "Kuzeyyaka",
    space: "Uzay",
    detective: "Dedektif",
    garage: "Garaj",
    football: "Futbol",
    internet: "Sanal İnternet",
    terminal: "Terminal",
    achievements: "Başarımlar"
};


function navigateTo(page) {

    $$(".page").forEach(section => {
        section.classList.remove("active");
    });

    const target = $(`#${page}Page`);

    if (target) {
        target.classList.add("active");
    }

    $$(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    if (page !== "home") {
        showToast(`${pageNames[page] || page}`);
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


$$("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        navigateTo(button.dataset.page);

        $(".sidebar")?.classList.remove("open");
    });
});


$$("[data-page-jump]").forEach(button => {

    button.addEventListener("click", () => {
        navigateTo(button.dataset.pageJump);
    });
});


/* =========================================================
   DAILY GAMES
   ========================================================= */

function recordGamePlayed(gameName) {

    data.gamesPlayed++;

    if (!data.dailyGames.includes(gameName)) {
        data.dailyGames.push(gameName);
    }

    data.activities.unshift({
        text: `${gameName} oynandı.`,
        time: new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit"
        })
    });

    data.activities =
        data.activities.slice(0, 20);

    saveData();

    updateUI();

    checkAchievements();

    const unique =
        new Set(data.dailyGames).size;

    if (unique >= 3 && !data.dailyGames.includes("__DAILY_COMPLETE__")) {

        data.dailyGames.push("__DAILY_COMPLETE__");

        saveData();

        addXP(50, "Günlük görev tamamlandı!");

        data.achievements++;

        saveData();
        updateUI();
    }
}


/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

function checkAchievements() {

    if (data.gamesPlayed >= 1 && data.achievements < 1) {

        data.achievements = 1;

        showToast("🏆 Başarım açıldı: İlk Oyun");
    }

    if (calculateTotalXP() >= 100 && data.achievements < 2) {

        data.achievements = 2;

        showToast("🏆 Başarım açıldı: XP Avcısı");
    }

    saveData();
}


/* =========================================================
   GAME SYSTEM
   ========================================================= */

const gameModal = $("#gameModal");
const gameContent = $("#gameContent");


function openGame(title, html) {

    gameContent.innerHTML = `
        <div class="game-title">
            <small>KUT GAMES</small>
            <h2>${title}</h2>
        </div>

        ${html}
    `;

    gameModal.classList.remove("hidden");
}


function closeGame() {
    gameModal.classList.add("hidden");
    gameContent.innerHTML = "";
}


$("#closeGame").addEventListener("click", closeGame);

gameModal.addEventListener("click", e => {

    if (e.target === gameModal) {
        closeGame();
    }
});


function finishGame(gameName, win, xp = 10) {

    recordGamePlayed(gameName);

    if (win) {
        data.wins++;

        addXP(xp, `${gameName} kazandın!`);
    } else {
        addXP(5, `${gameName} tamamlandı.`);
    }

    saveData();
    updateUI();
}


/* =========================================================
   GAME SELECTOR
   ========================================================= */

$$("[data-game]").forEach(button => {

    button.addEventListener("click", () => {

        const game = button.dataset.game;

        switch (game) {

            case "Refleks Arenası":
                reflexGame();
                break;

            case "Hedef Vurma":
                targetGame();
                break;

            case "Memory Grid":
                memoryGame();
                break;

            case "Sayı Tahmini":
                numberGame();
                break;

            case "Snake KUT":
                snakeGame();
                break;

            case "KUT Racer":
                racerGame();
                break;

            case "Asteroid Rush":
                asteroidGame();
                break;

            case "Penaltı":
                penaltyGame();
                break;

            default:
                showToast("Oyun bulunamadı.");
        }
    });
});


/* =========================================================
   1 — REFLEX
   ========================================================= */

function reflexGame() {

    openGame(
        "⚡ Refleks Arenası",
        `
        <div class="mini-game">

            <p id="reflexInfo">
                Hazır ol. Kutu yeşile dönünce tıkla!
            </p>

            <button id="reflexBox"
                style="
                    width:100%;
                    height:220px;
                    border:0;
                    border-radius:20px;
                    background:#22283a;
                    color:white;
                    font-size:24px;
                    cursor:pointer;
                ">
                BEKLE
            </button>

            <div id="reflexResult"></div>

        </div>
        `
    );

    const box = $("#reflexBox");
    const info = $("#reflexInfo");

    let startTime = 0;
    let active = false;

    const delay = 1200 + Math.random() * 2500;

    const timer = setTimeout(() => {

        active = true;

        startTime = performance.now();

        box.style.background =
            "linear-gradient(135deg,#39e58c,#00d4ff)";

        box.textContent = "ŞİMDİ!";

        info.textContent =
            "TIKLA!";

    }, delay);


    box.addEventListener("click", () => {

        if (!active) {

            clearTimeout(timer);

            box.textContent = "ÇOK ERKEN!";

            $("#reflexResult").innerHTML =
                `<p style="color:#ff5577;margin-top:15px">
                    Erken bastın. Tekrar dene!
                </p>`;

            finishGame("Refleks Arenası", false);

            return;
        }

        const time =
            Math.round(performance.now() - startTime);

        box.textContent =
            `${time} ms`;

        $("#reflexResult").innerHTML =
            `<p style="margin-top:15px;color:#39e58c">
                ⚡ ${time} ms refleks!
            </p>`;

        finishGame("Refleks Arenası", time < 700, 15);

        active = false;
    });
}


/* =========================================================
   2 — TARGET
   ========================================================= */

function targetGame() {

    openGame(
        "🎯 Hedef Vurma",
        `
        <p>
            10 saniye içinde hedefe olabildiğince çok tıkla!
        </p>

        <div id="targetArena"
            style="
                position:relative;
                height:350px;
                margin-top:20px;
                overflow:hidden;
                border-radius:18px;
                background:#080b14;
                border:1px solid rgba(255,255,255,.08);
            ">

            <button id="target"
                style="
                    position:absolute;
                    width:55px;
                    height:55px;
                    border:0;
                    border-radius:50%;
                    background:linear-gradient(135deg,#ff5577,#ffbd4a);
                    cursor:pointer;
                    font-size:20px;
                ">
                🎯
            </button>

        </div>

        <h3 id="targetScore">
            Skor: 0
        </h3>

        <p id="targetTimer">
            Süre: 10
        </p>
        `
    );

    const target = $("#target");
    const arena = $("#targetArena");

    let score = 0;
    let time = 10;

    function moveTarget() {

        const x =
            Math.random() * (arena.clientWidth - 65);

        const y =
            Math.random() * (arena.clientHeight - 65);

        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
    }

    moveTarget();

    target.addEventListener("click", () => {

        score++;

        $("#targetScore").textContent =
            `Skor: ${score}`;

        moveTarget();
    });

    const interval = setInterval(() => {

        time--;

        $("#targetTimer").textContent =
            `Süre: ${time}`;

        if (time <= 0) {

            clearInterval(interval);

            target.disabled = true;

            const win = score >= 8;

            $("#targetTimer").textContent =
                `Bitti! Skorun: ${score}`;

            finishGame(
                "Hedef Vurma",
                win,
                Math.min(30, 10 + score)
            );
        }

    }, 1000);
}


/* =========================================================
   3 — MEMORY
   ========================================================= */

function memoryGame() {

    const size = 16;

    openGame(
        "🧠 Memory Grid",
        `
        <p>Kısa süre görünen kareleri hatırla.</p>

        <div id="memoryGrid"
            style="
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:8px;
                max-width:360px;
                margin:25px auto;
            ">
        </div>

        <p id="memoryInfo">
            Hazırlanıyor...
        </p>
        `
    );

    const grid = $("#memoryGrid");

    const cells = [];

    for (let i = 0; i < size; i++) {

        const cell = document.createElement("button");

        cell.style.cssText = `
            aspect-ratio:1;
            border:0;
            border-radius:10px;
            background:#20263a;
            cursor:pointer;
        `;

        grid.appendChild(cell);

        cells.push(cell);
    }

    const correct = [];

    while (correct.length < 5) {

        const random =
            Math.floor(Math.random() * size);

        if (!correct.includes(random)) {
            correct.push(random);
        }
    }

    correct.forEach(i => {
        cells[i].style.background =
            "linear-gradient(135deg,#7c5cff,#00d4ff)";
    });

    setTimeout(() => {

        cells.forEach(cell => {
            cell.style.background = "#20263a";
        });

        $("#memoryInfo").textContent =
            "Şimdi gördüğün kareleri seç!";

        let selected = [];

        cells.forEach((cell, index) => {

            cell.addEventListener("click", () => {

                if (selected.includes(index)) return;

                selected.push(index);

                cell.style.background =
                    "linear-gradient(135deg,#7c5cff,#00d4ff)";

                const wrong =
                    !correct.includes(index);

                if (wrong) {

                    $("#memoryInfo").textContent =
                        "❌ Yanlış kare!";

                    finishGame("Memory Grid", false);

                    return;
                }

                if (selected.length === correct.length) {

                    $("#memoryInfo").textContent =
                        "🎉 Mükemmel hafıza!";

                    finishGame(
                        "Memory Grid",
                        true,
                        20
                    );
                }
            });
        });

    }, 1800);
}


/* =========================================================
   4 — NUMBER
   ========================================================= */

function numberGame() {

    const secret =
        Math.floor(Math.random() * 100) + 1;

    let attempts = 0;

    openGame(
        "🔢 Sayı Tahmini",
        `
        <p>1 ile 100 arasında bir sayı tuttum.</p>

        <div style="display:flex;gap:10px;margin-top:25px">

            <input id="numberInput"
                type="number"
                min="1"
                max="100"
                placeholder="Tahminin"
                style="
                    flex:1;
                    padding:14px;
                    border-radius:10px;
                    border:1px solid rgba(255,255,255,.1);
                    background:#080b14;
                    color:white;
                    outline:0;
                ">

            <button id="numberGuess"
                class="primary-btn">
                Tahmin Et
            </button>

        </div>

        <div id="numberResult"
            style="margin-top:20px;color:#aab2c5">
        </div>
        `
    );

    $("#numberGuess").addEventListener("click", () => {

        const value =
            Number($("#numberInput").value);

        if (value < 1 || value > 100) {
            showToast("1 ile 100 arasında bir sayı gir.");
            return;
        }

        attempts++;

        if (value === secret) {

            $("#numberResult").innerHTML =
                `🎉 Bildin! ${attempts} denemede buldun.`;

            finishGame(
                "Sayı Tahmini",
                true,
                Math.max(10, 35 - attempts * 3)
            );

        } else if (value < secret) {

            $("#numberResult").textContent =
                "Daha büyük bir sayı.";

        } else {

            $("#numberResult").textContent =
                "Daha küçük bir sayı.";
        }
    });
}


/* =========================================================
   5 — SNAKE
   ========================================================= */

function snakeGame() {

    openGame(
        "🐍 Snake KUT",
        `
        <canvas id="snakeCanvas"
            width="400"
            height="400"
            style="
                display:block;
                width:min(400px,100%);
                margin:20px auto;
                background:#05070c;
                border:1px solid rgba(255,255,255,.1);
                border-radius:12px;
            ">
        </canvas>

        <p style="text-align:center">
            Ok tuşları veya WASD ile hareket et.
        </p>

        <h3 id="snakeScore"
            style="text-align:center;margin-top:10px">
            Skor: 0
        </h3>
        `
    );

    const canvas = $("#snakeCanvas");
    const ctx = canvas.getContext("2d");

    const grid = 20;

    let snake = [
        {x:200,y:200},
        {x:180,y:200},
        {x:160,y:200}
    ];

    let dx = grid;
    let dy = 0;

    let food = randomFood();

    let score = 0;

    let gameOver = false;

    function randomFood() {

        return {
            x: Math.floor(Math.random() * 20) * grid,
            y: Math.floor(Math.random() * 20) * grid
        };
    }

    function draw() {

        ctx.fillStyle = "#05070c";
        ctx.fillRect(0,0,400,400);

        snake.forEach((part,index) => {

            ctx.fillStyle =
                index === 0 ? "#00d4ff" : "#7c5cff";

            ctx.fillRect(
                part.x,
                part.y,
                grid - 2,
                grid - 2
            );
        });

        ctx.fillStyle = "#ff5577";

        ctx.fillRect(
            food.x,
            food.y,
            grid - 2,
            grid - 2
        );
    }

    function update() {

        if (gameOver) return;

        const head = {
            x: snake[0].x + dx,
            y: snake[0].y + dy
        };

        if (
            head.x < 0 ||
            head.y < 0 ||
            head.x >= 400 ||
            head.y >= 400
        ) {
            endSnake();
            return;
        }

        for (let i = 0; i < snake.length; i++) {

            if (
                head.x === snake[i].x &&
                head.y === snake[i].y
            ) {
                endSnake();
                return;
            }
        }

        snake.unshift(head);

        if (
            head.x === food.x &&
            head.y === food.y
        ) {

            score++;

            $("#snakeScore").textContent =
                `Skor: ${score}`;

            food = randomFood();

        } else {

            snake.pop();
        }

        draw();
    }

    function endSnake() {

        gameOver = true;

        finishGame(
            "Snake KUT",
            score >= 3,
            Math.min(35, 10 + score * 3)
        );

        setTimeout(() => {

            ctx.fillStyle = "rgba(0,0,0,.7)";
            ctx.fillRect(0,0,400,400);

            ctx.fillStyle = "white";
            ctx.font = "bold 28px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                `OYUN BİTTİ`,
                200,
                190
            );

            ctx.font = "16px Arial";

            ctx.fillText(
                `Skor: ${score}`,
                200,
                225
            );

        }, 100);
    }

    document.onkeydown = e => {

        const key = e.key.toLowerCase();

        if (
            (key === "arrowup" || key === "w") &&
            dy === 0
        ) {
            dx = 0;
            dy = -grid;
        }

        if (
            (key === "arrowdown" || key === "s") &&
            dy === 0
        ) {
            dx = 0;
            dy = grid;
        }

        if (
            (key === "arrowleft" || key === "a") &&
            dx === 0
        ) {
            dx = -grid;
            dy = 0;
        }

        if (
            (key === "arrowright" || key === "d") &&
            dx === 0
        ) {
            dx = grid;
            dy = 0;
        }
    };

    draw();

    const interval =
        setInterval(update, 120);

    const observer =
        new MutationObserver(() => {

            if (gameModal.classList.contains("hidden")) {
                clearInterval(interval);
                observer.disconnect();
            }

        });

    observer.observe(gameModal, {
        attributes: true
    });
}


/* =========================================================
   6 — KUT RACER
   ========================================================= */

function racerGame() {

    openGame(
        "🏎️ KUT Racer",
        `
        <canvas id="racerCanvas"
            width="400"
            height="500"
            style="
                display:block;
                width:min(400px,100%);
                margin:auto;
                background:#111;
                border-radius:15px;
            ">
        </canvas>

        <p style="text-align:center;margin-top:12px">
            ← → veya A / D ile aracı hareket ettir.
        </p>
        `
    );

    const canvas = $("#racerCanvas");
    const ctx = canvas.getContext("2d");

    let playerX = 175;

    let obstacles = [];

    let score = 0;

    let running = true;

    function spawn() {

        obstacles.push({
            x: 65 + Math.random() * 270,
            y: -70,
            speed: 4 + Math.random() * 2
        });
    }

    function draw() {

        ctx.fillStyle = "#0b0d13";
        ctx.fillRect(0,0,400,500);

        /* road */

        ctx.fillStyle = "#20242e";
        ctx.fillRect(50,0,300,500);

        /* lines */

        ctx.strokeStyle = "#ffffff33";
        ctx.setLineDash([25,25]);
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(200,0);
        ctx.lineTo(200,500);
        ctx.stroke();

        ctx.setLineDash([]);

        /* player */

        ctx.fillStyle = "#00d4ff";
        ctx.fillRect(playerX,430,50,60);

        /* obstacles */

        ctx.fillStyle = "#ff5577";

        obstacles.forEach(o => {

            ctx.fillRect(o.x,o.y,50,60);
        });

        ctx.fillStyle = "white";
        ctx.font = "bold 18px Arial";

        ctx.fillText(
            `Skor: ${score}`,
            15,
            30
        );
    }

    function update() {

        if (!running) return;

        obstacles.forEach(o => {
            o.y += o.speed;
        });

        obstacles =
            obstacles.filter(o => {

                if (o.y > 510) {

                    score++;

                    return false;
                }

                return true;
            });

        obstacles.forEach(o => {

            if (
                playerX < o.x + 50 &&
                playerX + 50 > o.x &&
                430 < o.y + 60 &&
                490 > o.y
            ) {
                end();
            }
        });

        draw();
    }

    function end() {

        if (!running) return;

        running = false;

        finishGame(
            "KUT Racer",
            score >= 5,
            Math.min(35,10 + score)
        );

        ctx.fillStyle = "rgba(0,0,0,.7)";
        ctx.fillRect(0,0,400,500);

        ctx.fillStyle = "white";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "YARIŞ BİTTİ",
            200,
            230
        );

        ctx.font = "16px Arial";

        ctx.fillText(
            `Skor: ${score}`,
            200,
            260
        );
    }

    document.onkeydown = e => {

        const key = e.key.toLowerCase();

        if (
            key === "arrowleft" ||
            key === "a"
        ) {
            playerX -= 25;
        }

        if (
            key === "arrowright" ||
            key === "d"
        ) {
            playerX += 25;
        }

        playerX =
            Math.max(55, Math.min(295, playerX));
    };

    const spawnInterval =
        setInterval(() => {

            if (running) {
                spawn();
            } else {
                clearInterval(spawnInterval);
            }

        }, 900);

    const gameInterval =
        setInterval(() => {

            if (running) {
                update();
            } else {
                clearInterval(gameInterval);
            }

        }, 30);

    draw();
}


/* =========================================================
   7 — ASTEROID
   ========================================================= */

function asteroidGame() {

    openGame(
        "☄️ Asteroid Rush",
        `
        <canvas id="asteroidCanvas"
            width="500"
            height="400"
            style="
                display:block;
                width:100%;
                max-width:500px;
                margin:auto;
                background:#03040a;
                border-radius:15px;
            ">
        </canvas>

        <p style="text-align:center;margin-top:12px">
            ← → ile gemiyi hareket ettir.
        </p>
        `
    );

    const canvas = $("#asteroidCanvas");
    const ctx = canvas.getContext("2d");

    let playerX = 250;

    let asteroids = [];

    let score = 0;

    let running = true;

    function spawn() {

        asteroids.push({
            x: Math.random() * 470,
            y: -30,
            size: 20 + Math.random() * 20,
            speed: 2 + Math.random() * 3
        });
    }

    function update() {

        if (!running) return;

        asteroids.forEach(a => {
            a.y += a.speed;
        });

        asteroids =
            asteroids.filter(a => {

                if (a.y > 430) {

                    score++;

                    return false;
                }

                return true;
            });

        asteroids.forEach(a => {

            if (
                Math.abs(playerX - a.x) < 30 &&
                Math.abs(350 - a.y) < 35
            ) {
                end();
            }
        });

        draw();
    }

    function draw() {

        ctx.fillStyle = "#03040a";
        ctx.fillRect(0,0,500,400);

        /* stars */

        for (let i = 0; i < 35; i++) {

            ctx.fillStyle = "#ffffff55";

            ctx.fillRect(
                (i * 73) % 500,
                (i * 47 + score * 2) % 400,
                2,
                2
            );
        }

        /* ship */

        ctx.fillStyle = "#00d4ff";

        ctx.beginPath();

        ctx.moveTo(playerX,330);
        ctx.lineTo(playerX - 20,370);
        ctx.lineTo(playerX,360);
        ctx.lineTo(playerX + 20,370);

        ctx.closePath();
        ctx.fill();

        /* asteroids */

        ctx.fillStyle = "#aaa";

        asteroids.forEach(a => {

            ctx.beginPath();

            ctx.arc(
                a.x,
                a.y,
                a.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        });

        ctx.fillStyle = "white";
        ctx.font = "bold 18px Arial";

        ctx.fillText(
            `Skor: ${score}`,
            15,
            30
        );
    }

    function end() {

        if (!running) return;

        running = false;

        finishGame(
            "Asteroid Rush",
            score >= 5,
            Math.min(35,10 + score)
        );

        ctx.fillStyle = "rgba(0,0,0,.7)";
        ctx.fillRect(0,0,500,400);

        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        ctx.font = "bold 28px Arial";

        ctx.fillText(
            "GEMİ PATLADI",
            250,
            190
        );

        ctx.font = "16px Arial";

        ctx.fillText(
            `Skor: ${score}`,
            250,
            220
        );
    }

    document.onkeydown = e => {

        const key = e.key.toLowerCase();

        if (
            key === "arrowleft" ||
            key === "a"
        ) {
            playerX -= 25;
        }

        if (
            key === "arrowright" ||
            key === "d"
        ) {
            playerX += 25;
        }

        playerX =
            Math.max(25, Math.min(475, playerX));
    };

    const spawnInterval =
        setInterval(() => {

            if (running) {
                spawn();
            } else {
                clearInterval(spawnInterval);
            }

        }, 600);

    const gameInterval =
        setInterval(() => {

            if (running) {
                update();
            } else {
                clearInterval(gameInterval);
            }

        }, 30);

    draw();
}


/* =========================================================
   8 — PENALTY
   ========================================================= */

function penaltyGame() {

    openGame(
        "⚽ Penaltı",
        `
        <p style="text-align:center">
            Kalecinin olmadığı köşeyi seç!
        </p>

        <div style="
            margin:25px auto;
            max-width:450px;
            height:280px;
            background:#176b3a;
            border:10px solid white;
            border-bottom:35px solid white;
            position:relative;
            border-radius:10px;
        ">

            <div style="
                position:absolute;
                left:50%;
                top:20px;
                transform:translateX(-50%);
                font-size:65px;
            ">
                🧤
            </div>

            <div style="
                position:absolute;
                left:50%;
                bottom:45px;
                transform:translateX(-50%);
                font-size:45px;
            ">
                ⚽
            </div>

        </div>

        <div style="
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:8px;
        ">

            <button class="primary-btn penalty-choice" data-side="left">
                SOL
            </button>

            <button class="primary-btn penalty-choice" data-side="middle">
                ORTA
            </button>

            <button class="primary-btn penalty-choice" data-side="right">
                SAĞ
            </button>

        </div>

        <div id="penaltyResult"
            style="text-align:center;margin-top:20px">
        </div>
        `
    );

    const goalkeeper =
        ["left","middle","right"][
            Math.floor(Math.random() * 3)
        ];

    $$(".penalty-choice").forEach(button => {

        button.addEventListener("click", () => {

            const choice = button.dataset.side;

            if (choice === goalkeeper) {

                $("#penaltyResult").textContent =
                    "🧤 KALECİ ÇIKARDI!";

                finishGame("Penaltı", false);

            } else {

                $("#penaltyResult").textContent =
                    "⚽ GOOOOOL!";

                finishGame(
                    "Penaltı",
                    true,
                    20
                );
            }

            $$(".penalty-choice").forEach(b => {
                b.disabled = true;
            });
        });
    });
}


/* =========================================================
   CITY / KINGDOM / SPACE / GARAGE / FOOTBALL
   ========================================================= */

$("#buildCityBtn").addEventListener("click", () => {

    data.cityLevel++;

    saveData();

    addXP(20, "Şehrin geliştirildi!");

    showToast(
        `🏙️ KUT City Seviye ${data.cityLevel}`
    );
});


$("#kingdomAction").addEventListener("click", () => {

    data.kingdomPower += 5;

    saveData();

    addXP(15, "Krallık güçlendirildi!");

    showToast(
        `👑 Kuzeyyaka gücü: ${data.kingdomPower}`
    );
});


$("#spaceExplore").addEventListener("click", () => {

    const planets = [
        "Asterion",
        "Kuzey-7",
        "Lunaris",
        "Vega Prime",
        "KUT-Delta"
    ];

    const planet =
        planets[Math.floor(Math.random() * planets.length)];

    addXP(20, `${planet} keşfedildi!`);

    showToast(`🚀 Yeni gezegen: ${planet}`);
});


$("#detectiveStart").addEventListener("click", () => {

    const clues = [
        "Kutunun son görüldüğü yer: Eski Garaj.",
        "Birisi gece yarısı şehir merkezindeydi.",
        "Kutunun üzerinde K-17 yazıyor.",
        "Ayak izleri kuzey kapısına gidiyor."
    ];

    const clue =
        clues[Math.floor(Math.random() * clues.length)];

    addXP(15, "Yeni ipucu bulundu!");

    showToast(`🔎 ${clue}`);
});


$("#upgradeCar").addEventListener("click", () => {

    data.carPower += 10;

    saveData();

    addXP(20, "Araban geliştirildi!");

    showToast(
        `🚗 Motor gücü: ${data.carPower} HP`
    );
});


$("#footballMatch").addEventListener("click", () => {

    const win =
        Math.random() > .45;

    if (win) {

        data.footballWins++;

        saveData();

        addXP(25, "Maç kazanıldı!");

        showToast(
            `⚽ KUT Spor kazandı! Toplam galibiyet: ${data.footballWins}`
        );

    } else {

        addXP(8, "Maç oynandı.");

        showToast(
            "⚽ Maç berabere bitti."
        );
    }
});


/* =========================================================
   INTERNET
   ========================================================= */

$("#newsBtn").addEventListener("click", () => {

    showToast(
        "📰 KUT Haber: Kuzeyyaka'da yeni bir bina açıldı."
    );

    addXP(5, "KUT Haber okundu.");
});


$("#forumBtn").addEventListener("click", () => {

    showToast(
        "💬 Forum: 17 yeni konu bulundu."
    );

    addXP(5, "KUT Forum ziyaret edildi.");
});


$("#shopBtn").addEventListener("click", () => {

    showToast(
        "🛒 KUT Shop: Mağazada 8 ürün var."
    );

    addXP(5, "KUT Shop ziyaret edildi.");
});


$("#bankBtn").addEventListener("click", () => {

    showToast(
        "🏦 KUT Bank: Bakiye 5.000 KUT."
    );

    addXP(5, "KUT Bank ziyaret edildi.");
});


/* =========================================================
   TERMINAL
   ========================================================= */

const terminalInput =
    $("#terminalInput");

const terminalOutput =
    $("#terminalOutput");


function terminalWrite(text) {

    const line =
        document.createElement("div");

    line.innerHTML = text;

    terminalOutput.appendChild(line);

    terminalOutput.scrollTop =
        terminalOutput.scrollHeight;
}


terminalInput.addEventListener("keydown", e => {

    if (e.key !== "Enter") return;

    const command =
        terminalInput.value.trim().toLowerCase();

    terminalInput.value = "";

    terminalWrite(
        `<span style="color:#fff">
            kut@system:~$ ${escapeHTML(command)}
        </span>`
    );

    if (!command) return;


    switch (command) {

        case "help":

            terminalWrite(
                "Komutlar: help, clear, profile, xp, games, level, kut, whoami"
            );

            break;


        case "clear":

            terminalOutput.innerHTML = "";

            break;


        case "profile":

            terminalWrite(
                `Oyuncu: Kürşat<br>Seviye: ${data.level}`
            );

            break;


        case "xp":

            terminalWrite(
                `Toplam XP: ${calculateTotalXP()}`
            );

            break;


        case "games":

            terminalWrite(
                `Oynanan oyun: ${data.gamesPlayed}`
            );

            break;


        case "level":

            terminalWrite(
                `Seviye ${data.level}`
            );

            break;


        case "whoami":

            terminalWrite(
                "Kürşat — KUT Games oyuncusu."
            );

            break;


        case "kut":

            terminalWrite(
                "KUT Games sistemi aktif."
            );

            addXP(5, "Gizli terminal komutu!");

            break;


        default:

            terminalWrite(
                `Komut bulunamadı: ${escapeHTML(command)}`
            );
    }
});


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

$("#notificationBtn").addEventListener("click", () => {

    $("#notificationPanel")
        .classList.toggle("show");
});


$("#closeNotifications").addEventListener("click", () => {

    $("#notificationPanel")
        .classList.remove("show");
});


/* =========================================================
   MOBILE MENU
   ========================================================= */

$("#mobileMenu").addEventListener("click", () => {

    $(".sidebar").classList.toggle("open");
});


/* =========================================================
   SEARCH
   ========================================================= */

const searchInput =
    $("#globalSearch");

const searchable = [
    ["Oyun Merkezi","games"],
    ["Şehrim","city"],
    ["Kuzeyyaka Krallığı","kingdom"],
    ["Uzay","space"],
    ["Dedektif","detective"],
    ["Garaj","garage"],
    ["Futbol","football"],
    ["Sanal İnternet","internet"],
    ["Terminal","terminal"],
    ["Başarımlar","achievements"]
];


searchInput.addEventListener("keydown", e => {

    if (e.key !== "Enter") return;

    const value =
        searchInput.value.toLowerCase().trim();

    if (!value) return;

    const result =
        searchable.find(item =>
            item[0].toLowerCase().includes(value)
        );

    if (result) {

        navigateTo(result[1]);

        showToast(
            `🔎 ${result[0]} açıldı.`
        );

    } else {

        showToast(
            "🔎 Sonuç bulunamadı."
        );
    }
});


document.addEventListener("keydown", e => {

    if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k"
    ) {

        e.preventDefault();

        searchInput.focus();
    }

    if (e.key === "Escape") {
        closeGame();

        $("#notificationPanel")
            .classList.remove("show");
    }
});


/* =========================================================
   THEME
   ========================================================= */

$("#themeBtn").addEventListener("click", () => {

    document.body.classList.toggle("light");

    data.settings.theme =
        document.body.classList.contains("light")
            ? "light"
            : "dark";

    saveData();

    showToast(
        data.settings.theme === "light"
            ? "☀️ Açık tema"
            : "🌙 Koyu tema"
    );
});


/* =========================================================
   SETTINGS / HELP
   ========================================================= */

$("#settingsBtn").addEventListener("click", () => {

    showToast(
        "⚙️ Ayarlar: Tema ve oyun sistemi aktif."
    );
});


$("#helpBtn").addEventListener("click", () => {

    showToast(
        "❔ Bir oyun seç, oyna ve XP kazan!"
    );
});


/* =========================================================
   SAVE + START
   ========================================================= */

updateUI();

if (!localStorage.getItem("kut_games_welcome")) {

    setTimeout(() => {

        showToast(
            "👋 KUT Games'e hoş geldin, Kürşat!"
        );

    }, 700);

    localStorage.setItem(
        "kut_games_welcome",
        "true"
    );
}
```
