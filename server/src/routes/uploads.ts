import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import OpenAI from 'openai';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Unified Document Processing
router.post('/document', authMiddleware, upload.single('file'), async (req, res) => {
    const log = logger.child({ action: 'document-upload' });

    try {
        if (!req.file) {
            log.warn('No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.API_URL || `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${baseUrl}/uploads/audio/${req.file.filename}`;
        const originalName = req.file.originalname.toLowerCase();
        const filePath = req.file.path; // Keep filePath as it's used later
        const mimeType = req.file.mimetype; // Keep mimeType as it's used later

        log.info('Processing document', {
            fileName: originalName,
            mimeType,
            size: req.file.size
        });

        let extractedText = '';

        // Process based on file type
        if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
            log.debug('Processing PDF file');
            const fileBuffer = await fs.readFile(filePath);
            // Use require for CommonJS pdf-parse module in ESM context
            // @ts-ignore - pdf-parse is a CommonJS module
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(fileBuffer);
            extractedText = pdfData.text;
            log.info('PDF extracted successfully', { textLength: extractedText.length });
        }
        else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            originalName.endsWith('.docx')
        ) {
            log.debug('Processing DOCX file');
            const fileBuffer = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
            if (result.messages.length > 0) {
                log.debug('Mammoth processing messages', { messages: result.messages });
            }
            log.info('DOCX extracted successfully', { textLength: extractedText.length });
        }
        else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimeType === 'application/vnd.ms-excel' ||
            mimeType === 'text/csv' ||
            originalName.endsWith('.xlsx') ||
            originalName.endsWith('.xls') ||
            originalName.endsWith('.csv')
        ) {
            log.debug('Processing Excel/CSV file');
            const workbook = xlsx.readFile(filePath);
            const sheets = workbook.SheetNames;
            const textParts: string[] = [];

            sheets.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const csvData = xlsx.utils.sheet_to_csv(worksheet);
                textParts.push(`Sheet: ${sheetName}\n${csvData}`);
            });

            extractedText = textParts.join('\n\n');
            log.info('Excel/CSV extracted successfully', {
                textLength: extractedText.length,
                sheetCount: sheets.length
            });
        }
        else {
            log.warn('Unsupported file type', { mimeType, fileName: originalName });
            throw new Error(`Unsupported file type: ${mimeType}`);
        }

        // Clean up uploaded file
        await fs.unlink(filePath);
        log.debug('Temporary file cleaned up');

        res.json({ extractedText });
    } catch (error) {
        log.error('Document processing failed', error);

        // Clean up file on error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                log.error('Failed to clean up temporary file', unlinkError);
            }
        }

        const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
        res.status(500).json({ error: errorMessage });
    }
});

// Image/Screenshot Processing with Vision API
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
    const log = logger.child({ action: 'image-upload' });

    try {
        if (!req.file) {
            log.warn('No image file uploaded');
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const filePath = req.file.path;
        log.info('Processing image', {
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });

        const imageBuffer = await fs.readFile(filePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyze this pricing or service screenshot. Extract all pricing information, service names, tiers, features, and any other relevant details. Format the output as a detailed description that can be used to create a pricing calculator.',
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const extractedData = response.choices[0].message.content;
        log.info('Image analysis completed', {
            extractedLength: extractedData?.length || 0
        });

        await fs.unlink(filePath);
        res.json({ extractedData });
    } catch (error) {
        log.error('Image processing failed', error);

        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                log.error('Failed to clean up temporary file', unlinkError);
            }
        }

        const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
        res.status(500).json({ error: errorMessage });
    }
});

// Audio Transcription
router.post('/audio', authMiddleware, upload.single('audio'), async (req, res) => {
    const log = logger.child({ action: 'audio-upload' });

    try {
        if (!req.file) {
            log.warn('No audio file uploaded');
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        const filePath = req.file.path;
        log.info('Processing audio', {
            fileName: req.file.originalname,
            size: req.file.size
        });

        const audioFile = await fs.readFile(filePath);
        const tempFilePath = `${filePath}.webm`;
        await fs.writeFile(tempFilePath, audioFile);

        const transcription = await openai.audio.transcriptions.create({
            file: fsSync.createReadStream(tempFilePath),
            model: 'whisper-1',
        });

        const transcript = transcription.text;
        log.info('Audio transcription completed', {
            transcriptLength: transcript.length
        });

        await fs.unlink(filePath);
        await fs.unlink(tempFilePath);

        res.json({ transcript });
    } catch (error) {
        log.error('Audio transcription failed', error);

        if (req.file) {
            try {
                await fs.unlink(req.file.path);
                await fs.unlink(`${req.file.path}.webm`).catch(() => { });
            } catch (unlinkError) {
                log.error('Failed to clean up temporary files', unlinkError);
            }
        }

        const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
        res.status(500).json({ error: errorMessage });
    }
});

export default router;
