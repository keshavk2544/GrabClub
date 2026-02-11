'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GrabClubLoading from '@/components/layout/loading';
import { cn } from '@/lib/utils';

const BLOCKED_USERS_STORAGE_KEY = 'grabclub-blocked-users';

const ConfettiExplosion = () => {
    const [pieces, setPieces] = useState<number[]>([]);

    useEffect(() => {
        const newPieces = Array.from({ length: 50 }, (_, i) => i);
        setPieces(newPieces);
    }, []);

    const colors = ['bg-[#ff4757]', 'bg-[#667eea]', 'bg-[#ffa502]', 'bg-[#2ed573]'];

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            {pieces.map(i => (
                <div
                    key={i}
                    className={cn("confetti-piece", colors[i % colors.length])}
                    style={{
                        left: `${Math.random() * 100}vw`,
                        animation: `confetti-fall ${Math.random() * 3 + 2}s linear ${i * 0.03}s forwards`,
                    }}
                />
            ))}
        </div>
    );
};


export default function BlockedUserGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Prank state
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoadingPremium, setIsLoadingPremium] = useState(false);


  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const storedBlockedUsers = window.localStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
      if (storedBlockedUsers) {
        const blockedUsers: string[] = JSON.parse(storedBlockedUsers);
        if (user.email && blockedUsers.includes(user.email)) {
          setIsBlocked(true);
        }
      }
    } catch (error) {
      console.error('Failed to check blocked status:', error);
    } finally {
        setIsCheckingStatus(false);
    }
    
  }, [user, isLoading, router]);

  const handleRevealTruth = () => {
    setIsLoadingPremium(true);
    setTimeout(() => {
        setIsRevealed(true);
        setIsLoadingPremium(false);
    }, 2000);
  };


  if (isLoading || isCheckingStatus) {
    return <GrabClubLoading />;
  }

  if (isBlocked) {
    return (
        <div className="flex items-center justify-center p-4 bg-[#0a0a0a] text-white overflow-hidden min-h-[calc(100vh-8rem)]">
            {isLoadingPremium && <ConfettiExplosion />}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(102,126,234,0.1)_0%,transparent_50%)] -z-10"></div>
            
            <div className={cn(
                "relative z-10 w-full max-w-xl text-center bg-[#1a1a1a] border border-[#2a2a2a] p-12 md:p-16 rounded-2xl shadow-2xl shadow-black/50",
                isRevealed && "animate-shake shadow-[0_0_50px_rgba(255,71,87,0.3)]"
            )}>
                {!isRevealed ? (
                    <div>
                        <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-[0_0_30px_rgba(102,126,234,0.3)]">👑</div>
                        <div className="text-sm font-semibold tracking-wider uppercase text-[#ff6b6b] mb-5">🔥 Breaking News 🔥</div>
                        <h1 className="text-3xl font-bold text-white mb-4">Congratulations!</h1>
                        <p className="text-lg text-[#a0a0a0] mb-8 leading-relaxed">
                            You've been selected for an exclusive promotion to our <strong className="text-[#667eea]">Premium Section</strong>! Enjoy unlimited features, priority support, and much more.
                        </p>
                        <button 
                            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold py-4 px-12 rounded-full uppercase tracking-wider shadow-[0_10px_30px_rgba(102,126,234,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(102,126,234,0.6)] active:translate-y-0 disabled:bg-[#2a2a2a] disabled:text-[#666] disabled:shadow-none"
                            onClick={handleRevealTruth}
                            disabled={isLoadingPremium}
                        >
                            {isLoadingPremium ? 'Loading Premium...' : 'Go Premium Now →'}
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <div className="text-[100px] mb-5 inline-block animate-laugh">😂</div>
                        <div className="text-4xl font-extrabold text-[#ff4757] mb-5 animate-slide-down [text-shadow:0_0_20px_rgba(255,71,87,0.5)]">
                            SIKE! YOU'RE BLOCKED! 🚫
                        </div>
                        <div className="text-xl text-[#c0c0c0] mb-8 leading-normal">
                            Did you really think you were getting premium? 😭<br />
                            <strong className="text-[#ff6b6b]">You've been permanently blocked!</strong>
                        </div>
                        <div className="flex justify-center gap-5 text-7xl my-8">
                            <span className="animate-bounce-custom">🖕</span>
                            <span className="animate-bounce-custom" style={{ animationDelay: '0.2s' }}>😂</span>
                            <span className="animate-bounce-custom" style={{ animationDelay: '0.4s' }}>🖕</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  }

  return <>{children}</>;
}
