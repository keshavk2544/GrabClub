import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { heroImage } from '@/lib/data';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative w-full h-[20vh] min-h-[150px] flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          data-ai-hint={heroImage.hint}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-background/50" />
      </div>

      <div className="relative z-10 container flex flex-col items-center px-4">
        
        
        <div className="mt-8 flex w-full max-w-xl items-center space-x-2 rounded-full p-1 bg-card/50 backdrop-blur-sm border border-white/10 shadow-lg">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for food, groceries, and more..."
              className="w-full rounded-full border-none bg-transparent pl-12 h-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button type="submit" className="rounded-full h-10 px-6 bg-gradient-to-r from-primary to-accent-magenta text-primary-foreground font-bold text-sm shadow-lg transition-transform duration-300 hover:scale-105">
            Search
          </Button>
        </div>
      </div>
    </section>
  );
}
