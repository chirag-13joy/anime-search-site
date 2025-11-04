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

// Initialize Firebase (will be done after you add your config)
let auth, db;

if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
  import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js').then((firebase) => {
    const { initializeApp } = firebase;
    import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js').then((authModule) => {
      import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js').then((firestoreModule) => {
        const app = initializeApp(firebaseConfig);
        auth = authModule.getAuth(app);
        db = firestoreModule.getFirestore(app);
        
        window.firebaseAuth = auth;
        window.firebaseDb = db;
        window.firebaseAuthModule = authModule;
        window.firebaseFirestoreModule = firestoreModule;
        
        console.log('✅ Firebase initialized successfully!');
        checkAuthState();
      });
    });
  });
} else {
  console.warn('⚠️ Please add your Firebase configuration in js/firebase-config.js');
}

function checkAuthState() {
  const { onAuthStateChanged } = window.firebaseAuthModule;
  
  onAuthStateChanged(window.firebaseAuth, (user) => {
    if (user) {
      updateUIForLoggedInUser(user);
    } else {
      updateUIForLoggedOutUser();
    }
  });
}

function updateUIForLoggedInUser(user) {
  document.getElementById('loginBtn').classList.add('hidden');
  document.getElementById('userSection').classList.remove('hidden');
  document.getElementById('userName').textContent = user.displayName || 'User';
  document.getElementById('userEmail').textContent = user.email;
  
  if (document.getElementById('profile').classList.contains('active')) {
    loadUserProfile(user);
  }
}

function updateUIForLoggedOutUser() {
  document.getElementById('loginBtn').classList.remove('hidden');
  document.getElementById('userSection').classList.add('hidden');
}

function loadUserProfile(user) {
  document.getElementById('profileName').textContent = user.displayName || 'User';
  document.getElementById('profileEmail').textContent = user.email;
  
  const joinDate = new Date(user.metadata.creationTime);
  document.getElementById('profileJoined').textContent = joinDate.toLocaleDateString();
  
  loadUserStats(user.uid);
}

async function loadUserStats(userId) {
  const { collection, query, where, getDocs } = window.firebaseFirestoreModule;
  
  try {
    const watchlistRef = collection(window.firebaseDb, 'watchlist');
    const watchlistQuery = query(watchlistRef, where('userId', '==', userId));
    const watchlistSnapshot = await getDocs(watchlistQuery);
    document.getElementById('statWatchlist').textContent = watchlistSnapshot.size;
    
    const reviewsRef = collection(window.firebaseDb, 'reviews');
    const reviewsQuery = query(reviewsRef, where('userId', '==', userId));
    const reviewsSnapshot = await getDocs(reviewsQuery);
    document.getElementById('statReviews').textContent = reviewsSnapshot.size;
    
    document.getElementById('statLikes').textContent = '0';
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

export { auth, db };
