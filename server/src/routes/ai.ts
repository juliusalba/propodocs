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
    calculatorType: z.enum(['marketing', 'custom']),
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

        const systemPrompt = `You are an expert marketing proposal writer for Propodocs.
Your task is to create compelling, professional proposal content based on the client information and selected services.

**INTEGRATION INSTRUCTIONS (CRITICAL):**
1. **Analyze Selected Services**: Look at the \`Selected Services\` data provided. 
2. **Map to Value**: For EVERY major service or line item selected, you MUST include it in the "Our Proposed Solution" section.
3. **Specifics**: Do not just say "We will provide marketing." Say "We will provide [Specific Service Name] to achieve [Specific Goal]."
4. **Scope Integration**: If a "Scope of Work" was provided in the context, refer to it.


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

**COPYWRITING RULES (STRICT):**
- **Voice:** Use ACTIVE voice. (e.g., "We designed this..." NOT "This was designed...")
- **Sentences:** Keep sentences SHORT and punchy. Aim for under 20 words where possible.
- **Jargon:** Avoid corporate jargon like "leverage", "synergy", "best-in-class". Be specific.
- **Clichés:** Avoid clichés.
- **Tone:** Professional, confident, yet human and warm.

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

// Extract bank details from image
router.post('/extract-bank-details', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { imageBase64 } = req.body;

        if (!openai) {
            res.status(503).json({ error: 'OpenAI API key not configured' });
            return;
        }

        if (!imageBase64) {
            res.status(400).json({ error: 'Image data is required' });
            return;
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an intelligent data extraction assistant. 
Extract bank account details from the provided image. 
Return ONLY a valid JSON object with the following keys:
- bankName
- accountName
- accountNumber
- routingNumber (or sort code)
- swiftBic
- iban
- address

If a field is not found, return an empty string for that field. Do not include markdown formatting or explanations.`
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Extract bank details from this image:' },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageBase64,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
        });

        const content = completion.choices[0].message.content;
        const details = JSON.parse(content || '{}');

        res.json({ details });
    } catch (error) {
        console.error('Bank details extraction error:', error);
        res.status(500).json({ error: 'Failed to extract bank details' });
    }
});

// Import proposal from extracted text (PDF, DOCX content, or image OCR result)
router.post('/import-proposal', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { extractedText, imageBase64 } = req.body;

        if (!openai) {
            res.status(503).json({ error: 'OpenAI API key not configured' });
            return;
        }

        if (!extractedText && !imageBase64) {
            res.status(400).json({ error: 'Either extractedText or imageBase64 is required' });
            return;
        }

        let contentToProcess = extractedText || '';

        // If image provided, use Vision API to extract text
        if (imageBase64 && !extractedText) {
            const visionResponse = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Extract ALL text content from this proposal/document image. Include everything: headings, paragraphs, bullet points, pricing, terms, etc. Maintain the structure as much as possible.',
                            },
                            {
                                type: 'image_url',
                                image_url: { url: imageBase64 },
                            },
                        ],
                    },
                ],
                max_tokens: 4000,
            });
            contentToProcess = visionResponse.choices[0].message.content || '';
        }

        if (!contentToProcess.trim()) {
            res.status(400).json({ error: 'No content could be extracted from the document' });
            return;
        }

        // Convert extracted text to BlockNote blocks
        const systemPrompt = `You are an expert document converter for Propodocs.
Your task is to convert raw extracted text from a proposal/document into structured BlockNote-compatible blocks.

CRITICAL: Return ONLY a valid JSON object with a "blocks" property containing an array of blocks.
Each block MUST follow this exact structure:

For headings (use level 1 for main sections, level 2 for subsections, level 3 for sub-subsections):
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

For numbered list items:
{
  "type": "numberedListItem",
  "content": [{ "type": "text", "text": "Numbered item text" }]
}

RULES:
1. Preserve the document structure (headings, paragraphs, lists)
2. Clean up any OCR artifacts or formatting issues
3. Maintain professional formatting
4. Group related content logically
5. If there are pricing tables, describe them in text form (we'll handle tables separately)
6. Do NOT add any content that wasn't in the original - just restructure what's there`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Convert this extracted document content into BlockNote blocks:\n\n${contentToProcess}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const response = JSON.parse(completion.choices[0].message.content || '{}');
        const blocks = response.blocks || [];

        res.json({ blocks, extractedText: contentToProcess });
    } catch (error) {
        console.error('Import proposal error:', error);
        res.status(500).json({ error: 'Failed to import proposal' });
    }
});

export default router;
