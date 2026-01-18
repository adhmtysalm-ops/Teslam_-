importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const CACHE_NAME = "teslam-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/post.html",
  "/about.html",
  "/contact.html",
  "/privacy.html",
  "/terms.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// --- 1. إعدادات فايربيس (Firebase Config) ---
const firebaseConfig = {
  apiKey: "AIzaSyDiLmqbSVzdW5_DDMrKXttEDeu941vVWqc",
  authDomain: "teslamstore-df0a5.firebaseapp.com",
  projectId: "teslamstore-df0a5",
  storageBucket: "teslamstore-df0a5.firebasestorage.app",
  messagingSenderId: "1054567379055",
  appId: "1:1054567379055:web:a97efaa28108945733dd9a",
  measurementId: "G-MFY4BKBLDS"
};

// تهيئة فايربيس داخل الـ Service Worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// --- 2. دالة حفظ الإشعارات في قاعدة البيانات (IndexedDB) ---
// هذه الدالة تضمن أن الإشعار الذي يصل والبرنامج مغلق يتم حفظه ليظهر في الجرس
const dbName = 'TeslamDB';
const storeName = 'notifications';

function saveToDB(title, body) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'time' });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.add({
                title: title,
                body: body,
                time: new Date().getTime(),
                read: false
            });
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
        };
        
        request.onerror = (event) => {
            console.error('DB Save Error:', event.target.error);
            resolve(); // نكمل حتى لو فشل الحفظ عشان الإشعار يظهر
        };
    });
}

// --- 3. استقبال رسائل الخلفية (Background Handler) ---
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationBody = payload.notification.body;
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png'
  };

  // نحفظ الرسالة في الداتابيز ثم نعرض الإشعار
  return saveToDB(notificationTitle, notificationBody).then(() => {
      return self.registration.showNotification(notificationTitle, notificationOptions);
  });
});

// --- 4. منطق الكاش (Install, Activate, Fetch) ---

// تثبيت الكاش (Install)
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// تفعيل وتنظيف الكاش القديم (Activate)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استدعاء الملفات (Network First Strategy)
self.addEventListener("fetch", (event) => {
  // استثناء طلبات API وفايربيس من الكاش لتجنب المشاكل
  if (
      event.request.url.includes('/api/') || 
      event.request.url.includes('firestore') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('chrome-extension')
  ) {
      return; 
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // إذا نجح الاتصال بالشبكة، نحدث الكاش
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // إذا فشل النت، نجيب من الكاش
        return caches.match(event.request);
      })
  );
});
