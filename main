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
   2. تسجيل SERVICE WORKER
   ========================================= */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('تم تشغيل التطبيق بنجاح! 📱', reg.scope))
            .catch(err => console.log('فشل تشغيل التطبيق ❌', err));
    });
}

/* =========================================
   3. كلاس تطبيق TESLAM (الصفحة الرئيسية)
   ========================================= */
class TeslamApp {
    constructor() {
        this.dbURL = "/api/data";
        this.data = [];
        // التأكد من أننا في الصفحة الرئيسية قبل التنفيذ
        if (document.getElementById('apps-grid')) {
            this.init();
        }
    }

    init() {
        this.loadTheme();
        this.fetchData();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => this.search(e.target.value));
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
                card.onclick = () => this.goToPost(app.ID, idx);
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
            <div class="hero-card" onclick="app.goToPost('${top.ID}', 0)">
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
            card.onclick = () => this.goToPost(app.ID, idx);
            card.innerHTML = `
                <div class="card-img-wrapper"><img src="${app.Image || 'https://placehold.co/150'}" class="card-img" loading="lazy"></div>
                <div class="card-title">${app.Title || 'بدون عنوان'}</div>
                <div class="dl-btn"><i class="fas fa-download"></i> تحميل</div>
            `;
            grid.appendChild(card);
        });
    }

    search(q) {
        const query = q.toLowerCase();
        const filtered = this.data.filter(i =>
            (i.Title && i.Title.toLowerCase().includes(query)) ||
            (i.Tag && i.Tag.toLowerCase().includes(query)) ||
            (i.Desc && i.Desc.toLowerCase().includes(query))
        );
        const hero = document.getElementById('hero-section');
        const rec = document.getElementById('recommended-section');
        const tags = document.getElementById('tags-bar');

        if(hero) hero.style.display = q ? 'none' : 'block';
        if(rec) rec.style.display = q ? 'none' : 'block';
        if(tags) tags.style.display = q ? 'none' : 'flex';
        this.renderGrid(filtered);
    }

    filter(tag, el) {
        document.querySelectorAll('.tag-pill').forEach(t => t.classList.remove('active'));
        if (el) el.classList.add('active');
        
        const hero = document.getElementById('hero-section');
        const rec = document.getElementById('recommended-section');

        if (tag === 'all') {
            if(hero) hero.style.display = 'block';
            if(rec) rec.style.display = 'block';
            this.renderGrid(this.data);
        } else {
            if(hero) hero.style.display = 'none';
            if(rec) rec.style.display = 'none';
            this.renderGrid(this.data.filter(i => i.Tag && i.Tag.trim() === tag));
        }
    }

    goToPost(uid, idx) {
        let url = 'post.html?';
        if (uid) url += `uid=${uid}`;
        else url += `id=${idx}`;
        window.location.href = url;
    }
}

/* =========================================
   4. كلاس GENIUS BOT (المحادثة الذكية)
   ========================================= */
