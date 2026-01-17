/* =========================================
   0. كود الحماية (يمنع التشغيل خارج موقعك)
   ========================================= */
(function(){
    var myDomain = "teslam.vercel.app"; 
    // للسماح بالتشغيل المحلي أثناء التطوير
    if (window.location.hostname !== myDomain ) {
        document.body.innerHTML = "<h1>ممنوع سرقة الكود! 🚫</h1>";
        throw new Error("Access Denied: Production Only");
    }
})();

/* =========================================
   1. تهيئة وإعدادات FIREBASE
   ========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js";

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

    // 🔥 دالة الخوارزمية الذكية (Smart Context Recommendation)
    renderRecommended() {
        const recContainer = document.getElementById('recommended-section');
        const recGrid = document.getElementById('recommended-grid');
        if (!recContainer || !recGrid) return;

        // محاولة معرفة اهتمامات الزائر (Context Awareness)
        const lastVisitedTag = localStorage.getItem('teslam_last_tag');
        
        let selected = [];

        if (lastVisitedTag) {
            // تخصيص المحتوى بناءً على الزيارات السابقة
            selected = this.data
                .filter(a => a.Tag === lastVisitedTag)
                .sort(() => 0.5 - Math.random())
                .slice(0, 4);
        } 
        
        // إكمال العدد إذا لم نجد ما يكفي
        if (selected.length < 4) {
            const remaining = this.data.filter(a => !selected.includes(a));
            const randomFill = this.shuffleArray([...remaining]).slice(0, 4 - selected.length);
            selected = selected.concat(randomFill);
        }

        if (selected.length > 0) {
            recContainer.style.display = 'block';
            recGrid.innerHTML = '';
            selected.forEach((app, idx) => {
                const card = document.createElement('div');
                card.className = 'app-card';
                // Animation FadeIn
                card.style.animation = `fadeUp 0.5s ease forwards ${idx * 0.1}s`;
                card.onclick = () => this.goToPost(app.ID, idx);
                card.innerHTML = `
                    <div class="card-img-wrapper">
                        <img src="${app.Image || 'https://placehold.co/150'}" class="card-img" loading="lazy">
                        ${lastVisitedTag && app.Tag === lastVisitedTag ? '<span style="position:absolute; top:8px; left:8px; background:rgba(46,204,113,0.9); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px;">مختار لك</span>' : ''}
                    </div>
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

    // 🔥 تحديث البحث ليشمل Keywords
    search(q) {
        const query = q.toLowerCase();
        const filtered = this.data.filter(i =>
            (i.Title && i.Title.toLowerCase().includes(query)) ||
            (i.Tag && i.Tag.toLowerCase().includes(query)) ||
            (i.Desc && i.Desc.toLowerCase().includes(query)) ||
            (i.Keywords && i.Keywords.toLowerCase().includes(query)) // ✅ البحث في الكلمات المفتاحية
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
   4. موديل الذكاء الاصطناعي (TESLAM BRAIN AI)
   Architecture: NLP Engine + Context Memory + RAG
   ========================================= */

// أ. كلاس معالجة اللغة العربية (Arabic NLP Utility)
class ArabicNLP {
    constructor() {
        this.prefixes = ['ال', 'وال', 'فال', 'لـ', 'بـ', 'كـ'];
        this.suffixes = ['ها', 'هم', 'هن', 'كم', 'ني', 'ي', 'نا', 'ة', 'ه', 'ين', 'ون', 'ان'];
        this.stopWords = new Set(['في', 'من', 'على', 'عن', 'هل', 'كيف', 'ما', 'هو', 'هي', 'انا', 'انت', 'تطبيق', 'تحميل', 'عايز', 'اريد', 'بدي', 'ابي', 'ممكن', 'لو', 'سمحت', 'عندك', 'ابغى']);
    }

    normalize(text) {
        if (!text) return "";
        return text.toLowerCase()
            .replace(/(أ|إ|آ)/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/(ي|ى)/g, 'ي')
            .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
            .trim();
    }

    tokenize(text) {
        return this.normalize(text).split(/\s+/);
    }

    getStem(word) {
        if (word.length < 4) return word; 
        let stem = word;
        // إزالة السوابق
        for (let p of this.prefixes) {
            if (stem.startsWith(p) && stem.length > p.length + 2) {
                stem = stem.substring(p.length);
                break;
            }
        }
        // إزالة اللواحق
        for (let s of this.suffixes) {
            if (stem.endsWith(s) && stem.length > s.length + 2) {
                stem = stem.substring(0, stem.length - s.length);
                break;
            }
        }
        return stem;
    }
}

