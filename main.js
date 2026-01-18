/* =========================================
   0. كود الحماية (مخصص لـ Teslam Store)
   ========================================= */
(function(){
    var myDomain = "teslam.vercel.app"; 
    var host = window.location.hostname;
    
    if (host !== myDomain && host !== "localhost" && host !== "127.0.0.1") {
        document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px; color:red;'>🚫 Access Denied<br>هذا الكود محمي ومخصص لمتجر تسلم فقط.</h1>";
        throw new Error("Access Denied: Production Only");
    }
})();

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js";

/* =========================================
   1. تهيئة وإعدادات FIREBASE
   ========================================= */
const firebaseConfig = {
    apiKey: "AIzaSyDiLmqbSVzdW5_DDMrKXttEDeu941vVWqc",
    authDomain: "teslamstore-df0a5.firebaseapp.com",
    projectId: "teslamstore-df0a5",
    storageBucket: "teslamstore-df0a5.firebasestorage.app",
    messagingSenderId: "1054567379055",
    appId: "1:1054567379055:web:a97efaa28108945733dd9a",
    measurementId: "G-MFY4BKBLDS"
};

try {
    const appFire = initializeApp(firebaseConfig);
    const messaging = getMessaging(appFire);

    function requestPermission() {
        if (Notification.permission === 'granted') return;
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                getToken(messaging, { vapidKey: 'BIeZIiTnG3t43CGbFeAEClCJB3SBdHp3lYCvJ7NS4cuNnme3cikcPzmSnBRrc_hg9ZSGKDOzGwPI6PWAe0NZtz0' })
                    .then((currentToken) => {
                        if (currentToken) console.log('Token:', currentToken);
                    }).catch((err) => console.log('Error Token: ', err));
            }
        });
    }

    onMessage(messaging, (payload) => {
        const title = payload.notification.title;
        const options = {
            body: payload.notification.body,
            icon: '/icon-192.png'
        };
        new Notification(title, options);
    });

    requestPermission();
} catch (e) {
    console.log("Firebase initialized previously or error:", e);
}

/* =========================================
   2. مراقب حالة الإنترنت (جديد - المطور أدهم)
   ========================================= */
function initNetworkChecker() {
    const toast = document.getElementById('offline-toast');
    if (!toast) return;

    function updateNetworkStatus() {
        if (navigator.onLine) {
            // لو النت رجع
            toast.classList.remove('active');
            // ممكن تظهر رسالة صغيرة "عاد الاتصال" لو حبيت، بس الإخفاء كافي
        } else {
            // لو النت قطع
            toast.classList.add('active');
            // تشغيل صوت تنبيه خفيف لو حبيت
            try { new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_279930922e.mp3').play().catch(()=>{}); } catch(e){}
        }
    }

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // التحقق عند فتح الموقع لأول مرة
    updateNetworkStatus();
}

// تشغيل المراقب عند تحميل الصفحة
window.addEventListener('load', initNetworkChecker);


/* =========================================
   3. تسجيل SERVICE WORKER
   ========================================= */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('تم تشغيل التطبيق بنجاح! 📱', reg.scope))
            .catch(err => console.log('فشل تشغيل التطبيق ❌', err));
    });
}

/* =========================================
   4. كلاس تطبيق TESLAM (الأساسي)
   ========================================= */
class TeslamApp {
    constructor() {
        this.dbURL = "/api/data";
        this.data = [];
        if (document.getElementById('apps-grid')) {
            this.init();
        }
    }

