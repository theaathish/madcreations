// Simple script to add a test order with custom images
import { collection, addDoc } from 'firebase/firestore';
import { db } from './src/firebase.js';

const testOrder = {
  id: 'TEST-ORDER-' + Date.now(),
  userId: 'test-user-123',
  customerName: 'Test Customer with Custom Images',
  customerEmail: 'test@example.com',
  customerPhone: '9876543210',
  items: [
    {
      product: {
        id: 'test-product-1',
        name: 'Custom Poster with Images',
        price: 350,
        images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400']
      },
      quantity: 1,
      customizations: {
        customImages: [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300',
          'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300'
        ]
      }
    }
  ],
  subtotal: 350,
  shippingCost: 50,
  total: 400,
  status: 'processing',
  orderDate: new Date().toISOString(),
  createdAt: new Date(),
  updatedAt: new Date(),
  shippingAddress: {
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456'
  },
  shippingMethod: 'standard'
};

async function addTestOrder() {
  try {
    console.log('🔄 Adding test order with custom images...');
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, testOrder);
    console.log('✅ Test order added successfully!');
    console.log('📋 Order ID:', docRef.id);
    console.log('🖼️  This order has 2 custom images that you can test downloading');
    console.log('\n📍 To test:');
    console.log('1. Go to http://localhost:5174/admin/orders');
    console.log('2. Click "Details" on the order');
    console.log('3. Look for "Custom Images:" section');
    console.log('4. Hover over images to see download button');
    console.log('5. Click download button to test functionality');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTestOrder();
