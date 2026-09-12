```javascript
/* =========================================================
   PROJECT NEXUS
   Main Application Logic
========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "project_nexus_data";

const defaultData = {
    xp: 0,
    level: 1,

    gamesPlayed: 0,
    wins: 0,
    achievements: 0,

    dailyStreak: 1,
    dailyGames: [],

    activities: [],

    settings: {
        sound: true,
        theme: "dark"
    }
};

let data = loadData();


function loadData() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(defaultData);
        }

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(defaultData),
            ...parsed,

            settings: {
                ...defaultData.settings,
                ...(parsed.settings || {})
            }
        };

    } catch (error) {

        console.warn("Nexus verileri okunamadı:", error);

        return structuredClone(defaultData);
    }
}


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
    title = "Nexus",
    message = "İşlem tamamlandı.",
    icon = "✓"
) {

    const toast = $("#toast");

    if (!toast) return;

    $("#toastTitle").textContent = title;
    $("#toastMessage").textContent = message;
    $("#toastIcon").textContent = icon;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}


/* =========================================================
   XP SYSTEM
========================================================= */

function xpNeededForLevel(level) {

    return 100 + ((level - 1) * 50);
}


function addXP(amount, reason = "XP kazanıldı") {

    if (!Number.isFinite(amount) || amount <= 0) {
        return;
    }

    data.xp += amount;

    let leveledUp = false;

    while (
        data.xp >= xpNeededForLevel(data.level)
    ) {

        data.xp -= xpNeededForLevel(data.level);

        data.level++;

        leveledUp = true;
    }

    saveData();

    updateUI();

    if (leveledUp) {

        showToast(
            "Seviye Atladın! 🎉",
            `Artık Seviye ${data.level} oldun!`,
            "⬆️"
        );

    } else {

        showToast(
            "XP Kazandın!",
            `+${amount} XP — ${reason}`,
            "⭐"
        );
    }
}


/* =========================================================
   UI UPDATE
========================================================= */

function updateUI() {

    const level = data.level;

    const currentLevelXP = data.xp;

    const nextLevelXP =
        xpNeededForLevel(level);

    const percentage =
        Math.min(
            100,
            (currentLevelXP / nextLevelXP) * 100
        );


    /* Level */

    setText("#sidebarLevel", level);
    setText("#topLevel", level);
    setText("#profileLevel", level);


    /* Stats */

    setText("#gamesPlayed", data.gamesPlayed);
    setText("#totalXP", calculateTotalXP());
    setText("#achievementCount", data.achievements);
    setText("#dailyStreak", data.dailyStreak);


    /* Profile */

    setText("#currentXP", data.xp);
    setText("#nextXP", nextLevelXP);

    setText("#profileGames", data.gamesPlayed);
    setText("#profileWins", data.wins);
    setText(
        "#profileAchievements",
        data.achievements
    );


    /* XP */

    const progress = $("#xpProgress");

    if (progress) {
        progress.style.width =
            `${percentage}%`;
    }


    updateQuest();

    updateActivities();
}


function calculateTotalXP() {

    let total = 0;

    for (let level = 1; level < data.level; level++) {
        total += xpNeededForLevel(level);
    }

    total += data.xp;

    return total;
}


function setText(selector, value) {

    const element = $(selector);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

const pageNames = {

    home: "Ana Sayfa",

    games: "Oyun Merkezi",

    city: "Şehrim",

    kingdom: "Krallık",

    space: "Uzay",

    detective: "Dedektif",

    garage: "Garaj",

    football: "Futbol",

    internet: "Sanal İnternet",

    terminal: "Terminal",

    achievements: "Başarımlar"
};


function navigateTo(page) {

    if (!pageNames[page]) {
        return;
    }


    /* Update active menu */

    $$(".nav-item").forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === page
        );

    });


    /*
        Bu ilk sürümde diğer sayfalar henüz
        yapılmadığı için geçici olarak bilgi veriyoruz.
        Sayfaları ekledikçe burada gerçek ekranlar açılacak.
    */

    if (page === "home") {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        return;
    }


    showToast(
        pageNames[page],
        "Bu Nexus bölümü hazırlanıyor. 🚀",
        getPageIcon(page)
    );


    closeMobileSidebar();
}


function getPageIcon(page) {

    const icons = {

        games: "🎮",
        city: "🏙️",
        kingdom: "👑",
        space: "🚀",
        detective: "🕵️",
        garage: "🚗",
        football: "⚽",
        internet: "🌐",
        terminal: "⌨️",
        achievements: "🏆"
    };

    return icons[page] || "🌐";
}


/* =========================================================
   NAVIGATION EVENTS
========================================================= */

function setupNavigation() {

    $$("[data-page]").forEach(element => {

        element.addEventListener(
            "click",
            () => {

                const page =
                    element.dataset.page;

                if (page) {
                    navigateTo(page);
                }

            }
        );

    });


    $$(".nav-item").forEach(item => {

        item.addEventListener(
            "click",
            () => {

                closeMobileSidebar();

            }
        );

    });
}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function setupMobileMenu() {

    const menu = $("#mobileMenu");
    const sidebar = $(".sidebar");
    const overlay = $("#sidebarOverlay");

    if (!menu || !sidebar || !overlay) {
        return;
    }


    menu.addEventListener("click", () => {

        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");

    });


    overlay.addEventListener(
        "click",
        closeMobileSidebar
    );
}


function closeMobileSidebar() {

    $(".sidebar")?.classList.remove("open");
    $("#sidebarOverlay")?.classList.remove("show");
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function setupNotifications() {

    const button =
        $("#notificationButton");

    const panel =
        $("#notificationPanel");

    const close =
        $("#closeNotifications");

    if (!button || !panel) {
        return;
    }


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            panel.classList.toggle("show");

        }
    );


    close?.addEventListener(
        "click",
        () => {

            panel.classList.remove("show");

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !panel.contains(event.target) &&
                !button.contains(event.target)
            ) {

                panel.classList.remove("show");

            }

        }
    );
}


/* =========================================================
   SEARCH
========================================================= */

const searchItems = [

    {
        name: "Oyun Merkezi",
        description: "30+ mini oyun",
        icon: "🎮",
        page: "games"
    },

    {
        name: "Şehrim",
        description: "Kendi şehrini kur",
        icon: "🏙️",
        page: "city"
    },

    {
        name: "Kuzeyyaka Krallığı",
        description: "Krallığını yönet",
        icon: "👑",
        page: "kingdom"
    },

    {
        name: "Uzay",
        description: "Galaksiyi keşfet",
        icon: "🚀",
        page: "space"
    },

    {
        name: "Dedektif Bürosu",
        description: "Gizemleri çöz",
        icon: "🕵️",
        page: "detective"
    },

    {
        name: "Garaj",
        description: "Arabalarını yönet",
        icon: "🚗",
        page: "garage"
    },

    {
        name: "Futbol",
        description: "Takımını yönet",
        icon: "⚽",
        page: "football"
    },

    {
        name: "Sanal İnternet",
        description: "Nexus internetini keşfet",
        icon: "🌐",
        page: "internet"
    },

    {
        name: "Terminal",
        description: "Gizli sistemlere eriş",
        icon: "⌨️",
        page: "terminal"
    },

    {
        name: "Başarımlar",
        description: "Rozetlerini görüntüle",
        icon: "🏆",
        page: "achievements"
    }
];


function setupSearch() {

    const input =
        $("#globalSearch");

    const results =
        $("#searchResults");

    if (!input || !results) {
        return;
    }


    function renderSearch(query) {

        const clean =
            query.trim().toLowerCase();


        if (!clean) {

            results.innerHTML = "";

            results.classList.remove("show");

            return;
        }


        const matches =
            searchItems.filter(item =>

                item.name
                    .toLowerCase()
                    .includes(clean)

                ||

                item.description
                    .toLowerCase()
                    .includes(clean)

            );


        if (matches.length === 0) {

            results.innerHTML = `
                <div class="search-result">
                    <div class="search-result-icon">
                        🔎
                    </div>

                    <div class="search-result-info">
                        <strong>Sonuç bulunamadı</strong>
                        <span>Başka bir şey dene.</span>
                    </div>
                </div>
            `;

        } else {

            results.innerHTML =
                matches.map(item => `

                    <button
                        class="search-result"
                        data-search-page="${item.page}"
                    >

                        <div class="search-result-icon">
                            ${item.icon}
                        </div>

                        <div class="search-result-info">
                            <strong>${item.name}</strong>
                            <span>${item.description}</span>
                        </div>

                    </button>

                `).join("");

        }


        results.classList.add("show");


        results
            .querySelectorAll("[data-search-page]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        navigateTo(
                            button.dataset.searchPage
                        );

                        input.value = "";

                        results.classList.remove(
                            "show"
                        );

                    }
                );

            });
    }


    input.addEventListener(
        "input",
        () => {

            renderSearch(input.value);

        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                input.value = "";

                results.classList.remove(
                    "show"
                );

                input.blur();
            }

            if (
                event.key === "Enter" &&
                input.value.trim()
            ) {

                const first =
                    searchItems.find(item =>

                        item.name
                            .toLowerCase()
                            .includes(
                                input.value
                                    .trim()
                                    .toLowerCase()
                            )
                    );

                if (first) {

                    navigateTo(first.page);

                    input.value = "";

                    results.classList.remove(
                        "show"
                    );
                }
            }

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !results.contains(event.target) &&
                !input.contains(event.target)
            ) {

                results.classList.remove(
                    "show"
                );

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                input.focus();

                input.select();

            }

        }
    );
}


/* =========================================================
   ACTIVITY SYSTEM
========================================================= */

function addActivity(
    icon,
    title,
    description
) {

    data.activities.unshift({

        icon,
        title,
        description,

        time:
            new Date().toLocaleTimeString(
                "tr-TR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
    });


    /* Keep only last 8 activities */

    data.activities =
        data.activities.slice(0, 8);


    saveData();

    updateActivities();
}


function updateActivities() {

    const list =
        $("#activityList");

    if (!list) {
        return;
    }


    if (!data.activities.length) {

        list.innerHTML = `
            <div class="empty-activity">

                <div>🛰️</div>

                <p>Henüz aktivite yok.</p>

                <span>
                    Bir oyun oynadığında burada görünecek.
                </span>

            </div>
        `;

        return;
    }


    list.innerHTML =
        data.activities.map(activity => `

            <div class="activity-item">

                <div class="activity-icon">
                    ${activity.icon}
                </div>

                <div class="activity-info">

                    <strong>
                        ${escapeHTML(activity.title)}
                    </strong>

                    <span>
                        ${escapeHTML(activity.description)}
                        · ${activity.time}
                    </span>

                </div>

            </div>

        `).join("");
}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   DAILY QUEST
========================================================= */

function updateQuest() {

    const uniqueGames =
        new Set(data.dailyGames);

    const count =
        Math.min(uniqueGames.size, 3);

    const percentage =
        (count / 3) * 100;


    const progress =
        $("#questProgress");

    const text =
        $("#questText");


    if (progress) {
        progress.style.width =
            `${percentage}%`;
    }


    if (text) {

        text.textContent =
            `${count} / 3`;

    }


    if (count >= 3) {

        const button =
            $(".quest-button");

        if (button) {

            button.textContent =
                "Tamamlandı ✓";

            button.disabled = true;

            button.style.opacity = ".6";

        }

    }
}


/* =========================================================
   GAME TRACKING
========================================================= */

function recordGamePlayed(gameName) {

    data.gamesPlayed++;

    data.dailyGames.push(gameName);

    data.dailyGames =
        [...new Set(data.dailyGames)];


    addActivity(
        "🎮",
        `${gameName} oynandı`,
        "Oyun Merkezi"
    );


    saveData();

    updateUI();


    if (
        data.dailyGames.length === 3
    ) {

        showToast(
            "Günlük görev tamamlandı!",
            "+50 XP kazandın.",
            "🎯"
        );

        addXP(
            50,
            "Günlük görev"
        );

    }
}


/* =========================================================
   DEMO GAME BUTTONS
========================================================= */

function setupGameButtons() {

    $$("[data-game]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const game =
                    button.dataset.game;

                const gameNames = {

                    reflex:
                        "Refleks Arenası",

                    asteroid:
                        "Asteroid Rush",

                    memory:
                        "Memory Grid",

                    racer:
                        "Nexus Racer"
                };


                const name =
                    gameNames[game] ||
                    "Nexus Oyunu";


                recordGamePlayed(name);

                addXP(
                    10,
                    `${name} oynandı`
                );

                showToast(
                    name,
                    "Oyun başlatma sistemi hazırlanıyor.",
                    "🎮"
                );

            }
        );

    });
}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    const button =
        $("#settingsButton");

    button?.addEventListener(
        "click",
        () => {

            showToast(
                "Ayarlar",
                "Ayarlar paneli yakında geliyor.",
                "⚙️"
            );

        }
    );
}


/* =========================================================
   HELP
========================================================= */

function setupHelp() {

    const button =
        $("#helpButton");

    button?.addEventListener(
        "click",
        () => {

            showToast(
                "Nexus Yardım",
                "İpucu: Ctrl + K ile aramayı açabilirsin.",
                "❔"
            );

        }
    );
}


/* =========================================================
   TOPBAR THEME BUTTON
========================================================= */

function setupThemeButton() {

    const buttons =
        $$(".topbar-button");

    /*
        İkinci topbar butonu tema butonudur.
    */

    const themeButton =
        buttons[1];

    if (!themeButton) {
        return;
    }


    themeButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light-mode"
            );


            const light =
                document.body.classList.contains(
                    "light-mode"
                );


            themeButton.textContent =
                light ? "☀️" : "🌙";


            showToast(
                "Tema",
                light
                    ? "Aydınlık mod açıldı."
                    : "Karanlık mod açıldı.",
                light ? "☀️" : "🌙"
            );

        }
    );
}


/* =========================================================
   WELCOME
========================================================= */

function showWelcomeMessage() {

    const welcomed =
        localStorage.getItem(
            "nexus_welcomed"
        );


    if (!welcomed) {

        setTimeout(() => {

            showToast(
                "Project Nexus'a hoş geldin!",
                "Dijital evren seni bekliyor. 🚀",
                "🌐"
            );

        }, 900);


        localStorage.setItem(
            "nexus_welcomed",
            "true"
        );
    }
}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            /* Ctrl + K */

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "k"
            ) {

                return;
            }


            /* Escape */

            if (event.key === "Escape") {

                closeMobileSidebar();

                $("#notificationPanel")
                    ?.classList.remove("show");

                $("#searchResults")
                    ?.classList.remove("show");

            }

        }
    );
}


/* =========================================================
   DEMO DATA
========================================================= */

function createFirstTimeData() {

    /*
        İlk kullanımda hiçbir şey doldurmuyoruz.
        Kullanıcının yaptığı hareketler oluşacak.
    */

    if (
        typeof data.xp !== "number"
    ) {
        data.xp = 0;
    }

    saveData();
}


/* =========================================================
   INIT
========================================================= */

function init() {

    createFirstTimeData();

    setupNavigation();

    setupMobileMenu();

    setupNotifications();

    setupSearch();

    setupGameButtons();

    setupSettings();

    setupHelp();

    setupThemeButton();

    setupKeyboard();

    updateUI();

    showWelcomeMessage();

    console.log(
        "%c🌐 PROJECT NEXUS ONLINE",
        "font-size:18px;font-weight:bold;"
    );

    console.log(
        "%cSistem hazır. Gizli şeyleri aramayı unutma. 👀",
        "font-size:12px;"
    );
}


/* =========================================================
   START
========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}


/* =========================================================
   GLOBAL API
   Diğer oyunlar ve sistemler buradan
   Nexus'a bağlanabilecek.
========================================================= */

window.Nexus = {

    getData() {
        return data;
    },

    save() {
        saveData();
    },

    addXP,

    addActivity,

    recordGamePlayed,

    showToast,

    navigateTo
};
```
