
"use client";

import type React from 'react';
import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth'; // Import signInAnonymously
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, LogOut, Loader2, User as UserIcon, Ghost } from 'lucide-react'; // Added Ghost icon
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const authFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
});

type AuthFormValues = z.infer<typeof authFormSchema>;

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { user } = useAuth(); // Get user from context
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, provider);
      onOpenChange(false); // Close modal on successful sign-in
      toast({ title: 'Signed In', description: 'Successfully signed in with Google.' });
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({ title: 'Sign In Error', description: error.message || 'Failed to sign in with Google.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

   const handleGuestSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInAnonymously(auth);
      onOpenChange(false); // Close modal on successful guest sign-in
      toast({ title: 'Signed In as Guest', description: 'You are now browsing as a guest.' });
    } catch (error: any) {
      console.error('Error signing in anonymously:', error);
      toast({ title: 'Guest Sign In Error', description: error.message || 'Failed to sign in as guest.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleEmailPasswordSubmit = async (values: AuthFormValues) => {
    setIsSubmitting(true);
    try {
      if (activeTab === 'signin') {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        onOpenChange(false);
        toast({ title: 'Signed In', description: 'Successfully signed in.' });
      } else {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
        onOpenChange(false);
        toast({ title: 'Signed Up', description: 'Account created successfully.' });
      }
      form.reset(); // Clear form on success
    } catch (error: any) {
      console.error(`Error during ${activeTab}:`, error);
       // Provide more specific Firebase error messages
      let errorMessage = `Failed to ${activeTab === 'signin' ? 'sign in' : 'sign up'}. Please try again.`;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else if (error.code === 'auth/invalid-credential') { // Updated error code for Firebase v9+
          errorMessage = 'Invalid email or password.';
      } else if (error.code) {
        errorMessage = error.message; // Use Firebase's message if available
      }
      toast({ title: `${activeTab === 'signin' ? 'Sign In' : 'Sign Up'} Error`, description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
     setIsSubmitting(true);
    try {
      await signOut(auth);
      onOpenChange(false); // Close modal on sign-out
      toast({ title: 'Signed Out', description: 'You have been signed out.' });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({ title: 'Sign Out Error', description: error.message || 'Failed to sign out.', variant: 'destructive' });
    } finally {
       setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-md border border-border/60 shadow-xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{user ? (user.isAnonymous ? 'Guest Account' : 'Account') : 'Sign In / Sign Up'}</DialogTitle>
          <DialogDescription>
            {user ? (user.isAnonymous ? 'You are currently browsing as a guest. Your tasks are stored locally.' : `Signed in as ${user.displayName || user.email}`) : 'Sign in, sign up, or continue as a guest.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {user ? (
            <Button onClick={handleSignOut} variant="destructive" className="w-full" disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Sign Out {user.isAnonymous ? '(Guest)' : ''}
            </Button>
          ) : (
             <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleEmailPasswordSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                            Sign In
                        </Button>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="signup">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleEmailPasswordSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Create a password (min 6 chars)" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Sign Up
                        </Button>
                        </form>
                    </Form>
                </TabsContent>
                </Tabs>

                <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
                </div>

                <div className="space-y-2">
                    <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={isSubmitting}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                        Sign In with Google
                    </Button>
                    <Button onClick={handleGuestSignIn} variant="secondary" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ghost className="mr-2 h-4 w-4" />}
                        Continue as Guest
                    </Button>
                </div>
            </>
          )}
        </div>
         <DialogFooter>
             {/* Optionally add a close button if not relying on overlay click */}
            {/* <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Close
            </Button> */}
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for UserPlus icon if needed
const UserPlus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>
);
