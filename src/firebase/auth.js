import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "./config";
import { usersService } from "./database";
import { useState, useEffect } from "react";

// Authentication service
export const authService = {
  // Sign up with email and password
  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName });

      // Create user document in Realtime Database without encryption
      await usersService.createUser({
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        createdAt: new Date(),
      });

      return user;
    } catch (error) {
      throw error;
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Listen to authentication state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },
};

// Custom hook for authentication state
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
};
