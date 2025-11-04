// ⚠️ REPLACE THIS WITH YOUR FIREBASE CONFIG
// Get it from: Firebase Console → Project Settings → Your Apps → Web App

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && typeof firebase !== 'undefined') {
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
} else if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
  console.warn('⚠️ Please add your Firebase configuration in js/firebase-config.js');
  console.log('📝 Site will work without Firebase, but login features will be disabled');
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