// ب. الكلاس الرئيسي للذكاء الاصطناعي
class GeniusBot {
    constructor() {
        this.isOpen = false;
        this.chatBody = document.getElementById('chatBody');
        if (!this.chatBody) return;

        // تفعيل المحركات
        this.nlp = new ArabicNLP();
        this.memory = {
            history: [],
            lastAppFound: null, // Context Memory
            userName: 'يا بطل'
        };

        // قاعدة المعرفة الثابتة (الهوية والشخصية)
        this.knowledgeBase = {
            identity: {
                keywords: ['مين', 'انت', 'عرفني', 'اسمك', 'صنعك', 'طورك', 'عملك'],
                responses: [
                    "أنا (تسلم AI)، مساعد ذكي مطور خصيصاً لموقع teslam.vercel.app 🤖",
                    "أنا عقلك الرقمي هنا! صنعني المبدع أدهم (Adham)، صاحب ومطور موقع تسلم ❤️",
                    "أنا روبوت ذكي، برمجني أدهم لخدمتك. اسألني عن أي تطبيق أو لعبة! 🚀"
                ]
            },
            greeting: {
                keywords: ['سلام', 'مرحبا', 'هلا', 'هاي', 'ازيك', 'عامل'],
                responses: [
                    "يا هلا! 🌹 نورت متجر تسلم.",
                    "أهلاً بك! جاهز أساعدك تلاقي أي تطبيق في ثواني. ⚡",
                    "وعليكم السلام! كلي آذان صاغية يا غالي."
                ]
            },
            gratitude: {
                keywords: ['شكرا', 'حبيبي', 'تسلم', 'كفو', 'عاش', 'thx'],
                responses: [
                    "على إيه يا صاحبي! أنا في الخدمة دائماً ❤️",
                    "الشكر لله! المهم تكون مبسوط معانا.",
                    "حبيبي! أي خدمة تانية أنا موجود."
                ]
            }
        };

        this.sounds = {
            send: new Audio("https://cdn.pixabay.com/audio/2022/03/24/audio_3322f963a7.mp3"),
            receive: new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_279930922e.mp3")
        };
        this.sounds.send.volume = 0.4;
        this.sounds.receive.volume = 0.4;
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const chatWin = document.getElementById('chatWindow');
        if (chatWin) chatWin.classList.toggle('active');
        if (this.isOpen) {
            setTimeout(() => document.getElementById('chatInput')?.focus(), 300);
            this.sounds.send.play().catch(() => {});
        }
    }

    send() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        this.addMsg(text, 'user');
        this.sounds.send.play().catch(() => {});
        input.value = '';
        this.showTyping();

        // محاكاة وقت التفكير (Thinking Latency)
        const thinkingTime = Math.min(text.length * 30 + 500, 2000);
        
