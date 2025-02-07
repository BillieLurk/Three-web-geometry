import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBQJFts8akX1wL6dbugCKh-y1ybAL7wB0Y",
  authDomain: "hex-livevizualizer.firebaseapp.com",
  databaseURL:
    "https://hex-livevizualizer-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hex-livevizualizer",
  storageBucket: "hex-livevizualizer.firebasestorage.app",
  messagingSenderId: "222540727642",
  appId: "1:222540727642:web:e8ba49cce4d88f00eb9f63",
  measurementId: "G-K5Q0DJCFQW",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
