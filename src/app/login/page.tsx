'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  GoogleAuthProvider,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  User,
  signInWithPopup,
} from 'firebase/auth';
import { collection, doc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import GrabClubLoading from '@/components/layout/loading';
import type { Vendor, DeliveryPerson } from '@/lib/types';
import AnimatedLogo from '@/components/layout/animated-logo';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [isExpanded, setIsExpanded] = useState(false);

  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(true);

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const vendorsQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'vendors') : null
  , [firestore]);
  const { data: vendors, isLoading: vendorsLoading } = useCollection<Vendor>(vendorsQuery);

  const deliveryPeopleQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'deliveryPeople') : null
  , [firestore]);
  const { data: deliveryPeople, isLoading: deliveryPeopleLoading } = useCollection<DeliveryPerson>(deliveryPeopleQuery);


  const roles = [
    { id: 'student', name: 'Student', emoji: '🎓' },
    { id: 'vendor', name: 'Vendor', emoji: '🏪' },
    { id: 'delivery', name: 'Delivery', emoji: '🚴' },
    { id: 'admin', name: 'Admin', emoji: '⚙️' }
  ];

  // Persist login session
  useEffect(() => {
    if (!auth) return;
    setPersistence(auth, browserLocalPersistence);
  }, [auth]);

  // Handle redirect login result
  useEffect(() => {
    if (!auth || !firestore) return;

    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await handleSuccessfulLogin(result.user);
        }
      } catch (error: any) {
        handleLoginError(error);
      } finally {
        setIsProcessing(false);
      }
    };

    processRedirect();
  }, [auth, firestore]);

  // Redirect if already logged in
  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/');
    }
    // Also check for admin/vendor/delivery session
    if (sessionStorage.getItem('isAdmin') === 'true') {
        router.replace('/admin');
    }
    if (sessionStorage.getItem('isFoodVendor') === 'true') {
        router.replace('/food-dashboard');
    }
    if (sessionStorage.getItem('isGroceryVendor') === 'true') {
        router.replace('/grocery-dashboard');
    }
    if (sessionStorage.getItem('isFruitsVendor') === 'true') {
        router.replace('/fruits-dashboard');
    }
    if (sessionStorage.getItem('isVegetableVendor') === 'true') {
        router.replace('/vegetable-dashboard');
    }
     if (sessionStorage.getItem('isBakeryVendor') === 'true') {
        router.replace('/bakery-dashboard');
    }
    if (sessionStorage.getItem('isSweetsVendor') === 'true') {
        router.replace('/sweets-dashboard');
    }
    if (sessionStorage.getItem('isMedicineVendor') === 'true') {
        router.replace('/medicine-dashboard');
    }
    if (sessionStorage.getItem('isCyberVendor') === 'true') {
        router.replace('/cyber-dashboard');
    }
    if (sessionStorage.getItem('isDeliveryPerson') === 'true') {
        router.replace('/delivery-dashboard');
    }
  }, [user, isUserLoading, router]);


  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setTimeout(() => setIsExpanded(false), 300);
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);


  const handleSuccessfulLogin = (loggedInUser: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', loggedInUser.uid);

    setDocumentNonBlocking(userRef, {
      uid: loggedInUser.uid,
      displayName: loggedInUser.displayName,
      email: loggedInUser.email,
      photoURL: loggedInUser.photoURL,
    }, { merge: true });
  };

  const handleLoginError = (error: any) => {
    console.error("Login Error:", error);

    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      setIsProcessing(false);
      return; 
    }
    
    toast({
      variant: "destructive",
      title: "Sign-in Failed",
      description: error.message || "Could not sign in. Please try again.",
    });

    setIsProcessing(false);
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsProcessing(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      handleSuccessfulLogin(result.user);
    } catch (error: any) {
      handleLoginError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenericLogin = () => {
    if (selectedRole === 'admin') {
      // This is a mock login for demonstration purposes.
      if (loginId === 'kk@2544' && loginPassword === 'INAV!@19') {
        sessionStorage.setItem('isAdmin', 'true');
        router.push('/admin');
        toast({ title: 'Admin Login Successful' });
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid Credentials',
          description: 'Please check your admin user ID and password.',
        });
      }
    } else if (selectedRole === 'vendor') {
        const vendor = vendors?.find(v => v.userId === loginId && v.password === loginPassword);

        if (vendor) {
            const dashboardMap: Record<string, string> = {
                'food': '/food-dashboard',
                'grocery': '/grocery-dashboard',
                'fruits': '/fruits-dashboard',
                'vegetables': '/vegetable-dashboard',
                'bakery': '/bakery-dashboard',
                'sweets': '/sweets-dashboard',
                'medicine': '/medicine-dashboard',
                'cyber-cafe': '/cyber-dashboard'
            };
            const sessionKeyMap: Record<string, string> = {
                'food': 'isFoodVendor',
                'grocery': 'isGroceryVendor',
                'fruits': 'isFruitsVendor',
                'vegetables': 'isVegetableVendor',
                'bakery': 'isBakeryVendor',
                'sweets': 'isSweetsVendor',
                'medicine': 'isMedicineVendor',
                'cyber-cafe': 'isCyberVendor'
            };
            
            const dashboardPath = dashboardMap[vendor.category];
            const sessionKey = sessionKeyMap[vendor.category];

            if (dashboardPath && sessionKey) {
                sessionStorage.setItem(sessionKey, 'true');
                sessionStorage.setItem('vendorId', vendor.id);
                router.push(dashboardPath);
                toast({ title: 'Vendor Login Successful' });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Login Error',
                    description: 'No dashboard configured for this vendor category.',
                });
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Invalid Credentials',
                description: 'Please check your vendor user ID and password.',
            });
        }
    } else if (selectedRole === 'delivery') {
        const deliveryPerson = deliveryPeople?.find((d: any) => d.userId === loginId && d.password === loginPassword);

        if (deliveryPerson) {
            sessionStorage.setItem('isDeliveryPerson', 'true');
            sessionStorage.setItem('deliveryPersonId', deliveryPerson.id);
            router.push('/delivery-dashboard'); 
            toast({ title: 'Delivery Login Successful', description: "Welcome back!" });
        } else {
             toast({
                variant: 'destructive',
                title: 'Invalid Credentials',
                description: 'Please check your delivery user ID and password.',
            });
        }
    }
  };
  
  if (isProcessing || isUserLoading || user || vendorsLoading || deliveryPeopleLoading) {
    return <GrabClubLoading />;
  }
  
  if (!selectedRoleData) {
      // This should not happen, but as a fallback:
      return (
        <div className="flex items-center justify-center h-screen bg-black text-white">
          Error: Role not found.
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(251, 146, 60, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(251, 146, 60, 0.05) 0%, transparent 50%)
          `
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-xl">
        
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-3">
            Grab<span className="text-orange-500">Club</span>
          </h1>
          <p className="text-gray-500">Select your role to sign in</p>
        </div>

        <div className="relative mb-12">
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-3xl p-8 transition-all duration-500 shadow-2xl shadow-orange-500/30 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-5xl transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                    {selectedRoleData.emoji}
                  </span>
                </div>
                
                <div className="text-left">
                  <p className="text-sm text-white/80 mb-1">Signing in as</p>
                  <h3 className="text-3xl font-bold text-white">{selectedRoleData.name}</h3>
                </div>
              </div>

              <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>

          <div className={`absolute left-0 right-0 top-full mt-4 transition-all duration-500 ${
            isExpanded ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}>
            
            <div className="grid grid-cols-4 gap-3">
              {roles.map((role, index) => {
                const isSelected = selectedRole === role.id;
                
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`relative bg-gray-900 hover:bg-gray-800 border-2 rounded-2xl p-6 transition-all duration-300 ${
                      isSelected 
                        ? 'border-orange-500 scale-105' 
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                    style={{
                      transitionDelay: `${index * 50}ms`,
                      transform: isExpanded ? 'scale(1)' : 'scale(0.8)'
                    }}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-500/10 rounded-2xl"></div>
                    )}

                    <div className="relative flex flex-col items-center gap-3">
                      <span className="text-4xl">{role.emoji}</span>
                      <span className={`text-sm font-semibold ${isSelected ? 'text-orange-500' : 'text-gray-400'}`}>
                        {role.name}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-4 transition-all duration-500 ${
          isExpanded ? 'opacity-50 translate-y-40' : 'opacity-100 translate-y-0'
        }`}>
          
          {selectedRole === 'student' ? (
            <>
              <button onClick={handleGoogleSignIn} className="w-full flex flex-col items-center justify-center gap-2 group transition-all duration-300 hover:scale-105 active:scale-95">
                <AnimatedLogo />
                <span className="font-bold text-lg text-gray-400 group-hover:text-white transition-colors">Continue with Google</span>
                <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">Click to sign in</span>
              </button>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{selectedRoleData.name} User ID</label>
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder={`Enter your ${selectedRoleData.name.toLowerCase()} user ID`}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                   <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenericLogin}
                className="w-full group relative px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden mb-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <span className="relative flex items-center justify-center gap-2">
                  Sign In as {selectedRoleData.name}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
