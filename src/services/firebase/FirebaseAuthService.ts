import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { IAuthService } from '@/services/interfaces/IAuthService';
import { User, LoginInput, RegisterInput } from '@/types';

export class FirebaseAuthService implements IAuthService {
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.googleProvider = new GoogleAuthProvider();
  }
  async register(input: RegisterInput): Promise<User> {
    try {

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );

      const firebaseUser = userCredential.user;

      await firebaseUpdateProfile(firebaseUser, {
        displayName: input.displayName,
      });

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const now = serverTimestamp();

      const userData: Omit<User, 'createdAt' | 'updatedAt'> & {
        createdAt: any;
        updatedAt: any;
      } = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: input.displayName,
        photoURL: null,
        createdAt: now,
        updatedAt: now,
        stats: {
          totalPlaces: 0,
          totalPhotos: 0,
          countriesVisited: 0,
          citiesVisited: 0,
          firstTripDate: null,
          lastTripDate: null,
        },
        preferences: {
          theme: 'system',
          defaultMapView: 'roadmap',
          distanceUnit: 'km',
          dateFormat: 'DD/MM/YYYY',
          isPublicProfile: false,
          allowNotifications: true,
        },
      };

      await setDoc(userDocRef, userData);

      return userData;
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }
  async login(input: LoginInput): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );

      const user = await this.getUserData(userCredential.user.uid);
      if (!user) {
        throw new Error('User data not found');
      }

      return user;
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }
  async loginWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {

        const now = serverTimestamp();

        const userData: Omit<User, 'createdAt' | 'updatedAt'> & {
          createdAt: any;
          updatedAt: any;
        } = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: now,
          updatedAt: now,
          stats: {
            totalPlaces: 0,
            totalPhotos: 0,
            countriesVisited: 0,
            citiesVisited: 0,
            firstTripDate: null,
            lastTripDate: null,
          },
          preferences: {
            theme: 'system',
            defaultMapView: 'roadmap',
            distanceUnit: 'km',
            dateFormat: 'DD/MM/YYYY',
            isPublicProfile: false,
            allowNotifications: true,
          },
        };

        await setDoc(userDocRef, userData);
        return userData;
      }

      return userDoc.data() as User;
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    return this.getUserData(firebaseUser.uid);
  }
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }
  async updateProfile(data: {
    displayName?: string;
    photoURL?: string;
    city?: string;
    bio?: string;
  }): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }

      const authData: { displayName?: string; photoURL?: string } = {};
      if (data.displayName !== undefined) authData.displayName = data.displayName;
      if (data.photoURL !== undefined) authData.photoURL = data.photoURL;
      if (Object.keys(authData).length > 0) {
        await firebaseUpdateProfile(firebaseUser, authData);
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(
        userDocRef,
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }
  async updateEmail(newEmail: string, currentPassword: string): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('No authenticated user');
      if (!firebaseUser.email) throw new Error('No email on current user');

      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await firebaseUpdateEmail(firebaseUser, newEmail);

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, { email: newEmail, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }

  async updateSecondaryEmail(secondaryEmail: string): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('No authenticated user');

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, { secondaryEmail, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('No authenticated user');
      if (!firebaseUser.email) throw new Error('No email on current user');

      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await firebaseUpdatePassword(firebaseUser, newPassword);
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, { deleted: true, deletedAt: serverTimestamp() });

      await deleteUser(firebaseUser);
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser.uid);
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  private async getUserData(uid: string): Promise<User | null> {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }
  private handleAuthError(error: unknown): Error {
    let message = 'An error occurred during authentication';

    if (typeof error === 'object' && error !== null && 'code' in error) {
      const firebaseError = error as { code: string; message?: string };

      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          message = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          message = 'Operation not allowed';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in popup was closed';
        break;
      default:

        message = firebaseError.message || message;
      }
    } else if (error instanceof Error) {

      message = error.message;
    }

    return new Error(message);
  }
}

export const authService = new FirebaseAuthService();
