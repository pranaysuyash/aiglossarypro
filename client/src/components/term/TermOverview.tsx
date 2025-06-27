import { Badge } from "@/components/ui/badge";
import { IEnhancedTerm, ITerm } from "@/interfaces/interfaces";

interface TermOverviewProps {
  term: IEnhancedTerm | ITerm;
  isEnhanced: boolean;
}

export default function TermOverview({ term, isEnhanced }: TermOverviewProps) {
  const enhancedTerm = isEnhanced ? term as IEnhancedTerm : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Definition</h2>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {enhancedTerm?.fullDefinition || term?.definition}
        </p>
      </div>

      {/* Application domains */}
      {enhancedTerm?.applicationDomains && enhancedTerm.applicationDomains.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Application Domains</h3>
          <div className="flex flex-wrap gap-2">
            {enhancedTerm.applicationDomains.map((domain, index) => (
              <Badge key={index} variant="outline">
                {domain}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Techniques */}
      {enhancedTerm?.techniques && enhancedTerm.techniques.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Related Techniques</h3>
          <div className="flex flex-wrap gap-2">
            {enhancedTerm.techniques.map((technique, index) => (
              <Badge key={index} variant="secondary">
                {technique}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}