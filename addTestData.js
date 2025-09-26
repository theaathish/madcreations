import { collection, addDoc } from 'firebase/firestore';
import { db } from './src/firebase';

const testProducts = [
  {
    name: 'Naruto Epic Poster',
    description: 'High-quality anime poster featuring Naruto in his signature pose',
    price: 299,
    originalPrice: 399,
    images: ['https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg?auto=compress&cs=tinysrgb&w=400'],
    category: 'poster',
    subcategory: 'Anime',
    size: 'A4',
    theme: 'Naruto',
    inStock: true,
    featured: true,
    ratings: 4.8,
    reviewCount: 124,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Marvel Avengers Collection',
    description: 'Large format poster featuring all Avengers heroes',
    price: 499,
    images: ['https://images.pexels.com/photos/6069112/pexels-photo-6069112.jpeg?auto=compress&cs=tinysrgb&w=400'],
    category: 'poster',
    subcategory: 'Movie',
    size: 'A3',
    theme: 'Marvel',
    inStock: true,
    featured: true,
    ratings: 4.9,
    reviewCount: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'BTS Group Poster',
    description: 'Official BTS group poster, perfect for K-pop fans',
    price: 199,
    images: ['https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400'],
    category: 'poster',
    subcategory: 'Celebrity',
    size: 'A5',
    theme: 'K-Pop',
    inStock: true,
    featured: false,
    ratings: 4.7,
    reviewCount: 156,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function addTestData() {
  try {
    const productsRef = collection(db, 'products');

    for (const product of testProducts) {
      await addDoc(productsRef, product);
      console.log(`Added product: ${product.name}`);
    }

    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

addTestData();