class GeniusBot {
    constructor() {
        this.isOpen = false;
        this.chatBody = document.getElementById('chatBody');
        
        // منع الأخطاء إذا لم يكن البوت موجودًا في الصفحة (مثل صفحة البوست)
        if(!this.chatBody) return;

        // الأصوات
        this.sendSound = new Audio("https://cdn.pixabay.com/audio/2022/03/24/audio_3322f963a7.mp3");
        this.receiveSound = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_279930922e.mp3");
        this.sendSound.volume = 0.5; this.receiveSound.volume = 0.5;

        this.persona = {
            greet: { match: /سلام|مرحبا|هلا|هاي|hi|hello|hey|ازيك|عامل ايه/i, reply: ["يا هلا! ❤️ منور المتجر.", "أهلاً بك! 🚀 آمرني؟", "وعليكم السلام! 😉"] },
            thanks: { match: /شكرا|تسلم|حبيبي|كفو|thx|thanks/i, reply: ["العفو يا غالي! 🤖", "تحت أمرك في أي وقت! ❤️"] }
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

        const thinkingTime = Math.min(Math.max(text.length * 50, 600), 2000);
        setTimeout(() => {
            this.removeTyping();
            this.processBrain(text);
        }, thinkingTime);
    }

    processBrain(rawText) {
        const simpleText = rawText.toLowerCase();
        for (let key in this.persona) {
            if (this.persona[key].match.test(simpleText)) {
                const replies = this.persona[key].reply;
                const randomReply = replies[Math.floor(Math.random() * replies.length)];
                this.addMsg(randomReply, 'bot');
                return;
            }
        }

        const query = this.normalize(rawText);
        if (query.length < 2) {
            this.addMsg("اكتب اسم التطبيق (مثلاً: <b>ببجي</b>)...", 'bot');
            return;
        }

        this.searchDatabase(query);
    }

    searchDatabase(query) {
        if (!window.app || !window.app.data || !window.app.data.length) {
            this.addMsg("ثواني بجمع البيانات... ⏳", 'bot');
            return;
        }

        const matches = window.app.data.map(appItem => {
            const title = this.normalize(appItem.Title);
            const tag = this.normalize(appItem.Tag || "");
            const keywords = this.normalize(appItem.Keywords || "");
            
            let score = 0;
            if (title.includes(query) || query.includes(title)) score += 100;
            if (keywords.includes(query)) score += 95;
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
            this.addMsg(`لقيت طلبك! 🤩 غالباً بتدور على <b>${best.Title}</b>:`, 'bot');
            
            let cardsHTML = '';
            matches.slice(0, 3).forEach(m => {
                cardsHTML += `
                <div class="bot-result-card" onclick="window.location.href='post.html?uid=${m.app.ID}'">
                    <img src="${m.app.Image}" class="bot-res-img">
                    <div class="bot-res-info">
                        <div class="bot-res-title">${m.app.Title}</div>
                        <div class="bot-res-btn">تحميل مباشر 🚀</div>
                    </div>
                </div>`;
            });

            const div = document.createElement('div');
            div.className = 'msg-row bot';
            div.style.display = 'block';
            div.innerHTML = `<div style="width:100%; padding-right:10px;">${cardsHTML}</div>`;
            this.chatBody.appendChild(div);

        } else {
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

        setTimeout(() => {
            this.showTyping();
            setTimeout(() => {
                this.removeTyping();
                this.addMsg("أتمنى النتيجة عجبتك! 🌹<br><b>محتاج حاجة تانية؟</b>", 'bot');
                
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'msg-row bot';
                optionsDiv.style.display = 'block';
                optionsDiv.innerHTML = `
                    <div style="width:100%; padding-right:10px; margin-top:5px;">
                        <div class="bot-options">
                            <button class="option-btn" onclick="window.geniusBot.handleOption('yes')">أيوه 🔍</button>
                            <button class="option-btn" onclick="window.geniusBot.handleOption('no')">لأ، شكراً 👋</button>
                        </div>
                    </div>`;
                this.chatBody.appendChild(optionsDiv);
                this.playSound('receive');
                this.scrollToBottom();
            }, 1200);
        }, 2000);
    }

    handleOption(choice) {
        if (choice === 'yes') {
            this.playSound('send');
            this.addMsg("أيوه 🔍", 'user');
            setTimeout(() => {
                this.showTyping();
                setTimeout(() => {
                    this.removeTyping();
                    this.addMsg("هات اسم التطبيق وأنا جاهز 🚀", 'bot');
                }, 800);
            }, 500);
        } else {
            this.playSound('send');
            this.addMsg("لأ، شكراً 👋", 'user');
            setTimeout(() => {
                this.showTyping();
                setTimeout(() => {
                    this.removeTyping();
                    this.addMsg("نورتنا يا بطل! ❤️", 'bot');
                }, 800);
            }, 500);
        }
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
   5. منطق صفحة التحميل (POST.HTML)
   ========================================= */
function initPostPage() {
    // 1. Theme Logic
    const savedTheme = localStorage.getItem('teslam_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('theme-icon');
    if(themeIcon) themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    // 2. Data Fetching
    const dbURL = "/api/data";
    let finalLink = "#";

    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get('uid');

    // تحميل البيانات
    fetch(dbURL)
        .then(res => res.json())
        .then(json => {
            const cleanData = json ? Object.values(json).filter(item => item != null).reverse() : [];
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

        // --- منطق الاقتراحات (Sidebar) ---
        const sbList = document.getElementById('sidebar-list');
        if(sbList) {
            sbList.innerHTML = '';
            const related = allApps.filter(a => a.ID != app.ID)
                                   .sort(() => 0.5 - Math.random())
                                   .slice(0, 5);

            if (related.length === 0) {
                sbList.innerHTML = '<div style="text-align:center; font-size:12px; color:var(--text-sub)">لا توجد اقتراحات</div>';
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

    // --- منطق التحميل والكابتشا ---
    window.isTimerDone = false;
    window.isCaptchaDone = false;

    // دالة الكابتشا (يجب أن تكون Global لكي يراها Google Recaptcha)
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

// دالة تبديل الثيم العامة (تستخدم في الصفحتين)
window.toggleTheme = function() {
    if (window.app) {
        window.app.toggleTheme();
    } else {
        // Fallback for post page logic
        const body = document.body;
        const icon = document.getElementById('theme-icon');
        const current = body.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        if(icon) icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('teslam_theme', newTheme);
    }
}

/* =========================================
   6. نقطة الدخول (Entry Point)
   ========================================= */
// تشغيل الأكواد حسب الصفحة الموجودة
if (document.getElementById('apps-grid')) {
    // نحن في index.html
    window.app = new TeslamApp();
    window.geniusBot = new GeniusBot();
} else if (document.getElementById('p-title')) {
    // نحن في post.html
    initPostPage();
}
