import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAhmRyeY8G2o3WY2qFNSSXXUSoDcvSwbbs",
  authDomain: "self-manager-lucas.firebaseapp.com",
  projectId: "self-manager-lucas",
  storageBucket: "self-manager-lucas.firebasestorage.app",
  messagingSenderId: "66009936283",
  appId: "1:66009936283:web:a730bb710dcd0d3fab313e"
};

let app;
let db = null;
let auth = null;
let storage = null;

try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase init error:", error);
}

export const getDb = () => db;
export const getAuthInstance = () => auth;
export const getStorageInstance = () => storage;

export const uploadMeetingFile = (userId, meetingId, file, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!storage) return reject(new Error('Storage not available'));
    const path = `users/${userId}/meetings/${meetingId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed',
      (snap) => onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ name: file.name, url, size: file.size, type: file.type, path });
      }
    );
  });
};

export const deleteMeetingFile = async (path) => {
  if (!storage || !path) return;
  try { await deleteObject(ref(storage, path)); }
  catch (e) { console.warn('Storage delete error:', e); }
};

export const uploadFile = (userId, folder, entityId, file, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!storage) return reject(new Error('Storage not available'));
    const path = `users/${userId}/${folder}/${entityId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed',
      (snap) => onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ name: file.name, url, size: file.size, type: file.type, path });
      }
    );
  });
};

export const deleteFile = async (path) => {
  if (!storage || !path) return;
  try { await deleteObject(ref(storage, path)); }
  catch (e) { console.warn('Storage delete error:', e); }
};

export const signUp = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const signOut = () => firebaseSignOut(auth);

export const onAuthStateChanged = (callback) =>
  firebaseOnAuthStateChanged(auth, callback);

export const fbSave = async (userId, col, data) => {
  if (!db || !userId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'app_data', col), {
      items: data,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) { console.warn("Firebase save error:", e); }
};

export const routinesSave = async (userId, data) => {
  if (!db || !userId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'app_data', 'checkout_routines'), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (e) { }
};

export const routinesLoad = async (userId) => {
  if (!db || !userId) return null;
  try {
    const d = await getDoc(doc(db, 'users', userId, 'app_data', 'checkout_routines'));
    return d.exists() ? d.data() : null;
  } catch (e) { return null; }
};

export const fbLoad = async (userId, col) => {
  if (!db || !userId) return null;
  try {
    const d = await getDoc(doc(db, 'users', userId, 'app_data', col));
    return d.exists() ? (d.data().items ?? []) : [];
  } catch (e) {
    console.warn("Firebase load error:", e);
    return null;
  }
};

export const vaultSave = async (userId, encryptedEntries, salt) => {
  if (!db || !userId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'vault', 'data'), {
      entries: encryptedEntries,
      salt,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) { console.warn("Vault save error:", e); }
};

export const vaultLoad = async (userId) => {
  if (!db || !userId) return null;
  try {
    const d = await getDoc(doc(db, 'users', userId, 'vault', 'data'));
    return d.exists() ? d.data() : null;
  } catch (e) {
    console.warn("Vault load error:", e);
    return null;
  }
};

export const reviewSave = async (userId, weekKey, data) => {
  if (!db || !userId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'reviews', weekKey), { ...data, updatedAt: new Date().toISOString() });
  } catch (e) { console.warn("Review save error:", e); }
};

export const reviewLoad = async (userId, weekKey) => {
  if (!db || !userId) return null;
  try {
    const d = await getDoc(doc(db, 'users', userId, 'reviews', weekKey));
    return d.exists() ? d.data() : null;
  } catch (e) {
    console.warn("Review load error:", e);
    return null;
  }
};