        setTimeout(() => {
            this.removeTyping();
            this.processInput(text);
        }, thinkingTime);
    }

    // 🔥 المعالج الذكي (The Brain)
    processInput(rawText) {
        // 1. تحليل لغوي
        const tokens = this.nlp.tokenize(rawText);
        const stems = tokens.map(t => this.nlp.getStem(t));
        const normalizedText = this.nlp.normalize(rawText);

        // 2. التحقق من الأوامر الثابتة
        for (let type in this.knowledgeBase) {
            const kb = this.knowledgeBase[type];
            if (kb.keywords.some(k => normalizedText.includes(k))) {
                const reply = kb.responses[Math.floor(Math.random() * kb.responses.length)];
                this.addMsg(reply, 'bot');
                return;
            }
        }

        // 3. التحقق من السياق (Context Awareness)
        if (this.memory.lastAppFound) {
            const contextKeywords = ['حجم', 'مساحه', 'وصف', 'مميزات', 'رابط', 'حمل', 'تنزيل', 'صوره', 'وريني', 'التفاصيل'];
            if (contextKeywords.some(k => normalizedText.includes(k))) {
                this.handleContextQuery(normalizedText, this.memory.lastAppFound);
                return;
            }
        }

        // 4. محرك البحث الدلالي (Semantic Search)
        this.searchDeep(tokens, stems);
    }

    handleContextQuery(text, app) {
        let reply = "";
        if (text.includes('حجم') || text.includes('مساحه')) {
            reply = `مساحة <b>${app.Title}</b> تقريباً حسب آخر تحديث. خفيفة وسريعة! 🚀`;
        } else if (text.includes('وصف') || text.includes('مميزات') || text.includes('التفاصيل')) {
            reply = `<b>أهم مميزات ${app.Title}:</b><br>${(app.Desc || '').substring(0, 200)}...<br>تحب تشوف الباقي في صفحة التحميل؟`;
        } else if (text.includes('رابط') || text.includes('حمل') || text.includes('تنزيل')) {
            reply = `ولا يهمك! زرار التحميل اهو 👇`;
        } else {
            reply = `أنا فاهم إنك بتسأل عن <b>${app.Title}</b>، بس ممكن توضح سؤالك؟`;
        }
        
        this.addMsg(reply, 'bot');
        if (text.includes('رابط') || text.includes('حمل')) {
            this.showAppCard(app);
        }
    }

    searchDeep(tokens, stems) {
        if (!window.app || !window.app.data) {
            this.addMsg("للأسف لسه البيانات بتحمل.. ثواني وجرب تاني ⏳", 'bot');
            return;
        }

        // خوارزمية Scoring متقدمة
        const results = window.app.data.map(app => {
            let score = 0;
            const appTitleNorm = this.nlp.normalize(app.Title);
            const appTagsNorm = this.nlp.normalize(app.Tag || "");
            const appDescNorm = this.nlp.normalize(app.Desc || "");
            const appKeywordsNorm = this.nlp.normalize(app.Keywords || "");

            // البحث بالجذر
            stems.forEach(stem => {
                if (stem.length < 2) return;
                if (appTitleNorm.includes(stem)) score += 25; // وزن العنوان
                if (appKeywordsNorm.includes(stem)) score += 20; // وزن الكلمات المفتاحية
                if (appTagsNorm.includes(stem)) score += 15;
                if (appDescNorm.includes(stem)) score += 5;
            });

            // البحث بالكلمة الكاملة
            tokens.forEach(token => {
                if (appTitleNorm.includes(token)) score += 30;
                if (appKeywordsNorm.includes(token)) score += 25;
            });

            return { app, score };
        })
        .filter(r => r.score > 15)
        .sort((a, b) => b.score - a.score);

        if (results.length > 0) {
            const bestMatch = results[0].app;
            this.memory.lastAppFound = bestMatch; // حفظ في الذاكرة
            
            const replies = [
                `لقيت اللي بتدور عليه! 🎯 <b>${bestMatch.Title}</b>`,
                `طلبك موجود يا غالي، اتفضل: <b>${bestMatch.Title}</b>`,
                `أيوة عندنا التطبيق ده! شوف كده 👇`
            ];
            this.addMsg(replies[Math.floor(Math.random() * replies.length)], 'bot');
            this.showAppCard(bestMatch);
            
            // 🔥 الاقتراح التفاعلي (عرض المميزات)
            setTimeout(() => {
                this.addMsg(`تحب أعرضلك مميزات ووصف <b>${bestMatch.Title}</b>؟ 🤔`, 'bot');
                this.showInteractiveButtons();
            }, 1200);

        } else {
            this.addMsg("ممم.. دورت في كل مكان ومش لاقي حاجة بالاسم ده 🤔.<br>جرب تكتب الاسم بطريقة تانية أو اطلب قسم معين.", 'bot');
            
            // اقتراح عشوائي ذكي
            const randomApp = window.app.data[Math.floor(Math.random() * window.app.data.length)];
            setTimeout(() => {
                this.addMsg(`بس إيه رأيك تجرب <b>${randomApp.Title}</b>؟ عليه طلب عالي اليومين دول 🔥`, 'bot');
                this.showAppCard(randomApp);
            }, 2000);
        }
    }

    addMsg(html, type) {
        const row = document.createElement('div');
        row.className = `msg-row ${type}`;
        const avatar = type === 'bot' ? `<img src="icon-192.png" class="bot-avatar-sm">` : '';
        row.innerHTML = `${avatar}<div class="msg-bubble">${html}</div>`;
        this.chatBody.appendChild(row);
        this.scrollToBottom();
        if (type === 'bot') this.sounds.receive.play().catch(() => {});
    }

    showAppCard(app) {
        const cardHTML = `
        <div class="bot-result-card" onclick="window.location.href='post.html?uid=${app.ID}'">
            <img src="${app.Image || 'https://placehold.co/150'}" class="bot-res-img">
            <div class="bot-res-info">
                <div class="bot-res-title">${app.Title}</div>
                <div class="bot-res-btn">تحميل مباشر 🚀</div>
            </div>
        </div>`;
        const div = document.createElement('div');
        div.className = 'msg-row bot';
        div.innerHTML = `<div style="width:100%; padding-right:10px;">${cardHTML}</div>`;
        this.chatBody.appendChild(div);
        this.scrollToBottom();
    }

    showInteractiveButtons() {
        const div = document.createElement('div');
        div.className = 'msg-row bot';
        div.innerHTML = `
            <div style="width:100%; padding-right:10px; margin-top:5px;">
                <div class="bot-options">
                    <button class="option-btn" onclick="window.geniusBot.handleUserChoice('features')">أيوة، وريني ✨</button>
                    <button class="option-btn" onclick="window.geniusBot.handleUserChoice('search')">لأ، بحث جديد 🔍</button>
                </div>
            </div>`;
        this.chatBody.appendChild(div);
        this.scrollToBottom();
    }

    handleUserChoice(choice) {
        document.querySelectorAll('.bot-options').forEach(e => e.remove()); // تنظيف الأزرار
        
        if (choice === 'features' && this.memory.lastAppFound) {
            this.addMsg('أيوة، وريني ✨', 'user');
            this.showTyping();
            setTimeout(() => {
                this.removeTyping();
                const desc = this.memory.lastAppFound.Desc || "لا يوجد وصف متاح حالياً.";
                this.addMsg(`<b>تفضل يا سيدي، دي نبذة عن ${this.memory.lastAppFound.Title}:</b><br><br>${desc.substring(0, 300)}...`, 'bot');
                setTimeout(() => this.addMsg("محتاج أي حاجة تانية؟ أنا جاهز! 🫡", 'bot'), 1500);
            }, 1000);
        } else {
            this.addMsg('لأ، بحث جديد 🔍', 'user');
            this.memory.lastAppFound = null; // تصفير الذاكرة لبحث جديد
            setTimeout(() => this.addMsg("كلي آذان صاغية.. اكتب اسم التطبيق 👂", 'bot'), 500);
        }
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
        const el = document.getElementById('bot-typing');
        if (el) el.remove();
    }

    scrollToBottom() {
        this.chatBody.scrollTop = this.chatBody.scrollHeight;
    }
}

