// Script to populate Firebase with initial data
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

const initialProducts = [
  // Posters
  {
    id: '1',
    name: 'Naruto Uzumaki Epic Poster',
    description: 'High-quality anime poster featuring Naruto in his signature pose',
    price: 299,
    originalPrice: 399,
    images: ['https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg'],
    category: 'poster',
    subcategory: 'Anime',
    size: 'A4',
    theme: 'Naruto',
    inStock: true,
    featured: true,
    ratings: 4.8,
    reviewCount: 124,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Marvel Avengers A3 Poster',
    description: 'Large format poster featuring all Avengers heroes',
    price: 499,
    images: ['https://images.pexels.com/photos/6069112/pexels-photo-6069112.jpeg'],
    category: 'poster',
    subcategory: 'Movie',
    size: 'A3',
    theme: 'Marvel',
    inStock: true,
    featured: true,
    ratings: 4.9,
    reviewCount: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'BTS Group A5 Poster',
    description: 'Official BTS group poster, perfect for K-pop fans',
    price: 199,
    images: ['https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'],
    category: 'poster',
    subcategory: 'Celebrity',
    size: 'A5',
    theme: 'K-Pop',
    inStock: true,
    featured: false,
    ratings: 4.7,
    reviewCount: 156,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Motivational Quote Poster',
    description: 'Inspiring quote poster for your workspace',
    price: 149,
    images: ['https://images.pexels.com/photos/1509428/pexels-photo-1509428.jpeg'],
    category: 'poster',
    subcategory: 'Motivational',
    size: 'A4',
    theme: 'Quotes',
    inStock: true,
    featured: false,
    ratings: 4.5,
    reviewCount: 78,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Polaroids
  {
    id: '5',
    name: 'Anime Character Polaroid Set',
    description: 'Collection of 20 anime character polaroids',
    price: 199,
    images: ['https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg'],
    category: 'polaroid',
    subcategory: 'Anime',
    theme: 'Mixed Anime',
    inStock: true,
    featured: true,
    ratings: 4.6,
    reviewCount: 203,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    name: 'Celebrity Polaroid Pack',
    description: 'Set of 15 celebrity polaroids from movies and music',
    price: 149,
    images: ['https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg'],
    category: 'polaroid',
    subcategory: 'Celebrity',
    theme: 'Hollywood',
    inStock: true,
    featured: false,
    ratings: 4.4,
    reviewCount: 91,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Bundles
  {
    id: '7',
    name: 'Ultimate Anime Bundle',
    description: '10 A4 posters + 20 polaroids anime collection',
    price: 999,
    originalPrice: 1299,
    images: ['https://images.pexels.com/photos/6291574/pexels-photo-6291574.jpeg'],
    category: 'bundle',
    subcategory: 'Anime Pack',
    theme: 'Anime',
    inStock: true,
    featured: true,
    ratings: 4.9,
    reviewCount: 67,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '8',
    name: 'Movie Poster Mega Pack',
    description: '30 mixed size movie posters from various genres',
    price: 1499,
    images: ['https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg'],
    category: 'bundle',
    subcategory: 'Movie Pack',
    theme: 'Movies',
    inStock: true,
    featured: false,
    ratings: 4.7,
    reviewCount: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Customizables
  {
    id: '9',
    name: 'Custom Photo Poster',
    description: 'Upload your photo and create a personalized poster',
    price: 399,
    images: ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg'],
    category: 'customizable',
    subcategory: 'Custom Poster',
    theme: 'Personal',
    inStock: true,
    featured: true,
    ratings: 4.8,
    reviewCount: 234,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '10',
    name: 'Spotify Frame Polaroid',
    description: 'Custom polaroid with Spotify-style music player frame',
    price: 199,
    images: ['https://images.pexels.com/photos/744780/pexels-photo-744780.jpeg'],
    category: 'customizable',
    subcategory: 'Custom Polaroid',
    theme: 'Spotify',
    inStock: true,
    featured: true,
    ratings: 4.9,
    reviewCount: 312,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const populateFirebaseWithInitialData = async () => {
  try {
    console.log('Starting to populate Firebase with initial data...');

    for (const product of initialProducts) {
      const { id, ...productData } = product; // Remove the id field as Firestore will generate it

      await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: new Date(productData.createdAt),
        updatedAt: new Date(productData.updatedAt),
      });

      console.log(`Added product: ${product.name}`);
    }

    console.log('Successfully populated Firebase with initial data!');
  } catch (error) {
    console.error('Error populating Firebase:', error);
    throw error;
  }
};

// Uncomment the line below to run the population script
// populateFirebaseWithInitialData();
