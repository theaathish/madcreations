import {
  collection,
  getDocs,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './src/firebase.ts';

// Sample products data
const sampleProducts = [
  {
    name: "Naruto Shippuden Poster",
    description: "High-quality Naruto Shippuden poster featuring iconic characters and scenes from the anime series.",
    price: 299,
    originalPrice: 399,
    images: ["https://via.placeholder.com/400x600?text=Naruto+Poster"],
    category: "poster",
    subcategory: "anime",
    size: "A3",
    theme: "Anime",
    inStock: true,
    featured: true,
    ratings: 4.5,
    reviewCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    name: "One Piece Wanted Poster Set",
    description: "Collection of One Piece wanted posters featuring the Straw Hat Pirates crew members.",
    price: 199,
    originalPrice: 299,
    images: ["https://via.placeholder.com/400x600?text=One+Piece+Posters"],
    category: "poster",
    subcategory: "anime",
    size: "A4",
    theme: "Anime",
    inStock: true,
    featured: false,
    ratings: 4.8,
    reviewCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    name: "Attack on Titan Wall Scroll",
    description: "Large wall scroll featuring Eren, Mikasa, and Armin from Attack on Titan series.",
    price: 499,
    originalPrice: 599,
    images: ["https://via.placeholder.com/400x600?text=AOT+Scroll"],
    category: "poster",
    subcategory: "anime",
    size: "Large",
    theme: "Anime",
    inStock: true,
    featured: true,
    ratings: 4.7,
    reviewCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    name: "Custom Photo Polaroid Set",
    description: "Create your own polaroid-style prints with your favorite photos. Perfect for memories and gifts.",
    price: 149,
    originalPrice: 199,
    images: ["https://via.placeholder.com/400x600?text=Custom+Polaroids"],
    category: "polaroid",
    subcategory: "custom",
    size: "3x4",
    theme: "Custom",
    inStock: true,
    featured: false,
    ratings: 4.2,
    reviewCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    name: "Vintage Movie Poster Bundle",
    description: "Bundle of 5 vintage-style movie posters from classic films. Perfect for cinema lovers.",
    price: 899,
    originalPrice: 1199,
    images: ["https://via.placeholder.com/400x600?text=Movie+Bundle"],
    category: "bundle",
    subcategory: "movies",
    size: "A2",
    theme: "Movies",
    inStock: true,
    featured: true,
    ratings: 4.6,
    reviewCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

async function checkAndAddProducts() {
  try {
    console.log('Checking existing products...');

    const productsRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsRef);

    if (querySnapshot.empty) {
      console.log('No products found. Adding sample products...');

      for (const product of sampleProducts) {
        await addDoc(productsRef, product);
        console.log(`Added product: ${product.name}`);
      }

      console.log('Sample products added successfully!');
    } else {
      console.log(`Found ${querySnapshot.size} existing products. No need to add sample data.`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndAddProducts();
