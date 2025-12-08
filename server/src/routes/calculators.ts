import express from 'express';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize AI Providers
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Gemini AI (Primary for calculator generation)
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// Anthropic Claude (Fallback)
const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

// Schema for Calculator Generation Request
const GenerateSchemaRequest = z.object({
    prompt: z.string().min(1),
});

// Schema for Calculator Creation/Update
const CalculatorSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    schema: z.record(z.any()),
});

// Enhanced VMG Scaffold Rule System for Calculator Generation
const CALCULATOR_GENERATION_PROMPT = `You are a Senior Pricing Strategy Consultant for Propodocs, a premier proposal management platform.
Your task is to analyze the provided service description and create a comprehensive, professional pricing calculator schema that matches VMG's premium branding.

## SCAFFOLD RULES (MUST FOLLOW):

### Rule 1: Layout Selection
- Use "hybrid" layout for comprehensive service packages (PREFERRED - has tiers + add-ons)
- Use "tiered" layout ONLY for simple tier-based pricing without extras
- Use "itemized" layout ONLY for pure menu/a-la-carte pricing

### Rule 2: Tier Structure (for hybrid/tiered)
Create exactly 3 tiers with this naming pattern:
- Tier 1: Entry-level (e.g., "Starter", "Essentials", "Basic")
- Tier 2: Mid-market (e.g., "Growth", "Professional", "Pro")  
- Tier 3: Enterprise (e.g., "Enterprise", "Premium", "Elite")

Each tier MUST include:
- Unique descriptive name
- Clear target audience description
- Monthly price (use realistic agency pricing: $2,500-$25,000/mo range)
- Setup fee (typically 50% of first month)
- Minimum 4-6 features per tier

### Rule 3: Add-On Categories
Group ALL add-ons into logical categories. Common VMG categories:
- "Conversational & Capture" (chatbots, AI chat, DM funnels)
- "Email/SMS & Enablement" (email campaigns, SMS, automation)
- "Creative/CRO/Inventory" (creative assets, website optimization, feed management)
- "Local & Reputation" (local SEO, review management, reputation)
- "Events & Production" (video, photography, event support)
- "Analytics & Reporting" (dashboards, custom reports)

Each add-on MUST have:
- Unique ID (snake_case)
- Professional name
- Clear benefit description
- Price (monthly: $200-$5,000, one-time: $500-$10,000)
- priceType: "monthly" OR "one-time" OR "per-unit"
- category: One of the categories above

### Rule 4: Pricing Guidelines
- Monthly retainers: $1,500 - $25,000 depending on scope
- Setup fees: 50% of monthly (covers onboarding + strategy)
- One-time services: $500 - $15,000
- Per-unit items: $100 - $3,000 each
- If prices are mentioned, use them; otherwise estimate premium agency rates

### Rule 5: Professional Terminology
Use industry-standard terms:
- "Investment" not "Cost"
- "Retainer" not "Fee"
- "Deliverables" not "Things you get"
- "Engagement" not "Contract"

## OUTPUT FORMAT (JSON ONLY):
{
  "name": "Calculator Name",
  "description": "One-line strategic description",
  "layout": "hybrid",
  "tiers": [
    {
      "id": "tier_1",
      "name": "Tier Name",
      "description": "Target audience and value prop",
      "monthlyPrice": 5000,
      "setupFee": 2500,
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
    }
  ],
  "addOns": [
    {
      "id": "addon_id",
      "name": "Service Name",
      "description": "Clear benefit description",
      "price": 500,
      "priceType": "monthly",
      "category": "Category Name"
    }
  ],
  "columns": [
    { "id": "service", "label": "Service", "type": "text" },
    { "id": "description", "label": "Deliverables & Scope", "type": "text" },
    { "id": "price", "label": "Investment", "type": "currency" },
    { "id": "qty", "label": "Qty", "type": "number" },
    { "id": "total", "label": "Total", "type": "formula", "formula": "price * qty" }
  ],
  "clientFields": ["name", "company", "email", "phone", "address"]
}

## CRITICAL:
- Output ONLY valid JSON, no markdown code blocks
- Be EXHAUSTIVE - include all services mentioned
- Use professional agency terminology
- Every add-on MUST have a category
- Tiers must have progressive pricing (Tier 1 < Tier 2 < Tier 3)`;

