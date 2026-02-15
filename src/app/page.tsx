import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-grow flex flex-col">
      <section className="relative w-full h-[400px] md:h-[500px] bg-cover bg-center flex items-center justify-center text-center text-white" style={{backgroundImage: "url('https://picsum.photos/seed/hero/1200/500')"}} data-ai-hint="food delivery">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 p-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">Your City, Delivered</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-primary-foreground/90">Get food, groceries, and more from your favorite local stores, delivered to your door in minutes.</p>
          <div className="mt-8 max-w-xl mx-auto flex gap-2">
            <Input type="text" placeholder="What are you looking for?" className="flex-grow bg-white text-foreground" />
            <Button size="lg">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">What We Offer</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {['Food', 'Grocery', 'Fruits', 'Vegetable', 'Bakery', 'Medicine'].map(item => (
              <div key={item} className="flex flex-col items-center gap-3 p-4 rounded-lg bg-card hover:bg-accent transition-colors cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-3xl">{['🍕', '🛒', '🍓', '🥦', '🍞', '💊'][['Food', 'Grocery', 'Fruits', 'Vegetable', 'Bakery', 'Medicine'].indexOf(item)]}</span>
                </div>
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
