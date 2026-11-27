const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Triggers whenever the portal writes a notification event to /notifications/{notificationId}.
 * Looks up all registered FCM device tokens for the targetRole ('client' or 'builder')
 * and dispatches a push notification to those phones/browsers.
 */
exports.sendPortalPushNotification = onDocumentCreated('notifications/{notificationId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const data = snap.data();
  const targetRole = data.targetRole || 'client';
  const title = data.title || 'White Horse Builders Update';
  const body = data.body || 'You have a new update in your project portal.';
  const projectId = data.projectId || '';

  const db = admin.firestore();

  // Query users matching targetRole and collect their registered FCM tokens
  const usersSnap = await db.collection('users').where('role', '==', targetRole).get();
  const tokens = [];
  const tokenRefs = [];

  for (const userDoc of usersSnap.docs) {
    const tokensSnap = await userDoc.ref.collection('fcmTokens').get();
    tokensSnap.forEach((tDoc) => {
      const tData = tDoc.data();
      if (tData && tData.token) {
        tokens.push(tData.token);
        tokenRefs.push(tDoc.ref);
      }
    });
  }

  if (!tokens.length) {
    await snap.ref.update({ sent: false, status: 'no_tokens_found' });
    return;
  }

  const message = {
    notification: {
      title,
      body
    },
    data: {
      projectId,
      type: data.type || 'update',
      url: './index.html'
    },
    webpush: {
      notification: {
        title,
        body,
        icon: './icon-192.png',
        badge: './icon-192.png'
      },
      fcmOptions: {
        link: './index.html'
      }
    },
    tokens
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  // Clean up any expired or unregistered tokens
  const cleanupPromises = [];
  response.responses.forEach((res, idx) => {
    if (!res.success && res.error) {
      const code = res.error.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        cleanupPromises.push(tokenRefs[idx].delete());
      }
    }
  });
  await Promise.all(cleanupPromises);

  await snap.ref.update({
    sent: true,
    successCount: response.successCount,
    failureCount: response.failureCount,
    sentAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
