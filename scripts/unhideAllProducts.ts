/**
 * Script to unhide all products in Firebase
 * This will set hidden=false for all products in the database
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase configuration (same as in your firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBaXSromânia_YOUR_API_KEY", // Replace with your actual config
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function unhideAllProducts() {
  try {
    console.log('🔍 Fetching all products...');
    const productsRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsRef);
    
    console.log(`📦 Found ${querySnapshot.size} total products`);
    
    let hiddenCount = 0;
    let updatedCount = 0;
    
    // Update all products to set hidden=false
    const updatePromises = querySnapshot.docs.map(async (productDoc) => {
      const productData = productDoc.data();
      
      if (productData.hidden === true) {
        hiddenCount++;
        console.log(`🔓 Unhiding: ${productData.name}`);
        
        await updateDoc(doc(db, 'products', productDoc.id), {
          hidden: false
        });
        
        updatedCount++;
      }
    });
    
    await Promise.all(updatePromises);
    
    console.log('\n✅ COMPLETE!');
    console.log(`📊 Total products: ${querySnapshot.size}`);
    console.log(`🔓 Previously hidden: ${hiddenCount}`);
    console.log(`✏️ Updated: ${updatedCount}`);
    console.log(`👁️ All products are now visible!`);
    
  } catch (error) {
    console.error('❌ Error unhiding products:', error);
  }
}

// Run the script
unhideAllProducts();
