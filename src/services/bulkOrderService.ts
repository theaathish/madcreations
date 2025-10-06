import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

export interface BulkOrderEnquiry {
  id?: string;
  name: string;
  email: string;
  phone: string;
  quantity: string;
  message: string;
  productType: 'poster' | 'polaroid' | 'other';
  status: 'new' | 'contacted' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const bulkOrdersRef = collection(db, 'bulkOrderEnquiries');

export const bulkOrderService = {
  // Create a new bulk order enquiry
  async createEnquiry(enquiry: Omit<BulkOrderEnquiry, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(bulkOrdersRef, {
        ...enquiry,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating bulk order enquiry:', error);
      throw new Error('Failed to submit enquiry. Please try again.');
    }
  },

  // Get all bulk order enquiries
  async getAllEnquiries(): Promise<BulkOrderEnquiry[]> {
    try {
      const querySnapshot = await getDocs(bulkOrdersRef);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as BulkOrderEnquiry));
    } catch (error) {
      console.error('Error fetching bulk order enquiries:', error);
      throw new Error('Failed to fetch enquiries. Please try again.');
    }
  },

  async updateEnquiryStatus(id: string, status: BulkOrderEnquiry['status']): Promise<void> {
    try {
      const enquiryRef = doc(db, 'bulkOrderEnquiries', id);
      await updateDoc(enquiryRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      throw new Error('Failed to update enquiry status. Please try again.');
    }
  },

  // Delete a bulk order enquiry
  async deleteEnquiry(id: string): Promise<void> {
    try {
      const enquiryRef = doc(db, 'bulkOrderEnquiries', id);
      await deleteDoc(enquiryRef);
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      throw new Error('Failed to delete enquiry. Please try again.');
    }
  },
};