// Generate Calculator Schema using AI (Multi-provider with fallback)
router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'generate-calculator', userId: req.user?.userId?.toString() });

    try {
        const { prompt } = GenerateSchemaRequest.parse(req.body);
        log.info('Generating calculator schema', { promptLength: prompt.length });

        let generatedSchema: any = null;
        let provider = 'unknown';

        // Try Gemini 2.5 Flash first (Primary)
        if (genAI && !generatedSchema) {
            try {
                log.info('Attempting generation with Gemini 2.5 Flash');
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

                const result = await model.generateContent({
                    contents: [{
                        role: "user",
                        parts: [{ text: `${CALCULATOR_GENERATION_PROMPT}\n\n---\n\nUser Request:\n${prompt}` }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: "application/json"
                    }
                });

                const responseText = result.response.text();
                // Clean up response if wrapped in markdown
                const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
                generatedSchema = JSON.parse(cleanJson);
                provider = 'gemini';
                log.info('Gemini generation successful');
            } catch (geminiError) {
                log.warn('Gemini generation failed, trying fallback', { error: geminiError instanceof Error ? geminiError.message : 'Unknown' });
            }
        }

        // Try Anthropic Claude as fallback
        if (anthropic && !generatedSchema) {
            try {
                log.info('Attempting generation with Anthropic Claude');
                const message = await anthropic.messages.create({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4096,
                    messages: [
                        {
                            role: "user",
                            content: `${CALCULATOR_GENERATION_PROMPT}\n\n---\n\nUser Request:\n${prompt}\n\nRespond with ONLY valid JSON, no explanation.`
                        }
                    ]
                });

                const content = message.content[0];
                if (content.type === 'text') {
                    const cleanJson = content.text.replace(/```json\n?|\n?```/g, '').trim();
                    generatedSchema = JSON.parse(cleanJson);
                    provider = 'anthropic';
                    log.info('Anthropic generation successful');
                }
            } catch (anthropicError) {
                log.warn('Anthropic generation failed, trying OpenAI fallback', { error: anthropicError instanceof Error ? anthropicError.message : 'Unknown' });
            }
        }

        // Fall back to OpenAI as last resort
        if (!generatedSchema) {
            log.info('Attempting generation with OpenAI');
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: CALCULATOR_GENERATION_PROMPT
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
            });

            generatedSchema = JSON.parse(completion.choices[0].message.content || '{}');
            provider = 'openai';
            log.info('OpenAI generation successful');
        }

        log.info('Calculator schema generated successfully', {
            provider,
            layout: generatedSchema.layout,
            tierCount: generatedSchema.tiers?.length || 0,
            addOnCount: generatedSchema.addOns?.length || 0
        });

        res.json(generatedSchema);

    } catch (error) {
        log.error('Failed to generate calculator schema', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Invalid request',
                details: error.errors
            });
        }

        const errorMessage = error instanceof Error ? error.message : 'Failed to generate calculator schema';
        res.status(500).json({ error: errorMessage });
    }
});

// Edit Calculator Block with AI
const EditBlockRequest = z.object({
    blockType: z.enum(['tier', 'addon', 'column']),
    blockData: z.record(z.any()),
    instruction: z.string().min(1),
    fullSchema: z.record(z.any()).optional(),
});

router.post('/edit-block', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'edit-block', userId: req.user?.userId?.toString() });

    try {
        const { blockType, blockData, instruction, fullSchema } = EditBlockRequest.parse(req.body);
        log.info('Editing calculator block', { blockType, instruction: instruction.substring(0, 50) });

        const BLOCK_EDIT_PROMPT = `You are editing a single ${blockType} block in a pricing calculator.

Current ${blockType} data:
${JSON.stringify(blockData, null, 2)}

User instruction: "${instruction}"

Rules:
1. Preserve the existing structure (id, name, description, etc.)
2. Only modify fields mentioned in the instruction
3. Keep pricing realistic for a premium marketing agency
4. Return ONLY the updated ${blockType} JSON object, no explanation

${blockType === 'tier' ? `
Tier structure: { id, name, description, monthlyPrice, setupFee, features: string[] }
` : ''}
${blockType === 'addon' ? `
Add-on structure: { id, name, description, price, priceType: "monthly"|"one-time"|"per-unit", category }
` : ''}

Output the modified ${blockType} as valid JSON:`;

        let updatedBlock: any = null;
        let provider = 'unknown';

        // Try Gemini first
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
                const result = await model.generateContent({
                    contents: [{
                        role: "user",
                        parts: [{ text: BLOCK_EDIT_PROMPT }]
                    }],
                    generationConfig: {
                        temperature: 0.5,
                        responseMimeType: "application/json"
                    }
                });

                const responseText = result.response.text();
                const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
                updatedBlock = JSON.parse(cleanJson);
                provider = 'gemini';
                log.info('Block edit with Gemini successful');
            } catch (geminiError) {
                log.warn('Gemini block edit failed, trying fallback', { error: geminiError instanceof Error ? geminiError.message : 'Unknown' });
            }
        }

        // Fallback to Anthropic
        if (!updatedBlock && anthropic) {
            try {
                const message = await anthropic.messages.create({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 2048,
                    messages: [{
                        role: "user",
                        content: BLOCK_EDIT_PROMPT
                    }]
                });

                const content = message.content[0];
                if (content.type === 'text') {
                    const cleanJson = content.text.replace(/```json\n?|\n?```/g, '').trim();
                    updatedBlock = JSON.parse(cleanJson);
                    provider = 'anthropic';
                    log.info('Block edit with Anthropic successful');
                }
            } catch (anthropicError) {
                log.warn('Anthropic block edit failed', { error: anthropicError instanceof Error ? anthropicError.message : 'Unknown' });
            }
        }

        // Fallback to OpenAI
        if (!updatedBlock && openai) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: "You are a JSON editor. Return only valid JSON." },
                        { role: "user", content: BLOCK_EDIT_PROMPT }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.5,
                });

                const responseText = completion.choices[0].message.content;
                if (responseText) {
                    updatedBlock = JSON.parse(responseText);
                    provider = 'openai';
                    log.info('Block edit with OpenAI successful');
                }
            } catch (openaiError) {
                log.error('OpenAI block edit failed', { error: openaiError instanceof Error ? openaiError.message : 'Unknown' });
            }
        }

        if (!updatedBlock) {
            log.error('All AI providers failed for block edit');
            res.status(500).json({ error: 'Failed to edit block with AI' });
            return;
        }

        // Preserve the original ID
        updatedBlock.id = blockData.id;

        log.info('Block edit completed', { provider, blockType });
        res.json({ updatedBlock, provider });

    } catch (error) {
        log.error('Block edit error', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to edit block';
        res.status(500).json({ error: errorMessage });
    }
});

