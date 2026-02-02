import { User as FirebaseUser } from 'firebase/auth';
import { User, LoginInput, RegisterInput } from '@/types';

export interface IAuthService {
  register(input: RegisterInput): Promise<User>;
  login(input: LoginInput): Promise<User>;
  loginWithGoogle(): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  sendPasswordResetEmail(email: string): Promise<void>;
  updateProfile(data: { displayName?: string; photoURL?: string }): Promise<void>;
  deleteAccount(): Promise<void>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

export const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): Partial<User> => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
};
