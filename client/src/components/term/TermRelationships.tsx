import { Link } from "wouter";
import { Lightbulb, ArrowRight, Book, Plus, Repeat, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ITerm } from "@/interfaces/interfaces";

interface TermRelationshipsProps {
  relationships: ITerm[];
}

export default function TermRelationships({ relationships }: TermRelationshipsProps) {
  if (!relationships || relationships.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Related Terms Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            This term doesn't have any established relationships yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const relationshipTypes = [
    { 
      key: 'prerequisite', 
      title: 'Prerequisites', 
      description: 'Terms you should understand first',
      icon: Book,
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    },
    { 
      key: 'related', 
      title: 'Related Terms', 
      description: 'Conceptually connected terms',
      icon: GitBranch,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    },
    { 
      key: 'extends', 
      title: 'Advanced Topics', 
      description: 'Terms that build upon this concept',
      icon: Plus,
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    },
    { 
      key: 'alternative', 
      title: 'Alternatives', 
      description: 'Similar or competing approaches',
      icon: Repeat,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    }
  ];

  const getStrengthBadge = (strength: number) => {
    if (strength >= 8) return { variant: 'default', text: 'Strong' };
    if (strength >= 6) return { variant: 'secondary', text: 'Moderate' };
    return { variant: 'outline', text: 'Weak' };
  };

  return (
    <div className="space-y-6">
      {relationshipTypes.map(relType => {
        const relatedTerms = relationships.filter((rel: any) => rel.relationshipType === relType.key);
        if (relatedTerms.length === 0) return null;

        const IconComponent = relType.icon;

        return (
          <Card key={relType.key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${relType.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{relType.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    {relType.description}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {relatedTerms.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedTerms.map((rel: any) => (
                  <Card key={rel.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Link href={`/term/${rel.toTerm?.id || rel.toTermId || rel.id}`}>
                          <span className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer group-hover:underline">
                            {rel.toTerm?.name || rel.name || 'Unknown Term'}
                          </span>
                        </Link>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      
                      {(rel.toTerm?.shortDefinition || rel.shortDefinition) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {rel.toTerm?.shortDefinition || rel.shortDefinition}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {rel.strength && (
                          <Badge 
                            variant={getStrengthBadge(rel.strength).variant as any}
                            className="text-xs"
                          >
                            {getStrengthBadge(rel.strength).text}
                          </Badge>
                        )}
                        
                        {(rel.toTerm?.category || rel.category) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {rel.toTerm?.category || rel.category}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}