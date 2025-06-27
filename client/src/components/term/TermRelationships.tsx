import { Link } from "wouter";
import { Lightbulb } from "lucide-react";
import { ITerm } from "@/interfaces/interfaces";

interface TermRelationshipsProps {
  relationships: ITerm[];
}

export default function TermRelationships({ relationships }: TermRelationshipsProps) {
  if (!relationships || relationships.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No related terms found</p>
      </div>
    );
  }

  const relationshipTypes = ['prerequisite', 'related', 'extends', 'alternative'];

  return (
    <div className="space-y-6">
      {relationshipTypes.map(relType => {
        const relatedTerms = relationships.filter((rel: any) => rel.relationshipType === relType);
        if (relatedTerms.length === 0) return null;

        return (
          <div key={relType}>
            <h3 className="text-lg font-semibold mb-3 capitalize">
              {relType === 'prerequisite' ? 'Prerequisites' : 
               relType === 'extends' ? 'Extends' :
               relType === 'alternative' ? 'Alternatives' : 'Related Terms'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedTerms.map((rel: any) => (
                <div key={rel.id} className="p-4 border rounded-lg">
                  <Link href={`/term/${rel.toTerm?.id || rel.toTermId || rel.id}`}>
                    <a className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                      {rel.toTerm?.name || rel.name || 'Unknown Term'}
                    </a>
                  </Link>
                  {rel.strength && (
                    <div className="text-sm text-gray-500 mt-1">
                      Strength: {rel.strength}/10
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}