/* =========================================
   5. منطق صفحة التحميل (POST.HTML)
   ========================================= */
function initPostPage() {
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
        
        // حفظ سياق التصفح (للاستخدام في الصفحة الرئيسية)
        if(app.Tag) {
            localStorage.setItem('teslam_last_tag', app.Tag);
        }

        // --- 🔥 منطق الاقتراحات الذكي (Smart Sidebar Algorithm) ---
        const sbList = document.getElementById('sidebar-list');
        if(sbList) {
            sbList.innerHTML = '';
            
            // خوارزمية حساب التشابه (Tag + Keywords)
            let recommendations = allApps
                .filter(item => item.ID !== app.ID)
                .map(item => {
                    let score = 0;
                    // نفس القسم = +50
                    if (item.Tag && app.Tag && item.Tag === app.Tag) score += 50;
                    // تشابه كلمات مفتاحية = +10 لكل كلمة
                    const itemKeys = (item.Keywords || "").toLowerCase();
                    const currentKeys = (app.Keywords || "").toLowerCase().split(/[\s,]+/);
                    currentKeys.forEach(k => { if(k.length>2 && itemKeys.includes(k)) score += 10; });
                    
                    return { item, score };
                })
                .sort((a, b) => b.score - a.score) // الأفضل أولاً
                .slice(0, 5) // خذ أول 5
                .map(r => r.item);

            // لو مفيش نتايج كافية، كمل بعشوائي
            if (recommendations.length < 5) {
                const randoms = allApps.filter(a => a.ID != app.ID && !recommendations.includes(a))
                                       .sort(() => 0.5 - Math.random())
                                       .slice(0, 5 - recommendations.length);
                recommendations = recommendations.concat(randoms);
            }

            if (recommendations.length === 0) {
                sbList.innerHTML = '<div style="text-align:center; font-size:12px; color:var(--text-sub)">لا توجد اقتراحات</div>';
            }

            recommendations.forEach(item => {
                sbList.innerHTML += `
                    <a href="post.html?uid=${item.ID}" class="mini-item">
                        <img src="${item.Image || 'https://placehold.co/150'}" class="mini-img">
                        <div class="mini-info">
                            <h4>${item.Title || 'بدون عنوان'}</h4>
                            <span style="font-size:10px; color:${item.Tag === app.Tag ? 'var(--primary)' : 'var(--text-sub)'}">
                                ${item.Tag === app.Tag ? '<i class="fas fa-thumbs-up"></i> مقترح لك' : '<i class="fas fa-download"></i> تحميل'}
                            </span>
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

// دالة تبديل الثيم العامة
window.toggleTheme = function() {
    if (window.app) {
        window.app.toggleTheme();
    } else {
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
if (document.getElementById('apps-grid')) {
    // نحن في index.html
    window.app = new TeslamApp();
    window.geniusBot = new GeniusBot();
} else if (document.getElementById('p-title')) {
    // نحن في post.html
    initPostPage();
}