    init() {
        this.loadTheme();
        this.fetchData();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.smartSearch(e.target.value));
        }
    }

    toggleTheme() {
        const body = document.body;
        const icon = document.getElementById('theme-icon');
        const current = body.getAttribute('data-theme');
        if (current === 'dark') {
            body.setAttribute('data-theme', 'light');
            if (icon) icon.className = 'fas fa-moon';
            localStorage.setItem('teslam_theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            if (icon) icon.className = 'fas fa-sun';
            localStorage.setItem('teslam_theme', 'dark');
        }
    }

    loadTheme() {
        const saved = localStorage.getItem('teslam_theme') || 'light';
        document.body.setAttribute('data-theme', saved);
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    toggleMenu() {
        const drawer = document.getElementById('sideDrawer');
        const overlay = document.querySelector('.overlay');
        if (drawer && overlay) {
            drawer.classList.toggle('open');
            overlay.classList.toggle('active');
        }
    }

    shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    async fetchData() {
        try {
            const response = await fetch(this.dbURL);
            if (!response.ok) throw new Error("مشكلة في التصريح");
            const json = await response.json();
            if (json) {
                this.data = Object.values(json).filter(item => item != null).reverse();
                // مشاركة البيانات مع البوت
                if(!window.app) window.app = {};
                window.app.data = this.data;
            } else {
                this.data = [];
            }
            this.renderApp();
            this.injectHomeSchema();
        } catch (error) {
            const grid = document.getElementById('apps-grid');
            if (grid) grid.innerHTML = '<p style="grid-column:1/-1;text-align:center; padding:20px;">جاري الاتصال بالسيرفر...</p>';
        }
    }

    // دوال البحث والتصفية
    normalize(text) {
        if(!text) return "";
        return text.toLowerCase()
            .replace(/\s+/g, '')       
            .replace(/(أ|إ|آ)/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/(ي|ى)/g, 'ي')
            .replace(/[^a-z0-9\u0600-\u06FF]/g, '');
    }

    levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[b.length][a.length];
    }

    getSimilarity(s1, s2) {
        let longer = s1.length > s2.length ? s1 : s2;
        let shorter = s1.length > s2.length ? s2 : s1;
        if (longer.length == 0) return 1.0;
        return (longer.length - this.levenshtein(longer, shorter)) / longer.length;
    }

    smartSearch(q) {
        const grid = document.getElementById('apps-grid');
        const hero = document.getElementById('hero-section');
        const rec = document.getElementById('recommended-section');
        const smartFeed = document.getElementById('smart-feed-section');
        const tags = document.getElementById('tags-bar');

        if(hero) hero.style.display = q ? 'none' : 'block';
        if(rec) rec.style.display = q ? 'none' : 'block';
        if(smartFeed) smartFeed.style.display = q ? 'none' : 'block';
        if(tags) tags.style.display = q ? 'none' : 'flex';

        if (!q.trim()) {
            this.renderGrid(this.data);
            return;
        }

        const query = this.normalize(q);
        const results = this.data.map(appItem => {
            const title = this.normalize(appItem.Title || "");
            const keywords = this.normalize(appItem.Keywords || "");
            
            let score = 0;
            if (title.includes(query)) score += 100;
            if (keywords.includes(query)) score += 80;
            const simScore = this.getSimilarity(query, title);
            if (simScore > 0.4) score += (simScore * 100);

            return { app: appItem, score: score };
        })
        .filter(item => item.score > 40)
        .sort((a, b) => b.score - a.score)
        .map(item => item.app);

        if (results.length > 0) {
            this.renderGrid(results);
        } else {
            if(grid) grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-sub);">
                    <i class="fas fa-robot fa-3x" style="margin-bottom:15px; color:var(--primary);"></i>
                    <h3>لم أجده، لكن لا تقلق!</h3>
                    <p>جرب البحث بكلمة أخرى أو تواصل مع أدهم لإضافته.</p>
                </div>
            `;
        }
    }

    trackClick(tag) {
        if(!tag) return;
        let prefs = JSON.parse(localStorage.getItem('teslam_prefs') || '{}');
        prefs[tag] = (prefs[tag] || 0) + 1;
        localStorage.setItem('teslam_prefs', JSON.stringify(prefs));
    }

    renderSmartFeed() {
        const smartSection = document.getElementById('smart-feed-section');
        const smartGrid = document.getElementById('smart-feed-grid');
        if (!smartSection || !smartGrid) return;

        const prefs = JSON.parse(localStorage.getItem('teslam_prefs') || '{}');
        const userTags = Object.keys(prefs).sort((a,b) => prefs[b] - prefs[a]);

        if (userTags.length === 0) {
            smartSection.style.display = 'none';
            return;
        }
        let recommendedApps = this.data.filter(app => userTags.includes(app.Tag));
        recommendedApps = this.shuffleArray(recommendedApps).slice(0, 4);

        if (recommendedApps.length > 0) {
            smartSection.style.display = 'block';
            smartGrid.innerHTML = '';
            recommendedApps.forEach((app, idx) => {
                const card = document.createElement('div');
                card.className = 'app-card';
                card.onclick = () => this.goToPost(app.ID, idx, app.Tag);
                card.innerHTML = `
                    <div class="card-img-wrapper"><img src="${app.Image || 'https://placehold.co/150'}" class="card-img" loading="lazy"></div>
                    <div class="card-title">${app.Title || 'بدون عنوان'}</div>
                    <div class="dl-btn" style="background:#9b59b6;"><i class="fas fa-heart"></i> مخصص لك</div>
                `;
                smartGrid.appendChild(card);
            });
        } else {
            smartSection.style.display = 'none';
        }
    }

    injectHomeSchema() {
        if (!this.data || this.data.length === 0) return;
        const topApps = this.data.slice(0, 10).map(app => ({
            "@type": "SoftwareApplication",
            "name": app.Title || "تطبيق",
            "operatingSystem": "Android",
            "applicationCategory": app.Tag || "Application",
            "url": window.location.origin + `/post.html?uid=${app.ID || ''}`
        }));
        const schema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Teslam Store",
            "url": window.location.href,
            "description": "متجر تسلم لتحميل تطبيقات الأندرويد الأصلية والتحديثات الآمنة.",
            "potentialAction": {
                "@type": "SearchAction",
                "target": window.location.href + "?q={search_term_string}",
                "query-input": "required name=search_term_string"
            },
            "hasPart": topApps
        };
        const script = document.createElement('script');
        script.type = "application/ld+json";
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
    }

    renderApp() {
        if (!this.data || this.data.length === 0) {
            const grid = document.getElementById('apps-grid');
            if(grid) grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">لا توجد تطبيقات حالياً</p>';
            return;
        }
        this.renderHero();
        this.renderSmartFeed();
        this.renderRecommended();
        this.renderTagsAndSidebar();
        this.renderGrid(this.data);
    }

    renderRecommended() {
        const recContainer = document.getElementById('recommended-section');
        const recGrid = document.getElementById('recommended-grid');
        if (!recContainer || !recGrid) return;

        let shuffled = this.shuffleArray([...this.data]);
        let selected = shuffled.slice(0, 4);
        if (selected.length > 0) {
            recContainer.style.display = 'block';
            recGrid.innerHTML = '';
            selected.forEach((app, idx) => {
                const card = document.createElement('div');
                card.className = 'app-card';
                card.onclick = () => this.goToPost(app.ID, idx, app.Tag);
                card.innerHTML = `
                    <div class="card-img-wrapper"><img src="${app.Image || 'https://placehold.co/150'}" class="card-img" loading="lazy"></div>
                    <div class="card-title">${app.Title || 'بدون عنوان'}</div>
                    <div class="dl-btn" style="background:#a55eea;"><i class="fas fa-magic"></i> اكتشف</div>
                `;
                recGrid.appendChild(card);
            });
        }
    }

    renderHero() {
        if (this.data.length === 0) return;
        const heroSection = document.getElementById('hero-section');
        if (!heroSection) return;

        const top = this.data[0];
        heroSection.innerHTML = `
            <div class="hero-card" onclick="app.goToPost('${top.ID}', 0, '${top.Tag}')">
                <div class="hero-info">
                    <span class="hero-badge">مميز</span>
                    <div class="hero-title">${top.Title || 'بدون عنوان'}</div>
                    <div style="font-size:13px; opacity:0.8;">اضغط للتحميل المباشر...</div>
                </div>
                <img src="${top.Image || 'https://placehold.co/150'}" class="hero-img">
            </div>
        `;
    }

    renderTagsAndSidebar() {
        const bar = document.getElementById('tags-bar');
        const drawerLinks = document.getElementById('drawer-dynamic-links');
        if (!bar || !drawerLinks) return;

        const tags = new Set(this.data.map(d => d.Tag?.trim()).filter(Boolean));
        bar.innerHTML = `<div class="tag-pill active" onclick="window.app.filter('all', this)">الكل</div>`;
        drawerLinks.innerHTML = `
            <div class="drawer-item" onclick="window.app.filter('all', null); window.app.toggleMenu()">
                <i class="fas fa-home"></i> الرئيسية
            </div>
        `;
        tags.forEach(tag => {
            bar.innerHTML += `<div class="tag-pill" onclick="window.app.filter('${tag}', this)">${tag}</div>`;
            let icon = 'fas fa-hashtag';
            if (tag.includes('لعبة') || tag.includes('Games')) icon = 'fas fa-gamepad';
            if (tag.includes('تطبيق') || tag.includes('App')) icon = 'fas fa-layer-group';
            drawerLinks.innerHTML += `
                <div class="drawer-item" onclick="window.app.filter('${tag}', null); window.app.toggleMenu()">
                    <i class="${icon}"></i> ${tag}
                </div>
            `;
        });
    }

    renderGrid(list) {
        const grid = document.getElementById('apps-grid');
        if (!grid) return;

        grid.innerHTML = '';
        if (list.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">لا توجد نتائج</p>';
            return;
        }
        list.forEach((app, idx) => {
            const card = document.createElement('div');
            card.className = 'app-card';
            card.style.animationDelay = `${idx * 0.05}s`;
            card.onclick = () => this.goToPost(app.ID, idx, app.Tag);
            card.innerHTML = `
                <div class="card-img-wrapper"><img src="${app.Image || 'https://placehold.co/150'}" class="card-img" loading="lazy"></div>
                <div class="card-title">${app.Title || 'بدون عنوان'}</div>
                <div class="dl-btn"><i class="fas fa-download"></i> تحميل</div>
            `;
            grid.appendChild(card);
        });
    }

    filter(tag, el) {
        document.querySelectorAll('.tag-pill').forEach(t => t.classList.remove('active'));
        if (el) el.classList.add('active');
        
        const hero = document.getElementById('hero-section');
        const rec = document.getElementById('recommended-section');
        const smart = document.getElementById('smart-feed-section');

        if (tag === 'all') {
            if(hero) hero.style.display = 'block';
            if(rec) rec.style.display = 'block';
            if(smart) smart.style.display = 'block';
            this.renderGrid(this.data);
        } else {
            if(hero) hero.style.display = 'none';
            if(rec) rec.style.display = 'none';
            if(smart) smart.style.display = 'none';
            this.renderGrid(this.data.filter(i => i.Tag && i.Tag.trim() === tag));
        }
    }

    goToPost(uid, idx, tag) {
        if(tag) this.trackClick(tag);
        let url = 'post.html?';
        if (uid) url += `uid=${uid}`;
        else url += `id=${idx}`;
        window.location.href = url;
    }
}

/* =========================================
   5. كلاس GENIUS BOT (الذكاء الاصطناعي والصوت)
   ========================================= */
class GeniusBot {
    constructor() {
        this.isOpen = false;
        this.chatBody = document.getElementById('chatBody');
        this.chatState = 'idle'; 
        this.lastFoundApp = null; 
        
        this.recognition = null;
        this.isRecording = false;

        if(!this.chatBody) return;

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'ar-EG'; 
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onstart = () => {
                this.isRecording = true;
                const btn = document.getElementById('micBtn');
                if(btn) btn.classList.add('recording');
                document.getElementById('chatInput').placeholder = "جاري الاستماع... 🎤";
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                const btn = document.getElementById('micBtn');
                if(btn) btn.classList.remove('recording');
                document.getElementById('chatInput').placeholder = "اكتب أو تحدث...";
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const input = document.getElementById('chatInput');
                if(input) {
                    input.value = transcript;
                    this.send(); 
                }
            };
        }

        this.sendSound = new Audio("https://cdn.pixabay.com/audio/2022/03/24/audio_3322f963a7.mp3");
        this.receiveSound = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_279930922e.mp3");
        this.sendSound.volume = 0.5; this.receiveSound.volume = 0.5;

        // قاموس الشخصية
        this.persona = {
            greet: { 
                match: /^(سلام|السلام|مرحبا|اهلا|اهلين|هلا|هاي|hi|hello|hey|yo|welcome|ازيك|عامل ايه|شخبارك|صباح|مساء)/i, 
                reply: [
                    "يا هلا والله! ❤️ نورت متجر تسلم.",
                    "أهلاً بيك يا غالي! 🚀 أنا تسلم، آمرني؟",
                    "وعليكم السلام! 😉 جاهز أساعدك تلاقي أي تطبيق.",
                    "يا مية هلا! 🌹 أنا هنا عشانك."
                ] 
            },
            hru: {
                match: /^(كيفك|كيف الحال|اخبارك|عامل ايه|شخبارك|how are you|how r u|what's up)/i,
                reply: [
                    "أنا بخير طول ما أنت بخير! 🤖❤️",
                    "عال العال! جاهز للبحث عن تطبيقاتك 🚀",
                    "تمام الحمد لله، شكراً لسؤالك يا ذوق! 🌹"
                ]
            },
            thanks: { 
                match: /^(شكرا|تسلم|حبيبي|كفو|thx|thanks|thank you|يسلمو|الله يعافيك)/i,
                reply: [
                    "العفو يا بطل! 🤖 واجبي.",
                    "تحت أمرك في أي وقت! ❤️",
                    "حبيبي، ده أقل واجب! 😉"
                ] 
            },
            creator: {
                match: /^(مين|من) (عملك|صممك|طورك|برمجك|سواك|صنعك|اخترعك|انشأك|اسسك|رباك|علمك|شغلك)|(مين|من) (المطور|المصمم|المبرمج|المالك|الصانع|المدير|القائد|الريس|البوص)|(who|who's) (made|created|developed|built|programmed|designed|coded) (you)|(your|ur) (creator|developer|maker|owner|dad|father)|(ادهم|أدهم|adham)|مين (هو|يكون) (ادهم|أدهم)/i,
                reply: [
                    "أنا فخور إني من تصميم وتطوير **أدهم (Adham)** 💻، صاحب متجر تسلم. هو برمجني عشان أكون مساعدك الشخصي! 😎🔥",
                    "اللي صنعني هو العبقري **أدهم**، عشان يوفر عليك وقت التدوير على التطبيقات. 🚀",
                    "سؤال في الجون! 😉 المطور بتاعي هو **أدهم (Adham)**، وهو اللي سهر الليالي يكتب الكود ده عشانك."
                ]
            },
            identity: {
                match: /(اسمك ايه|مين انت|عرف نفسك|who are you|ur name)/i,
                reply: ["أنا **تسلم (Teslam AI)** 🤖، مساعدك الذكي للتطبيقات والألعاب!"]
            },
            love: {
                match: /(بحبك|انت جامد|انت عسل|love you|awesome|cool)/i,
                reply: ["وأنا كمان بحبك يا جميل! ❤️🤖", "أنت اللي جامد والله! 😎", "خجلتني بصراحة ☺️ تسلم يا ذوق!"]
            }
        };
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const chatWin = document.getElementById('chatWindow');
        if(chatWin) chatWin.classList.toggle('active');
        if (this.isOpen) {
            setTimeout(() => {
                const inp = document.getElementById('chatInput');
                if(inp) inp.focus();
            }, 300);
            this.sendSound.play().then(()=>this.sendSound.pause()).catch(()=>{});
        }
    }

    toggleVoice() {
        if (!this.recognition) {
            this.addMsg("عذراً، متصفحك لا يدعم البحث الصوتي 😔", 'bot');
            return;
        }
        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    playSound(type) {
        try {
            const sound = (type === 'send') ? this.sendSound : this.receiveSound;
            sound.currentTime = 0;
            sound.play().catch(e => {});
        } catch(e) {}
    }

    normalize(text) {
        return text.toLowerCase()
            .replace(/\s+/g, '')       
            .replace(/(أ|إ|آ)/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/(ي|ى)/g, 'ي')
            .replace(/[^a-z0-9\u0600-\u06FF]/g, '');
    }

    levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[b.length][a.length];
    }

    getSimilarity(s1, s2) {
        let longer = s1.length > s2.length ? s1 : s2;
        let shorter = s1.length > s2.length ? s2 : s1;
        if (longer.length == 0) return 1.0;
        return (longer.length - this.levenshtein(longer, shorter)) / longer.length;
    }

    send() {
        const input = document.getElementById('chatInput');
        if(!input) return;
        
        const text = input.value.trim();
        if (!text) return;

        this.playSound('send');
        this.addMsg(text, 'user');
        input.value = '';
        this.showTyping();

        const thinkingTime = Math.min(Math.max(text.length * 50, 600), 1500);
        setTimeout(() => {
            this.removeTyping();
            this.processBrain(text);
        }, thinkingTime);
    }

    processBrain(rawText) {
        if (this.chatState !== 'idle') {
           const simple = rawText.toLowerCase();
           if (!simple.match(/^(نعم|لا|yes|no|ايوة|لاء|ok)/)) {
               this.chatState = 'idle'; 
           }
        }

        const simpleText = rawText.toLowerCase();

        for (let key in this.persona) {
            if (this.persona[key].match.test(rawText)) { 
                const replies = this.persona[key].reply;
                const randomReply = replies[Math.floor(Math.random() * replies.length)];
                this.addMsg(randomReply, 'bot');
                return;
            }
        }

        const query = this.normalize(rawText);
        if (query.length < 2) {
            this.addMsg("اكتب اسم التطبيق (مثلاً: <b>ببجي</b>، <b>واتساب</b>)...", 'bot');
            return;
        }

        this.searchDatabase(query);
    }

    searchDatabase(query) {
        // التحقق من وجود بيانات (الآن تعمل في الصفحتين بفضل window.app.data)
        if (!window.app || !window.app.data || !window.app.data.length) {
            this.addMsg("ثواني بجمع البيانات... ⏳", 'bot');
            return;
        }

        const matches = window.app.data.map(appItem => {
            const title = this.normalize(appItem.Title);
            const tag = this.normalize(appItem.Tag || "");
            const keywords = this.normalize(appItem.Keywords || "");
            
            let score = 0;
            // تطابق العنوان
            if (title.includes(query) || query.includes(title)) score += 100;
            // تطابق الكلمات المفتاحية Keywords
            if (keywords.includes(query)) score += 95;
            // تطابق الوسم
            if (tag.includes(query)) score += 80;

            const simScore = this.getSimilarity(query, title);
            const simScoreKey = this.getSimilarity(query, keywords);

            if (simScore > 0.35) score += (simScore * 100);
            if (simScoreKey > 0.4) score += (simScoreKey * 90);

            return { app: appItem, score: score };
        })
        .filter(m => m.score > 35)
        .sort((a, b) => b.score - a.score);

        if (matches.length > 0) {
            const best = matches[0].app;
            this.lastFoundApp = best; 
            this.chatState = 'asking_features'; 

            this.addMsg(`لقيت طلبك! 🤩 غالباً بتدور على <b>${best.Title}</b>:`, 'bot');
            
            let cardHTML = `
            <div class="bot-result-card" onclick="window.location.href='post.html?uid=${best.ID}'">
                <img src="${best.Image}" class="bot-res-img">
                <div class="bot-res-info">
                    <div class="bot-res-title">${best.Title}</div>
                    <div class="bot-res-btn">تحميل مباشر 🚀</div>
                </div>
            </div>`;
            
            const div = document.createElement('div');
            div.className = 'msg-row bot';
            div.style.display = 'block';
            div.innerHTML = `<div style="width:100%; padding-right:10px;">${cardHTML}</div>`;
            this.chatBody.appendChild(div);

            setTimeout(() => {
                this.addMsg(`تحب أعرض لك مميزات التطبيق ده من الوصف؟ 🤔`, 'bot');
                this.addOptions([
                    { text: "أيوة يا ريت 📄", val: "yes_features" },
                    { text: "لأ، شكراً 👋", val: "no_features" }
                ]);
                this.playSound('receive');
            }, 800);

        } else {
            this.chatState = 'idle';
            this.addMsg(`للأسف مش لاقي "<b>${query}</b>" 😔.<br>بس ممكن يعجبك ده 👇`, 'bot');
            const randomApp = window.app.data[Math.floor(Math.random() * window.app.data.length)];
            setTimeout(() => {
                const card = `
                <div class="bot-result-card" onclick="window.location.href='post.html?uid=${randomApp.ID}'">
                    <img src="${randomApp.Image}" class="bot-res-img">
                    <div class="bot-res-info">
                        <div class="bot-res-title">جرب: ${randomApp.Title}</div>
                        <div class="bot-res-btn">تطبيق مميز 🔥</div>
                    </div>
                </div>`;
                const div = document.createElement('div');
                div.className = 'msg-row bot';
                div.style.display = 'block';
                div.innerHTML = `<div style="width:100%; padding-right:10px;">${card}</div>`;
                this.chatBody.appendChild(div);
            }, 1000);
        }
    }

    addOptions(opts) {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'msg-row bot';
        optionsDiv.style.display = 'block';
        let htmlBtns = '';
        opts.forEach(o => {
            htmlBtns += `<button class="option-btn" onclick="window.geniusBot.handleOption('${o.val}', '${o.text}')">${o.text}</button>`;
        });
        optionsDiv.innerHTML = `
            <div style="width:100%; padding-right:10px; margin-top:5px;">
                <div class="bot-options">${htmlBtns}</div>
            </div>`;
        this.chatBody.appendChild(optionsDiv);
        this.scrollToBottom();
    }

    handleOption(val, textLabel) {
        this.playSound('send');
        this.addMsg(textLabel, 'user'); 
        
        this.showTyping();
        setTimeout(() => {
            this.removeTyping();

            if (val === 'yes_features') {
                if (this.lastFoundApp && this.lastFoundApp.Desc) {
                    let desc = this.lastFoundApp.Desc.replace(/\n/g, "<br>");
                    if(desc.length > 300) desc = desc.substring(0, 300) + "... <a href='post.html?uid="+this.lastFoundApp.ID+"' style='color:var(--primary)'>اقرأ المزيد</a>";
                    
                    this.addMsg(`<b>📌 مميزات ${this.lastFoundApp.Title}:</b><br><br>${desc}`, 'bot');
                } else {
                    this.addMsg("للأسف مفيش وصف متاح للتطبيق ده حالياً 😅", 'bot');
                }
                
                setTimeout(() => {
                    this.chatState = 'asking_restart';
                    this.addMsg("تمام يا بطل؟ محتاج تطبيق تاني؟ 🚀", 'bot');
                    this.addOptions([
                        { text: "أيوة 🔍", val: "restart_yes" },
                        { text: "لأ، كفاية 👋", val: "restart_no" }
                    ]);
                }, 1000);

            } else if (val === 'no_features') {
                this.chatState = 'asking_restart';
                this.addMsg("ولا يهمك! محتاج أبحثلك عن حاجة تانية؟ 😊", 'bot');
                this.addOptions([
                    { text: "أيوة 🔍", val: "restart_yes" },
                    { text: "لأ، شكراً 👋", val: "restart_no" }
                ]);

            } else if (val === 'restart_yes') {
                this.chatState = 'idle';
                this.addMsg("هات اسم التطبيق وأنا جاهز 🚀", 'bot');

            } else if (val === 'restart_no') {
                this.chatState = 'idle';
                this.addMsg("نورتنا يا بطل! ❤️ استمتع بالتطبيقات.", 'bot');
            }

        }, 800);
    }

    addMsg(html, type) {
        const row = document.createElement('div');
        row.className = `msg-row ${type}`;
        let avatar = (type === 'bot') ? `<img src="icon-192.png" class="bot-avatar-sm">` : '';
        row.innerHTML = `${avatar}<div class="msg-bubble">${html}</div>`;
        this.chatBody.appendChild(row);
        this.scrollToBottom();
        if(type === 'bot') this.playSound('receive');
    }

    showTyping() {
        const div = document.createElement('div');
        div.id = 'bot-typing';
        div.className = 'msg-row bot';
        div.innerHTML = `<img src="icon-192.png" class="bot-avatar-sm"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
        this.chatBody.appendChild(div);
        this.scrollToBottom();
    }

    removeTyping() {
        const typing = document.getElementById('bot-typing');
        if (typing) typing.remove();
    }

    scrollToBottom() {
        if(this.chatBody) this.chatBody.scrollTop = this.chatBody.scrollHeight;
    }
}

