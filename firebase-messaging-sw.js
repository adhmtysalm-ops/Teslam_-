importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// ✅ دي بيانات مشروعك الحقيقية
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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