// List Calculators
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'list-calculators', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;
        log.debug('Fetching calculators for user');

        const { data, error } = await supabase
            .from('calculator_definitions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            log.error('Database error fetching calculators', error);
            throw error;
        }

        log.info('Calculators fetched successfully', { count: data?.length || 0 });
        res.json(data);
    } catch (error) {
        log.error('Failed to fetch calculators', error);
        res.status(500).json({ error: 'Failed to fetch calculators' });
    }
});

// Create Calculator
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'create-calculator', userId: req.user?.userId?.toString() });

    try {
        const { name, description, schema } = CalculatorSchema.parse(req.body);
        const userId = req.user!.userId;

        log.info('Creating calculator', { name, userId: userId.toString() });

        const { data, error } = await supabase
            .from('calculator_definitions')
            .insert({
                user_id: userId,
                name,
                description,
                schema
            })
            .select()
            .single();

        if (error) {
            log.error('Database error creating calculator', error);
            throw error;
        }

        log.info('Calculator created successfully', { calculatorId: data.id });
        res.json(data);
    } catch (error) {
        log.error('Failed to create calculator', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Invalid calculator data',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to create calculator' });
    }
});

// Get Calculator
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'get-calculator', userId: req.user?.userId?.toString() });

    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        log.debug('Fetching calculator', { calculatorId: id });

        const { data, error } = await supabase
            .from('calculator_definitions')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) {
            log.error('Database error fetching calculator', error);
            throw error;
        }

        if (!data) {
            log.warn('Calculator not found', { calculatorId: id });
            return res.status(404).json({ error: 'Calculator not found' });
        }

        log.info('Calculator fetched successfully', { calculatorId: id });
        res.json(data);
    } catch (error) {
        log.error('Failed to fetch calculator', error);
        res.status(500).json({ error: 'Failed to fetch calculator' });
    }
});

// Update Calculator
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'update-calculator', userId: req.user?.userId?.toString() });

    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const { name, description, schema } = CalculatorSchema.parse(req.body);

        log.info('Updating calculator', { calculatorId: id, name });

        const { data, error } = await supabase
            .from('calculator_definitions')
            .update({
                name,
                description,
                schema,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            log.error('Database error updating calculator', error);
            throw error;
        }

        log.info('Calculator updated successfully', { calculatorId: id });
        res.json(data);
    } catch (error) {
        log.error('Failed to update calculator', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Invalid calculator data',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update calculator' });
    }
});

// Delete Calculator
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'delete-calculator', userId: req.user?.userId?.toString() });

    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        log.info('Deleting calculator', { calculatorId: id });

        const { error } = await supabase
            .from('calculator_definitions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            log.error('Database error deleting calculator', error);
            throw error;
        }

        log.info('Calculator deleted successfully', { calculatorId: id });
        res.json({ success: true });
    } catch (error) {
        log.error('Failed to delete calculator', error);
        res.status(500).json({ error: 'Failed to delete calculator' });
    }
});

export default router;
