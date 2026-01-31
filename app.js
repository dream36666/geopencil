// Import the specific Firebase functions we need from the web
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmfByO04NJzGXl0HeF1Ia31p9bMKafR7g",
  authDomain: "geopencil-40cd0.firebaseapp.com",
  projectId: "geopencil-40cd0",
  storageBucket: "geopencil-40cd0.firebasestorage.app",
  messagingSenderId: "353891275631",
  appId: "1:353891275631:web:32b4f3c66446468fad8e9a",
  measurementId: "G-X6HVF1ZEQF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements (The parts of your HTML we need to talk to)
const pencilForm = document.getElementById('pencilForm');
const gallery = document.getElementById('pencil-grid');

// --- FUNCTION 1: HANDLE UPLOADS ---
pencilForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop the page from reloading
    console.log("Form submitted, starting upload...");

    // 1. Get the data from the HTML form
    const name = document.getElementById('finderName').value;
    const tracking = document.getElementById('trackingNumber').value;
    const loc = document.getElementById('location').value;
    const len = document.getElementById('length').value;
    const photoFile = document.getElementById('photo').files[0];

    if (!photoFile) {
        alert("Please select a picture!");
        return;
    }

    // Change the button text so the user knows something is happening
    const btn = pencilForm.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Uploading...";
    btn.disabled = true;

    try {
        // 2. Upload the Image to Firebase Storage
        // We create a unique name for the file using the current time
        const storageRef = ref(storage, 'pencil-images/' + Date.now() + '-' + photoFile.name);
        const snapshot = await uploadBytes(storageRef, photoFile);
        
        // Get the internet URL for that image
        const imageUrl = await getDownloadURL(snapshot.ref);

        // 3. Save the Text Data to Firestore Database
        await addDoc(collection(db, "pencils"), {
            finderName: name,
            trackingNumber: tracking,
            location: loc,
            length: len,
            imageUrl: imageUrl,
            timestamp: serverTimestamp() // Helps us sort by newest
        });

        alert("Pencil Logged Successfully!");
        pencilForm.reset(); // Clear the form
        loadPencils(); // Refresh the gallery immediately

    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Error uploading: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

// --- FUNCTION 2: LOAD AND DISPLAY PENCILS ---
async function loadPencils() {
    gallery.innerHTML = ""; // Clear current list so we don't have duplicates

    // Ask database for pencils, sorted by newest first
    const q = query(collection(db, "pencils"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Create the HTML card for this pencil
        const card = document.createElement('div');
        card.className = 'pencil-card';
        
        card.innerHTML = `
            <img src="${data.imageUrl}" alt="Found Pencil" loading="lazy">
            <h3>Ref: ${data.trackingNumber}</h3>
            <p><strong>Found by:</strong> ${data.finderName}</p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p><strong>Length:</strong> ${data.length} cm</p>
        `;
        
        gallery.appendChild(card);
    });
}

// Load the pencils as soon as the page opens
loadPencils();
