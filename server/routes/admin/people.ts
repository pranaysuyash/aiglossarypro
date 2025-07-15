import { Router } from 'express';
import { eq, ilike, and, desc, asc, count } from 'drizzle-orm';
import { db } from '../../db';
import { 
  people, 
  companies, 
  entityLinks,
  insertPersonSchema, 
  type Person, 
  type InsertPerson 
} from '../../../shared/enhancedSchema';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/adminAuth';
import { requireFeature } from '../../../shared/featureFlags';
import { z } from 'zod';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(requireAuth);
router.use(requireAdmin);

// Apply feature flag middleware - disable people feature for initial launch
router.use(requireFeature('people'));

// Validation schemas
const createPersonSchema = insertPersonSchema.extend({
  companyId: z.string().uuid().optional().nullable(),
});

const updatePersonSchema = createPersonSchema.partial().extend({
  id: z.string().uuid(),
});

const searchParamsSchema = z.object({
  q: z.string().optional(),
  company: z.string().optional(),
  expertise: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'company']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * @swagger
 * /api/admin/people:
 *   get:
 *     summary: Get all people with filtering and pagination (Admin only)
 *     tags: [Admin - People]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for person name or bio
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter by company name
 *       - in: query
 *         name: expertise
 *         schema:
 *           type: string
 *         description: Filter by area of expertise
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, company]
 *           default: name
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of people with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 people:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Person'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 */
router.get('/', async (req, res) => {
  try {
    const params = searchParamsSchema.parse(req.query);
    const offset = (params.page - 1) * params.limit;

    // Build the query conditions
    const conditions = [];
    
    if (params.q) {
      conditions.push(
        ilike(people.name, `%${params.q}%`)
      );
    }

    if (params.expertise) {
      // Note: This is a simplified search. In production, you might want more sophisticated array searching
      conditions.push(
        ilike(people.areasOfExpertise, `%${params.expertise}%`)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    const sortField = params.sortBy === 'company' ? companies.name : 
                     params.sortBy === 'createdAt' ? people.createdAt : 
                     people.name;
    const orderFn = params.sortOrder === 'desc' ? desc : asc;

    // Get people with company information
    const peopleResult = await db
      .select({
        id: people.id,
        name: people.name,
        title: people.title,
        bio: people.bio,
        companyId: people.companyId,
        companyName: companies.name,
        areasOfExpertise: people.areasOfExpertise,
        socialLinks: people.socialLinks,
        imageUrl: people.imageUrl,
        notableWorks: people.notableWorks,
        location: people.location,
        websiteUrl: people.websiteUrl,
        createdAt: people.createdAt,
        updatedAt: people.updatedAt,
      })
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .where(whereClause)
      .orderBy(orderFn(sortField))
      .limit(params.limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .where(whereClause);

    const totalCount = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / params.limit);

    res.json({
      people: peopleResult,
      pagination: {
        page: params.page,
        limit: params.limit,
        totalCount,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ 
      error: 'Failed to fetch people',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/admin/people:
 *   post:
 *     summary: Create a new person (Admin only)
 *     tags: [Admin - People]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePersonRequest'
 *     responses:
 *       201:
 *         description: Person created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Person'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Person with this name already exists
 */
router.post('/', async (req, res) => {
  try {
    const personData = createPersonSchema.parse(req.body);

    // Check if person with this name already exists
    const existingPerson = await db
      .select()
      .from(people)
      .where(eq(people.name, personData.name))
      .limit(1);

    if (existingPerson.length > 0) {
      return res.status(409).json({ 
        error: 'Person with this name already exists' 
      });
    }

    // If companyId is provided, verify the company exists
    if (personData.companyId) {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, personData.companyId))
        .limit(1);

      if (company.length === 0) {
        return res.status(400).json({ 
          error: 'Company not found' 
        });
      }
    }

    const [newPerson] = await db
      .insert(people)
      .values(personData)
      .returning();

    res.status(201).json(newPerson);
  } catch (error) {
    console.error('Error creating person:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input data',
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create person',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/admin/people/{id}:
 *   get:
 *     summary: Get a specific person by ID (Admin only)
 *     tags: [Admin - People]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Person ID
 *     responses:
 *       200:
 *         description: Person details with linked entities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 person:
 *                   $ref: '#/components/schemas/Person'
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *                 linkedTerms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       termId:
 *                         type: string
 *                       termName:
 *                         type: string
 *                       linkType:
 *                         type: string
 *       404:
 *         description: Person not found
 */
router.get('/:id', async (req, res) => {
  try {
    const personId = z.string().uuid().parse(req.params.id);

    // Get person with company information
    const personResult = await db
      .select({
        person: people,
        company: companies,
      })
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .where(eq(people.id, personId))
      .limit(1);

    if (personResult.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Get linked terms
    const linkedTerms = await db
      .select({
        termId: entityLinks.termId,
        linkType: entityLinks.linkType,
        relevanceScore: entityLinks.relevanceScore,
        description: entityLinks.description,
      })
      .from(entityLinks)
      .where(eq(entityLinks.personId, personId));

    const { person, company } = personResult[0];

    res.json({
      person,
      company,
      linkedTerms,
    });
  } catch (error) {
    console.error('Error fetching person:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid person ID format' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch person',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/admin/people/{id}:
 *   put:
 *     summary: Update a person (Admin only)
 *     tags: [Admin - People]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Person ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePersonRequest'
 *     responses:
 *       200:
 *         description: Person updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Person'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Person not found
 */
router.put('/:id', async (req, res) => {
  try {
    const personId = z.string().uuid().parse(req.params.id);
    const updateData = updatePersonSchema.parse({ ...req.body, id: personId });

    // Remove id from update data
    const { id, ...personUpdateData } = updateData;

    // If companyId is being updated, verify the company exists
    if (personUpdateData.companyId) {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, personUpdateData.companyId))
        .limit(1);

      if (company.length === 0) {
        return res.status(400).json({ 
          error: 'Company not found' 
        });
      }
    }

    const [updatedPerson] = await db
      .update(people)
      .set({
        ...personUpdateData,
        updatedAt: new Date(),
      })
      .where(eq(people.id, personId))
      .returning();

    if (!updatedPerson) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json(updatedPerson);
  } catch (error) {
    console.error('Error updating person:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input data',
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Failed to update person',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/admin/people/{id}:
 *   delete:
 *     summary: Delete a person (Admin only)
 *     tags: [Admin - People]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Person ID
 *     responses:
 *       204:
 *         description: Person deleted successfully
 *       404:
 *         description: Person not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const personId = z.string().uuid().parse(req.params.id);

    const [deletedPerson] = await db
      .delete(people)
      .where(eq(people.id, personId))
      .returning();

    if (!deletedPerson) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting person:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid person ID format' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to delete person',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/admin/people/{id}/link-terms:
 *   post:
 *     summary: Link a person to multiple terms (Admin only)
 *     tags: [Admin - People]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Person ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               links:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     termId:
 *                       type: string
 *                       format: uuid
 *                     linkType:
 *                       type: string
 *                       enum: [created_by, contributed_to, expert_in, researched]
 *                     relevanceScore:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 10
 *                       default: 5
 *                     description:
 *                       type: string
 *     responses:
 *       201:
 *         description: Links created successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Person not found
 */
router.post('/:id/link-terms', async (req, res) => {
  try {
    const personId = z.string().uuid().parse(req.params.id);
    const linksData = z.object({
      links: z.array(z.object({
        termId: z.string().uuid(),
        linkType: z.enum(['created_by', 'contributed_to', 'expert_in', 'researched']),
        relevanceScore: z.number().min(1).max(10).default(5),
        description: z.string().optional(),
      }))
    }).parse(req.body);

    // Verify person exists
    const person = await db
      .select()
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);

    if (person.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Create the entity links
    const linkInserts = linksData.links.map(link => ({
      termId: link.termId,
      personId: personId,
      linkType: link.linkType,
      relevanceScore: link.relevanceScore,
      description: link.description,
      createdBy: req.user.uid, // Assuming user info is in req.user
      verificationStatus: 'verified' as const, // Admin-created links are automatically verified
    }));

    const createdLinks = await db
      .insert(entityLinks)
      .values(linkInserts)
      .returning();

    res.status(201).json({
      message: 'Links created successfully',
      links: createdLinks,
    });
  } catch (error) {
    console.error('Error creating person-term links:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input data',
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create links',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;