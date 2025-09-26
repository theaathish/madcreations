import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration (same as your main app)
const firebaseConfig = {
  apiKey: "AIzaSyBJbh1YHqZDR3vdn-INbjQNYeEai0WTuXg",
  authDomain: "madcreations-229e8.firebaseapp.com",
  projectId: "madcreations-229e8",
  storageBucket: "madcreations-229e8.firebasestorage.app",
  messagingSenderId: "555966587799",
  appId: "1:555966587799:web:786aa5bbead1f1ae86dad2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials
const ADMIN_EMAIL = 'admin@madcreations.com';
const ADMIN_PASSWORD = 'MadCreations@2024';
const ADMIN_NAME = 'Mad Creations Admin';

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Try to create the admin user
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    
    // Create admin profile in Firestore
    const adminProfile = {
      uid: user.uid,
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      role: 'admin',
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      phoneNumber: '+91-9999999999',
      address: 'Mad Creations HQ',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    };
    
    await setDoc(doc(db, 'users', user.uid), adminProfile);
    console.log('✅ Admin profile created in Firestore');
    
    // Also create an admin record in a separate collection
    await setDoc(doc(db, 'admins', user.uid), {
      uid: user.uid,
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      permissions: ['all'],
      createdAt: new Date()
    });
    console.log('✅ Admin record created in admins collection');
    
    console.log('\n🎉 Admin setup complete!');
    console.log('📋 Login Credentials:');
    console.log('   Email: admin@madcreations.com');
    console.log('   Password: MadCreations@2024');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin user already exists, trying to sign in...');
      try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Admin user verified successfully!');
        console.log('📋 Login Credentials:');
        console.log('   Email: admin@madcreations.com');
        console.log('   Password: MadCreations@2024');
      } catch (signInError) {
        console.error('❌ Error signing in with existing admin:', signInError.message);
      }
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
  }
}

// Run the script
createAdminUser().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
