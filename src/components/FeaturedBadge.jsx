import { Star } from 'lucide-react';

export default function FeaturedBadge() {
  return (
    <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 z-10 shadow-md">
      <Star className="w-3 h-3 fill-current" />
      Featured
    </div>
  );
}
