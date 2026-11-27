/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Replace with your Firebase Web App config for production,
// OR the web app will send its config to the service worker automatically via postMessage.
var SW_FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

var messagingInstance = null;

function initSwMessaging(cfg) {
  if (!cfg || !cfg.apiKey || cfg.apiKey === 'YOUR_API_KEY') return;
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
    messagingInstance = firebase.messaging();
    messagingInstance.onBackgroundMessage(function (payload) {
      var notif = payload.notification || {};
      var data = payload.data || {};
      var title = notif.title || data.title || 'White Horse Builders Update';
      var options = {
        body: notif.body || data.body || 'There is a new update on your build portal.',
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: data.projectId || 'whb-portal-update',
        renotify: true,
        data: {
          url: data.url || './index.html',
          projectId: data.projectId || ''
        }
      };
      return self.registration.showNotification(title, options);
    });
  } catch (err) {
    console.warn('[SW] Firebase messaging init error:', err);
  }
}

initSwMessaging(SW_FIREBASE_CONFIG);

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'INIT_FIREBASE_CONFIG' && event.data.config) {
    initSwMessaging(event.data.config);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
