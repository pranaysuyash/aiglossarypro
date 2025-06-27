import { Link } from "wouter";
import TermCard from "@/components/TermCard";
import { ITerm } from "@/interfaces/interfaces";

interface RecommendedTermsProps {
  recommended: ITerm[];
}

export default function RecommendedTerms({ recommended }: RecommendedTermsProps) {
  if (!recommended || recommended.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recommended for You</h2>
        <Link href="/recommendations">
          <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
            See all
          </a>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommended.map((recTerm: any) => (
          <TermCard
            key={recTerm.id}
            term={recTerm}
            variant="compact"
            isFavorite={recTerm.isFavorite}
          />
        ))}
      </div>
    </div>
  );
}