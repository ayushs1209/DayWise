"use client";

import type React from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context'; // Import useAuth hook

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { user } = useAuth(); // Get user from context

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onOpenChange(false); // Close modal on successful sign-in
    } catch (error) {
      console.error('Error signing in with Google:', error);
      // Optionally show an error toast to the user
    }
  };

   const handleSignOut = async () => {
    try {
      await signOut(auth);
      onOpenChange(false); // Close modal on sign-out
    } catch (error) {
      console.error('Error signing out:', error);
      // Optionally show an error toast
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-md border border-border/60 shadow-xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{user ? 'Account' : 'Sign In / Sign Up'}</DialogTitle>
          <DialogDescription>
            {user ? `Signed in as ${user.displayName || user.email}` : 'Sign in to save and manage your tasks.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
           {user ? (
             <Button onClick={handleSignOut} variant="destructive" className="w-full">
               <LogOut className="mr-2 h-4 w-4" /> Sign Out
             </Button>
           ) : (
             <Button onClick={handleGoogleSignIn} variant="gradient" className="w-full">
                <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
             </Button>
           )}
        </div>
         {/* DialogFooter is optional here, could add a Close button if needed */}
         {/* <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Close
            </Button>
         </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
