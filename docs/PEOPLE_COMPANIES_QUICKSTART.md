# People & Companies Feature - Quick Start Guide

## Overview
This guide provides a rapid implementation path for adding People & Companies to AI Glossary Pro.

---

## Database Schema (Quick Version)

```sql
-- Simplified schema to get started quickly
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255),
    bio TEXT,
    image_url VARCHAR(500),
    twitter VARCHAR(100),
    linkedin VARCHAR(100),
    github VARCHAR(100),
    website VARCHAR(500),
    current_company_id UUID,
    specializations TEXT[],
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(500),
    founded_year INTEGER,
    headquarters VARCHAR(255),
    company_type VARCHAR(50), -- 'startup', 'corporation', 'research', 'academic'
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quick relationship tables
CREATE TABLE person_contributions (
    person_id UUID REFERENCES people(id),
    term_id UUID REFERENCES enhanced_terms(id),
    contribution_type VARCHAR(50), -- 'invented', 'popularized', 'researched'
    year INTEGER,
    PRIMARY KEY (person_id, term_id)
);

CREATE TABLE company_innovations (
    company_id UUID REFERENCES companies(id),
    term_id UUID REFERENCES enhanced_terms(id),
    innovation_type VARCHAR(50), -- 'developed', 'commercialized', 'open-sourced'
    year INTEGER,
    PRIMARY KEY (company_id, term_id)
);
```

---

## Quick Frontend Components

### 1. People Card Component

