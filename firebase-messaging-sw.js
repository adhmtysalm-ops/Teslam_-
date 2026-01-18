importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

/* 1. إعدادات فايربيس (نفس بياناتك) */
const firebaseConfig = {
  apiKey: "AIzaSyDiLmqbSVzdW5_DDMrKXttEDeu941vVWqc",
  authDomain: "teslamstore-df0a5.firebaseapp.com",
  projectId: "teslamstore-df0a5",
  storageBucket: "teslamstore-df0a5.firebasestorage.app",
  messagingSenderId: "1054567379055",
  appId: "1:1054567379055:web:a97efaa28108945733dd9a",
  measurementId: "G-MFY4BKBLDS"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

/* 2. دالة حفظ الإشعار في قاعدة البيانات (IndexedDB) */
// دي الإضافة المهمة اللي كانت ناقصة عشان التخزين يتم في الخلفية
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
            console.error('Database error:', event.target.error);
            reject();
        };
    });
}

/* 3. استقبال الرسالة في الخلفية وحفظها */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationBody = payload.notification.body;
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png'
  };

  // ✅ حفظ الرسالة في القاعدة فوراً قبل عرض الإشعار
  saveToDB(notificationTitle, notificationBody);

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
