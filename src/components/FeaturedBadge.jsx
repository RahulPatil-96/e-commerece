import { Star } from 'lucide-react';

export default function FeaturedBadge() {
  return (
    <div className="absolute top-3 left-3 bg-gradient-to-r from-accent to-[hsl(27_87%_60%)] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10 shadow-md">
      <Star className="w-3 h-3 fill-current" />
      Featured
    </div>
  );
}

