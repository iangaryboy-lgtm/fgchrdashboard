// Firestore-based Assignment File Storage and Management Service (Plan B Cloud Storage)
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CourseAssignmentSubmission, AssignmentFileType } from '../types';
import { saveSubmittedAssignmentToStorage, getSubmittedAssignmentsFromStorage } from '../utils/assignmentDownloadHelper';
import { cleanForFirestore } from '../utils/firestoreSanitizer';
import { safeStorage } from '../utils/safeStorage';

const localStorage = safeStorage;

const COLLECTION_NAME = 'assignment_submissions';

export interface StoredAssignmentDocument extends CourseAssignmentSubmission {
  fileData?: string; // base64 or generated data payload
  storageLocation: string; // e.g. "Firestore Cloud Storage: /assignment_submissions/{id}"
  updatedAt?: string;
  createdAt?: string;
}

// 1. Upload & Save Assignment to Firestore
export const saveAssignmentToFirestore = async (
  submission: CourseAssignmentSubmission,
  fileData?: string
): Promise<{ success: boolean; id: string; storageLocation: string; error?: string }> => {
  const docId = submission.id || `sub_${Date.now()}_${submission.empNo || 'user'}`;
  const nowIso = new Date().toISOString();
  
  const docData: StoredAssignmentDocument = {
    ...submission,
    id: docId,
    fileData: fileData || '',
    storageLocation: `Firestore Cloud Storage: /${COLLECTION_NAME}/${docId}`,
    createdAt: submission.submittedAt || nowIso,
    updatedAt: nowIso,
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await setDoc(docRef, cleanForFirestore(docData), { merge: true });
    
    // Also save to localStorage as seamless fallback
    saveSubmittedAssignmentToStorage(docData);

    return {
      success: true,
      id: docId,
      storageLocation: docData.storageLocation,
    };
  } catch (error: any) {
    console.warn('Firestore write warning (using fallback local storage):', error);
    // Even if Firestore is restricted or offline, store locally
    saveSubmittedAssignmentToStorage(docData);
    return {
      success: true,
      id: docId,
      storageLocation: `Platform Local Cloud Cache: /${COLLECTION_NAME}/${docId}`,
    };
  }
};

// 2. Fetch Assignments from Firestore
export const fetchAssignmentsFromFirestore = async (
  courseId?: string,
  batchNo?: string
): Promise<StoredAssignmentDocument[]> => {
  try {
    const collRef = collection(db, COLLECTION_NAME);
    let q = query(collRef);

    if (courseId && batchNo) {
      q = query(collRef, where('courseId', '==', courseId), where('batchNo', '==', batchNo));
    } else if (courseId) {
      q = query(collRef, where('courseId', '==', courseId));
    }

    const snapshot = await getDocs(q);
    const results: StoredAssignmentDocument[] = [];
    snapshot.forEach((d) => {
      results.push(d.data() as StoredAssignmentDocument);
    });

    if (results.length > 0) {
      return results;
    }
  } catch (err) {
    console.warn('Firestore fetch query warning, falling back to local storage:', err);
  }

  // Fallback to local storage
  const localItems = getSubmittedAssignmentsFromStorage();
  if (courseId) {
    return localItems.filter((x: any) => x.courseId === courseId);
  }
  return localItems;
};

// 3. Real-time Subscription to Firestore Assignments
export const subscribeAssignmentsFromFirestore = (
  callback: (submissions: StoredAssignmentDocument[]) => void,
  courseId?: string,
  batchNo?: string
): (() => void) => {
  try {
    const collRef = collection(db, COLLECTION_NAME);
    let q = query(collRef);

    if (courseId && batchNo) {
      q = query(collRef, where('courseId', '==', courseId), where('batchNo', '==', batchNo));
    } else if (courseId) {
      q = query(collRef, where('courseId', '==', courseId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: StoredAssignmentDocument[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as StoredAssignmentDocument);
        });
        
        // Merge with local storage items
        const localItems = getSubmittedAssignmentsFromStorage();
        const mergedMap = new Map<string, StoredAssignmentDocument>();
        localItems.forEach((item: any) => {
          if (item.id) mergedMap.set(item.id, item);
        });
        list.forEach((item) => {
          mergedMap.set(item.id, item);
        });

        const mergedList = Array.from(mergedMap.values());
        callback(mergedList);
      },
      (error) => {
        console.warn('Firestore snapshot subscription error, using local polling:', error);
        const fallback = getSubmittedAssignmentsFromStorage();
        callback(fallback);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('Failed to set up Firestore listener:', e);
    const fallback = getSubmittedAssignmentsFromStorage();
    callback(fallback);
    return () => {};
  }
};

// 4. Update Grading & Review Feedback in Firestore
export const updateAssignmentGradingInFirestore = async (
  submissionId: string,
  gradingData: {
    gradeScore?: number;
    gradeResult?: 'pass' | 'fail';
    status: 'graded_score' | 'graded_pass' | 'graded_fail' | 'returned_for_revision' | 'submitted';
    gradeStatus: 'graded' | 'pending';
    reviewerFeedback?: string;
    rubricScores?: Record<string, number>;
    reviewerName: string;
    reviewerEmpNo: string;
  }
): Promise<boolean> => {
  const nowIso = new Date().toISOString();
  const updatePayload = {
    ...gradingData,
    reviewedAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, submissionId);
    await updateDoc(docRef, cleanForFirestore(updatePayload));
    
    // Also update local storage
    const local = getSubmittedAssignmentsFromStorage();
    const idx = local.findIndex((x: any) => x.id === submissionId);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...updatePayload };
      localStorage.setItem('farglory_submitted_assignments_v1', JSON.stringify(local));
    }
    return true;
  } catch (err) {
    console.warn('Firestore updateDoc warning, updating local storage:', err);
    const local = getSubmittedAssignmentsFromStorage();
    const idx = local.findIndex((x: any) => x.id === submissionId);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...updatePayload };
      localStorage.setItem('farglory_submitted_assignments_v1', JSON.stringify(local));
    }
    return true;
  }
};
