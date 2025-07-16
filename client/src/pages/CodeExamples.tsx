import {
  CheckCircle,
  Code,
  Copy,
  ExternalLink,
  Play,
  Search,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Link } from 'wouter';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../hooks/useAuth';

interface CodeExample {
  id: string;
  term_id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  expected_output: string;
  libraries: any;
  difficulty_level: string;
  example_type: string;
  is_runnable: boolean;
  external_url: string;
  is_verified: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  term?: {
    name: string;
    shortDefinition: string;
  };
}

const CodeExamples: React.FC = () => {
  const { user } = useAuth();
  const [examples, setExamples] = useState<CodeExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCodeExamples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCodeExamples = async () => {
    try {
      const params = new URLSearchParams();
      if (languageFilter !== 'all') {params.append('language', languageFilter);}
      if (difficultyFilter !== 'all') {params.append('difficulty', difficultyFilter);}
      if (typeFilter !== 'all') {params.append('type', typeFilter);}

      const response = await fetch(`/api/code-examples?${params}`);
      if (!response.ok) {throw new Error('Failed to fetch code examples');}
      const data = await response.json();
      setExamples(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load code examples');
    } finally {
      setLoading(false);
    }
  };

  const voteOnExample = async (exampleId: string, vote: 'up' | 'down') => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      const response = await fetch(`/api/code-examples/${exampleId}/vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote }),
      });

      if (!response.ok) {throw new Error('Failed to vote');}

      // Update local state
      setExamples(
        examples.map(example =>
          example.id === exampleId
            ? {
                ...example,
                upvotes: vote === 'up' ? example.upvotes + 1 : example.upvotes,
                downvotes: vote === 'down' ? example.downvotes + 1 : example.downvotes,
              }
            : example
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to vote');
    }
  };

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const runExample = async (exampleId: string) => {
    if (!user) {
      alert('Please sign in to run examples');
      return;
    }

    try {
      const response = await fetch(`/api/code-examples/${exampleId}/run`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          execution_time: Math.random() * 1000, // Simulated execution time
          success: true,
          output: 'Example output (simulated)',
        }),
      });

      if (!response.ok) {throw new Error('Failed to run example');}

      alert('Code executed successfully! (This is a simulation)');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to run example');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case 'python':
        return '🐍';
      case 'javascript':
        return '🟨';
      case 'typescript':
        return '🔷';
      case 'r':
        return '📊';
      case 'sql':
        return '🗄️';
      case 'java':
        return '☕';
      case 'cpp':
      case 'c++':
        return '⚡';
      default:
        return '📝';
    }
  };

  const filteredExamples = examples.filter(example => {
    const matchesSearch =
      example.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      example.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      example.term?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const languages = [...new Set(examples.map(e => e.language))];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const types = ['implementation', 'visualization', 'exercise'];

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading code examples...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Code Examples</h1>
        <p className="text-gray-600 mb-6">
          Practical code implementations and examples for AI/ML concepts
        </p>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search code examples..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={languageFilter}
              onChange={e => setLanguageFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>
                  {getLanguageIcon(lang)} {lang}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Difficulties</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Examples Grid */}
      <div className="space-y-6">
        {filteredExamples.map(example => (
          <Card key={example.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{example.title}</CardTitle>
                    {example.is_verified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{example.description}</p>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {getLanguageIcon(example.language)} {example.language}
                    </Badge>
                    <Badge className={getDifficultyColor(example.difficulty_level)}>
                      {example.difficulty_level}
                    </Badge>
                    <Badge variant="outline">{example.example_type}</Badge>
                    {example.term && (
                      <Link to={`/terms/${example.term_id}`}>
                        <Badge variant="outline" className="hover:bg-blue-50">
                          {example.term.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => voteOnExample(example.id, 'up')}
                    disabled={!user}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {example.upvotes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => voteOnExample(example.id, 'down')}
                    disabled={!user}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    {example.downvotes}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="output">Expected Output</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="mt-4">
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(example.code, example.id)}
                      >
                        {copiedId === example.id ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <SyntaxHighlighter
                      language={example.language}
                      style={tomorrow}
                      className="rounded-lg"
                      customStyle={{ margin: 0, padding: '1rem' }}
                    >
                      {example.code}
                    </SyntaxHighlighter>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {example.is_runnable && (
                      <Button
                        onClick={() => runExample(example.id)}
                        disabled={!user}
                        className="flex items-center"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {user ? 'Run Code' : 'Sign In to Run'}
                      </Button>
                    )}
                    {example.external_url && (
                      <Button variant="outline" asChild>
                        <a href={example.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in {example.external_url.includes('colab') ? 'Colab' : 'External'}
                        </a>
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="output" className="mt-4">
                  {example.expected_output ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{example.expected_output}</pre>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No expected output provided</div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="mt-4">
                  <div className="space-y-4">
                    {example.libraries && Object.keys(example.libraries).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Required Libraries:</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(example.libraries as Record<string, string>).map(
                            ([lib, version]) => (
                              <Badge key={lib} variant="outline">
                                {lib} {version && `v${version}`}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Created: {new Date(example.created_at).toLocaleDateString()}
                      {example.updated_at !== example.created_at && (
                        <span> • Updated: {new Date(example.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExamples.length === 0 && (
        <div className="text-center py-12">
          <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No code examples found</h3>
          <p className="text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms or filters'
              : 'Code examples are coming soon!'}
          </p>
        </div>
      )}

      {!user && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Sign in for full access</h3>
          <p className="text-gray-600 mb-4">
            Create an account to run code examples, vote, and access premium features
          </p>
          <Button>Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default CodeExamples;
