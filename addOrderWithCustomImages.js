import { collection, addDoc } from 'firebase/firestore';
import { db } from './src/firebase.ts';

const orderWithCustomImages = {
  id: 'TEST-' + Date.now(),
  userId: 'test-user-123',
  customerName: 'Test Customer',
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
          'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300'
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
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, orderWithCustomImages);
    console.log('✅ Test order added successfully!');
    console.log('Order ID:', docRef.id);
    console.log('📋 Order details:', JSON.stringify(orderWithCustomImages, null, 2));
    console.log('\n🔍 To test the download functionality:');
    console.log('1. Go to: http://localhost:5174/admin/orders');
    console.log('2. Click "Details" on the order');
    console.log('3. Look for "Custom Images:" section');
    console.log('4. Hover over images to see download button');
    console.log('5. Click download button to test');
  } catch (error) {
    console.error('❌ Error adding test order:', error);
  }
}

addTestOrder();
