import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const generateProposalSchema = z.object({
    clientName: z.string(),
    clientCompany: z.string().optional(),
    clientIndustry: z.string().optional(),
    calculatorType: z.enum(['vmg', 'marine', 'custom']),
    calculatorData: z.object({}).passthrough(),
    additionalContext: z.string().optional(),
});

// Generate AI proposal content
router.post('/generate-proposal', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const data = generateProposalSchema.parse(req.body);

        if (!openai) {
            res.status(503).json({ error: 'OpenAI API key not configured' });
            return;
        }

        const systemPrompt = `You are an expert marketing proposal writer for Vogel Marketing Group (VMG)${data.calculatorType === 'marine' ? ', specializing in Marine & Powersports marketing' : ''}.
Your task is to create compelling, professional proposal content based on the client information and selected services.

**INTEGRATION INSTRUCTIONS (CRITICAL):**
1. **Analyze Selected Services**: Look at the \`Selected Services\` data provided. 
2. **Map to Value**: For EVERY major service or line item selected, you MUST include it in the "Our Proposed Solution" section.
3. **Specifics**: Do not just say "We will provide marketing." Say "We will provide [Specific Service Name] to achieve [Specific Goal]."
4. **Scope Integration**: If a "Scope of Work" was provided in the context, refer to it.

${data.calculatorType === 'marine' ? 'For Marine clients, focus on dealership growth, inventory turnover, and local market dominance.' : ''}
${data.calculatorType === 'custom' ? 'For this custom proposal, STRONGLY align the content with the specific line items and prices in the calculator data. The proposal must feel bespoke to the calculated quote.' : ''}

CRITICAL: You must return ONLY a valid JSON object with a "blocks" property containing an array of BlockNote-compatible blocks.
Each block MUST follow this exact structure:

For headings (use level 1 for main sections, level 2 for subsections):
{
  "type": "heading",
  "props": { "level": 1 },
  "content": [{ "type": "text", "text": "Your Heading Text" }]
}

For paragraphs:
{
  "type": "paragraph",
  "content": [{ "type": "text", "text": "Your paragraph text here." }]
}

For bullet list items:
{
  "type": "bulletListItem",
  "content": [{ "type": "text", "text": "List item text" }]
}

For tables:
{
  "type": "table",
  "content": {
    "type": "tableContent",
    "rows": [
      {
        "cells": [[{ "type": "text", "text": "Header 1" }], [{ "type": "text", "text": "Header 2" }]]
      },
      {
        "cells": [[{ "type": "text", "text": "Cell 1" }], [{ "type": "text", "text": "Cell 2" }]]
      }
    ]
  }
}

Structure the proposal with these sections:
1. Executive Summary (Heading level 1) - Brief overview of the proposal
2. Understanding Your Needs (Heading level 2) - Show understanding of client's challenges
3. Our Proposed Solution (Heading level 2) - **This is the most important section.** List the selected services as bullet points with persuasive descriptions.
4. Detailed Service Breakdown (Heading level 2) - [CRITICAL] Create a TABLE listing the 'Service', 'Deliverables', and 'Timeline' for each item in the \`detailedBreakdown\` data. This provides the technical confirmation of what they are buying.
5. Value & Investment (Heading level 2) - Reinforce the ROI of these specific services.
6. Next Steps (Heading level 2) - Clear call to action

Keep the tone professional, confident, and action-oriented. Make it personalized to the client.`;

        const userPrompt = `Create a proposal for:
Client: ${data.clientName}
${data.clientCompany ? `Company: ${data.clientCompany}` : ''}
${data.clientIndustry ? `Industry: ${data.clientIndustry}` : ''}
Calculator Type: ${data.calculatorType}
Selected Services: ${JSON.stringify(data.calculatorData, null, 2)}
${data.additionalContext ? `Additional Context: ${data.additionalContext}` : ''}

Generate compelling proposal content that highlights the value of these services for this specific client.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const response = JSON.parse(completion.choices[0].message.content || '{}');
        const content = response.blocks || [];

        res.json({ content });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('AI generation error:', error);
        res.status(500).json({ error: 'Failed to generate proposal content' });
    }
});

// Enhance specific content section or generate new content
router.post('/enhance-content', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { content = '', instruction = 'Create compelling marketing proposal content' } = req.body;

        if (!openai) {
            res.status(503).json({ error: 'OpenAI API key not configured' });
            return;
        }

        const systemPrompt = `You are an expert marketing copywriter. 
- If content is provided, enhance it based on the instruction.
- If no content is provided or content is minimal, generate compelling new content from scratch.
Maintain a professional, persuasive tone. Return only the content, no additional commentary.`;

        let userPrompt: string;
        if (!content || content.trim().length < 50) {
            // Generate new content when there's minimal or no content
            userPrompt = instruction || `Create compelling marketing proposal content.`;
        } else {
            // Enhance existing content
            userPrompt = `${instruction || 'Improve and enhance this content'}:\n\n${content}`;
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
        });

        const enhancedContent = completion.choices[0].message.content;

        res.json({ enhancedContent });
    } catch (error) {
        console.error('AI enhancement error:', error);
        res.status(500).json({ error: 'Failed to enhance content' });
    }
});

export default router;