/* =========================================
   6. منطق صفحة التحميل (POST.HTML) - تم التحديث لمشاركة البيانات
   ========================================= */
function initPostPage() {
    // 1. تهيئة كائن التطبيق العام فوراً لكي لا يظهر خطأ للبوت
    window.app = { 
        data: [], // يبدأ فارغاً
        toggleTheme: function() { 
            const body = document.body;
            const icon = document.getElementById('theme-icon');
            const current = body.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            body.setAttribute('data-theme', newTheme);
            if(icon) icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('teslam_theme', newTheme);
        }
    };

    const savedTheme = localStorage.getItem('teslam_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('theme-icon');
    if(themeIcon) themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    const dbURL = "/api/data";
    let finalLink = "#";

    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get('uid');

    fetch(dbURL)
        .then(res => res.json())
        .then(json => {
            const cleanData = json ? Object.values(json).filter(item => item != null).reverse() : [];
            
            // ✅ تخزين البيانات في المتغير العام ليراها البوت
            window.app.data = cleanData;

            processData(cleanData);
        })
        .catch(err => {
            const loader = document.getElementById('loader');
            if(loader) loader.innerHTML = "حدث خطأ في تحميل البيانات";
        });

    function processData(data) {
        let app = null;
        if(uid) {
            app = data.find(item => item.ID == uid);
        }

        if(app) {
            renderPost(app, data);
            
            if(app.Tag) {
                let prefs = JSON.parse(localStorage.getItem('teslam_prefs') || '{}');
                prefs[app.Tag] = (prefs[app.Tag] || 0) + 1;
                localStorage.setItem('teslam_prefs', JSON.stringify(prefs));
            }

        } else {
            const loader = document.getElementById('loader');
            if(loader) loader.innerHTML = "عذراً، التطبيق غير موجود أو تم حذفه.";
        }
    }

    function renderPost(app, allApps) {
        document.title = `${app.Title || 'تطبيق'} - تحميل مجاني`;
        document.getElementById('p-img').src = app.Image || 'https://placehold.co/150';
        document.getElementById('p-title').innerText = app.Title || 'بدون عنوان';
        document.getElementById('p-desc').innerHTML = app.Desc ? app.Desc.replace(/\n/g, '<br>') : "لا يوجد وصف";
        finalLink = app.Link || '#';

        const sbList = document.getElementById('sidebar-list');
        if(sbList) {
            sbList.innerHTML = '';
            const related = allApps.filter(a => a.ID != app.ID && (a.Tag === app.Tag))
                                   .slice(0, 5);
            if (related.length < 3) {
                 const random = allApps.filter(a => a.ID != app.ID).sort(() => 0.5 - Math.random()).slice(0, 5 - related.length);
                 related.push(...random);
            }

            related.forEach(item => {
                sbList.innerHTML += `
                    <a href="post.html?uid=${item.ID}" class="mini-item">
                        <img src="${item.Image || 'https://placehold.co/150'}" class="mini-img">
                        <div class="mini-info">
                            <h4>${item.Title || 'بدون عنوان'}</h4>
                            <span><i class="fas fa-download"></i> تحميل</span>
                        </div>
                    </a>
                `;
            });
        }

        document.getElementById('loader').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    }

    window.isTimerDone = false;
    window.isCaptchaDone = false;

    window.captchaSolved = function() {
        window.isCaptchaDone = true;
        checkDownloadReady();
    }

    function checkDownloadReady() {
        if (window.isTimerDone && window.isCaptchaDone) {
            document.getElementById('timer-wrapper').style.display = 'none';
            const finalBtn = document.getElementById('btn-final');
            finalBtn.href = finalLink;
            finalBtn.style.display = 'flex';
        }
    }

    window.startCountdown = function() {
        document.getElementById('btn-start').style.display = 'none';
        document.getElementById('timer-wrapper').style.display = 'block';

        let timeLeft = 20; 
        const totalTime = 20;
        const circle = document.getElementById('circle-path');
        const numDisplay = document.getElementById('timer-num');
        
        const timer = setInterval(() => {
            timeLeft--;
            numDisplay.textContent = timeLeft;
            
            const percentage = (timeLeft / totalTime) * 100;
            circle.style.strokeDasharray = `${percentage}, 100`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                window.isTimerDone = true; 
                
                numDisplay.innerHTML = '<i class="fas fa-check"></i>';
                checkDownloadReady(); 
            }
        }, 1000);
    }
}

window.toggleTheme = function() {
    if (window.app && window.app.toggleTheme) {
        window.app.toggleTheme();
    }
}

/* =========================================
   7. نقطة الدخول (Entry Point)
   ========================================= */
if (document.getElementById('apps-grid')) {
    // الصفحة الرئيسية
    window.app = new TeslamApp();
    window.geniusBot = new GeniusBot();
} else if (document.getElementById('p-title')) {
    // صفحة التحميل
    initPostPage();
    window.geniusBot = new GeniusBot();
   }
