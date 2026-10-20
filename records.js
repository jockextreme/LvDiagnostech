/**
 * DiagnosTech — Health records & prescriptions store (Firebase Firestore)
 *
 * A record is created by a DOCTOR and attached to a PATIENT's account (by uid).
 * Patients can only read their own; doctors write by looking up the patient's
 * uid via Auth.findByEmail() first. Real-time via onSnapshot.
 *
 * Same test-mode caveat as appointments.js — fine for a class demo only.
 */
const RecordStore = (() => {
  'use strict';

  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded — check the <script> tags in this page.');
    return {
      watch: () => () => {},
      seedIfEmpty: async () => {},
      add: async () => { throw new Error('Firebase not loaded'); },
    };
  }

  const db = firebase.firestore();
  const col = db.collection('health_records');

  return {
    /** Subscribe to this patient's records in real time. Returns an unsubscribe fn. */
    watch(uid, onChange) {
      return col.where('uid', '==', uid).onSnapshot(
        (snap) => {
          const items = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
          onChange(items);
        },
        (err) => {
          console.error('RecordStore watch error:', err);
          onChange([]);
        }
      );
    },

    async seedIfEmpty(uid, items) {
      const snap = await col.where('uid', '==', uid).limit(1).get();
      if (!snap.empty) return;
      const batch = db.batch();
      items.forEach((item) => batch.set(col.doc(), { ...item, uid, createdAt: Date.now() }));
      await batch.commit();
    },

    add(uid, item) {
      return col.add({ ...item, uid, createdAt: Date.now() });
    },
  };
})();
