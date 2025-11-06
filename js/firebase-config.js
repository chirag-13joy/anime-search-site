// ⚠️ REPLACE THIS WITH YOUR FIREBASE CONFIG
// Get it from: Firebase Console → Project Settings → Your Apps → Web App

const firebaseConfig = {
  apiKey: "AIzaSyBC6kpyUrj00y7iMtN9xncQ1dharectwi0",
  authDomain: "anime-community-dea21.firebaseapp.com",
  projectId: "anime-community-dea21",
  storageBucket: "anime-community-dea21.firebasestorage.app",
  messagingSenderId: "622986348267",
  appId: "1:622986348267:web:57672bfa8b6561c99d20ae",
  measurementId: "G-9MFFL1SF2M"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  
  console.log('✅ Firebase initialized successfully!');
  
  auth.onAuthStateChanged((user) => {
    if (user) {
      updateUIForLoggedInUser(user);
    } else {
      updateUIForLoggedOutUser();
    }
  });
} else {
  console.warn('⚠️ Firebase SDK not loaded');
}

function updateUIForLoggedInUser(user) {
  const loginBtn = document.getElementById('loginBtn');
  const userSection = document.getElementById('userSection');
  
  if (loginBtn) loginBtn.classList.add('hidden');
  if (userSection) userSection.classList.remove('hidden');
  
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  
  if (userName) userName.textContent = user.displayName || 'User';
  if (userEmail) userEmail.textContent = user.email;
  
  const profileSection = document.getElementById('profile');
  if (profileSection && profileSection.classList.contains('active')) {
    loadUserProfile(user);
  }
}

function updateUIForLoggedOutUser() {
  const loginBtn = document.getElementById('loginBtn');
  const userSection = document.getElementById('userSection');
  
  if (loginBtn) loginBtn.classList.remove('hidden');
  if (userSection) userSection.classList.add('hidden');
}

function loadUserProfile(user) {
  document.getElementById('profileName').textContent = user.displayName || 'User';
  document.getElementById('profileEmail').textContent = user.email;
  
  const joinDate = new Date(user.metadata.creationTime);
  document.getElementById('profileJoined').textContent = joinDate.toLocaleDateString();
  
  if (window.firebaseDb) {
    loadUserStats(user.uid);
  }
}

async function loadUserStats(userId) {
  if (!window.firebaseDb) return;
  
  try {
    const watchlistSnapshot = await db.collection('watchlist').where('userId', '==', userId).get();
    document.getElementById('statWatchlist').textContent = watchlistSnapshot.size;
    
    const reviewsSnapshot = await db.collection('reviews').where('userId', '==', userId).get();
    document.getElementById('statReviews').textContent = reviewsSnapshot.size;
    
    document.getElementById('statLikes').textContent = '0';
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}
