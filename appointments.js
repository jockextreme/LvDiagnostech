/**
 * DiagnosTech — Real-time appointment store (Firebase Firestore)
 *
 * Appointments live in Cloud Firestore, scoped by account id ("uid").
 * watch() uses onSnapshot, so any change (from this device or another)
 * reflects on every open dashboard in real time, no refresh needed.
 *
 * NOTE: Firestore is running in TEST MODE for this class demo — rules
 * are open and expire ~30 days after creation. Fine for a presentation,
 * not for a real production app.
 */
const AppointmentStore = (() => {
  'use strict';

  const firebaseConfig = {
    apiKey: 'AIzaSyDelT6a1YRUrGctyLeziY-uh9GIK15s5W8',
    authDomain: 'diagnostech-f5409.firebaseapp.com',
    projectId: 'diagnostech-f5409',
    storageBucket: 'diagnostech-f5409.firebasestorage.app',
    messagingSenderId: '251153885462',
    appId: '1:251153885462:web:2b97a34c3301ec2b2d0837',
  };

  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded — check the <script> tags in this page.');
    return {
      watch: () => () => {},
      seedIfEmpty: async () => {},
      add: async () => { throw new Error('Firebase not loaded'); },
      update: async () => { throw new Error('Firebase not loaded'); },
      remove: async () => { throw new Error('Firebase not loaded'); },
    };
  }

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const col = db.collection('appointments');

  return {
    /** Subscribe to this user's appointments in real time. Returns an unsubscribe fn. */
    watch(uid, onChange) {
      return col.where('uid', '==', uid).onSnapshot(
        (snap) => {
          const items = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
          onChange(items);
        },
        (err) => {
          console.error('AppointmentStore watch error:', err);
          onChange([]);
        }
      );
    },

    /** Seeds demo appointments for a user the first time they're seen (idempotent). */
    async seedIfEmpty(uid, items) {
      const snap = await col.where('uid', '==', uid).limit(1).get();
      if (!snap.empty) return;
      const batch = db.batch();
      items.forEach((item) => batch.set(col.doc(), { ...item, uid }));
      await batch.commit();
    },

    add(uid, item) {
      return col.add({ ...item, uid });
    },

    update(uid, id, patch) {
      return col.doc(id).update(patch);
    },

    remove(uid, id) {
      return col.doc(id).delete();
    },
  };
})();