```tsx
// src/components/PersonCard.tsx
import { Github, Linkedin, Twitter, Globe } from 'lucide-react';

interface PersonCardProps {
  person: {
    id: string;
    name: string;
    title: string;
    bio: string;
    image_url: string;
    current_company?: string;
    specializations: string[];
    social_links?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
      website?: string;
    };
  };
}

export const PersonCard: React.FC<PersonCardProps> = ({ person }) => {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          <img 
            src={person.image_url || '/default-avatar.png'} 
            alt={person.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <CardTitle className="text-lg">{person.name}</CardTitle>
            <p className="text-sm text-gray-600">{person.title}</p>
            {person.current_company && (
              <p className="text-sm text-blue-600">{person.current_company}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 line-clamp-3 mb-3">{person.bio}</p>
        
        {person.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {person.specializations.slice(0, 3).map((spec, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex gap-3">
          {person.social_links?.twitter && (
            <a href={`https://twitter.com/${person.social_links.twitter}`} 
               target="_blank" rel="noopener noreferrer">
              <Twitter className="w-4 h-4 text-gray-600 hover:text-blue-500" />
            </a>
          )}
          {person.social_links?.github && (
            <a href={`https://github.com/${person.social_links.github}`} 
               target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4 text-gray-600 hover:text-black" />
            </a>
          )}
          {person.social_links?.linkedin && (
            <a href={`https://linkedin.com/in/${person.social_links.linkedin}`} 
               target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4 text-gray-600 hover:text-blue-700" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 2. Integration with Term Pages

```tsx
// Add to EnhancedTermDetail.tsx
const RelatedPeople: React.FC<{ termId: string }> = ({ termId }) => {
  const { data: people } = useQuery({
    queryKey: [`/api/terms/${termId}/people`],
  });

  if (!people?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Key Contributors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {people.map(person => (
            <Link key={person.id} to={`/people/${person.slug}`}>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <img 
                  src={person.image_url} 
                  className="w-10 h-10 rounded-full"
                  alt={person.name}
                />
                <div>
                  <p className="font-medium text-sm">{person.name}</p>
                  <p className="text-xs text-gray-600">{person.contribution_type}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## Sample Data for Quick Start

```javascript
// scripts/seed-people-companies.js
const notablePeople = [
  {
    name: "Geoffrey Hinton",
    slug: "geoffrey-hinton",
    title: "Godfather of Deep Learning",
    bio: "Turing Award winner known for backpropagation and deep learning breakthroughs",
    current_company: "Google (formerly)",
    specializations: ["Deep Learning", "Neural Networks", "Backpropagation"],
    contributions: [
      { term: "Backpropagation", type: "invented", year: 1986 },
      { term: "Deep Learning", type: "pioneered", year: 2006 },
      { term: "Capsule Networks", type: "invented", year: 2017 }
    ],
    social: { twitter: "geoffreyhinton" }
  },
  {
    name: "Yann LeCun",
    slug: "yann-lecun",
    title: "Chief AI Scientist at Meta",
    bio: "Pioneer in convolutional neural networks and computer vision",
    current_company: "Meta",
    specializations: ["Computer Vision", "CNNs", "Self-Supervised Learning"],
    contributions: [
      { term: "Convolutional Neural Networks", type: "invented", year: 1989 },
      { term: "LeNet", type: "created", year: 1998 }
    ],
    social: { twitter: "ylecun", github: "ylecun" }
  },
  {
    name: "Andrew Ng",
    slug: "andrew-ng",
    title: "Founder of DeepLearning.AI",
    bio: "AI educator and entrepreneur, co-founder of Coursera",
    current_company: "DeepLearning.AI",
    specializations: ["Machine Learning", "Online Education", "Deep Learning"],
    contributions: [
      { term: "Online Learning", type: "popularized", year: 2011 },
      { term: "Transfer Learning", type: "advanced", year: 2016 }
    ],
    social: { twitter: "AndrewYNg", linkedin: "andrewyng" }
  }
];

const notableCompanies = [
  {
    name: "OpenAI",
    slug: "openai",
    description: "AI research company behind GPT models and DALL-E",
    founded_year: 2015,
    headquarters: "San Francisco, CA",
    company_type: "research",
    innovations: [
      { term: "GPT", type: "developed", year: 2018 },
      { term: "DALL-E", type: "created", year: 2021 },
      { term: "ChatGPT", type: "launched", year: 2022 }
    ]
  },
  {
    name: "DeepMind",
    slug: "deepmind",
    description: "AI company known for AlphaGo and AlphaFold",
    founded_year: 2010,
    headquarters: "London, UK",
    company_type: "research",
    innovations: [
      { term: "AlphaGo", type: "created", year: 2016 },
      { term: "AlphaFold", type: "developed", year: 2020 },
      { term: "Reinforcement Learning", type: "advanced", year: 2013 }
    ]
  }
];
```

---

## Quick API Implementation

```typescript
// server/routes/people.ts
import { Router } from 'express';

const router = Router();

// Get all people with pagination
router.get('/api/people', async (req, res) => {
  const { page = 1, limit = 20, specialization, search } = req.query;
  
  const query = db
    .select()
    .from(people)
    .limit(limit)
    .offset((page - 1) * limit);
    
  if (specialization) {
    query.where(sql`${people.specializations} @> ARRAY[${specialization}]`);
  }
  
  if (search) {
    query.where(sql`${people.name} ILIKE ${`%${search}%`}`);
  }
  
  const results = await query;
  res.json({ success: true, data: results });
});

// Get person details with contributions
router.get('/api/people/:slug', async (req, res) => {
  const person = await db
    .select()
    .from(people)
    .where(eq(people.slug, req.params.slug))
    .leftJoin(person_contributions, eq(people.id, person_contributions.person_id))
    .leftJoin(enhanced_terms, eq(person_contributions.term_id, enhanced_terms.id));
    
  res.json({ success: true, data: person });
});

// Get people related to a term
router.get('/api/terms/:id/people', async (req, res) => {
  const contributors = await db
    .select()
    .from(person_contributions)
    .where(eq(person_contributions.term_id, req.params.id))
    .leftJoin(people, eq(person_contributions.person_id, people.id));
    
  res.json({ success: true, data: contributors });
});
```

---

## Launch Checklist

### Week 1: Foundation
- [ ] Create database tables
- [ ] Set up basic API endpoints
- [ ] Create PersonCard component
- [ ] Create CompanyCard component

### Week 2: Integration
- [ ] Add people section to term detail pages
- [ ] Create people directory page
- [ ] Add search and filtering
- [ ] Import initial 50 people

### Week 3: Enhancement
- [ ] Add company profiles
- [ ] Create relationship visualizations
- [ ] Add social media links
- [ ] Import initial 25 companies

### Week 4: Polish & Launch
- [ ] Add to main navigation
- [ ] Create landing page section
- [ ] Write announcement blog post
- [ ] Soft launch to beta users

---

## Future Enhancements

1. **Timeline View**: Show person's contributions over time
2. **Network Graph**: Visualize connections between people
3. **Auto-Import**: Scrape data from Wikipedia/LinkedIn
4. **User Submissions**: Allow community to suggest people
5. **Achievements**: Awards, publications, patents
6. **Video Interviews**: Embed YouTube interviews
7. **Research Papers**: Link to authored papers
8. **Speaking Events**: Conference appearances