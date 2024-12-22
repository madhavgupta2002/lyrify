import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { subtitlesCache } from '../utils/cache';

// Constants for file size limits
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit
const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks

const prompt = `Generate a Lyrical Subtitle File for this song in the SRT format. 
The SRT format should follow this structure for each subtitle:
1. Subtitle number
2. Timestamp in format: MM:SS,mmm --> MM:SS,mmm
3. Blank line
4. If the Line isnt in English, put the english translation in square brackets of the corresponding line.

For example:
1
00:01,000 --> 00:04,000
First line of lyrics
2
00:05,000 --> 00:06,000
Second line of lyrics

Please include accurate timestamps that match when each line is actually sung in the audio. Make sure the durations are appropriate for each line of lyrics.
Please wrap the subtitles between [SUBTITLES_START] and [SUBTITLES_END] tags.`;

async function generateLyrics(audioBuffer: Buffer, apiKey: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-exp-1206", generationConfig: { temperature: 0 } });

    // Convert buffer to base64
    const base64Audio = audioBuffer.toString('base64');
    const mimeType = 'audio/mpeg'; // Adjust based on file type

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Audio,
                    mimeType
                }
            }
        ]);

        const response = await result.response;
        const responseText = response.text();

        // Extract subtitles between tags
        const startTag = "[SUBTITLES_START]";
        const endTag = "[SUBTITLES_END]";

        if (responseText.includes(startTag) && responseText.includes(endTag)) {
            return responseText.substring(
                responseText.indexOf(startTag) + startTag.length,
                responseText.indexOf(endTag)
            ).trim();
        }

        return responseText;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate lyrics');
    }
}

export const config = {
    api: {
        bodyParser: false, // Disable the default body parser
        responseLimit: '20mb',
    },
};

export async function POST(request: NextRequest) {
    try {
        // Check content length header
        const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
        if (contentLength > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            }, { status: 413 });
        }

        let formData: FormData;
        try {
            formData = await request.formData();
        } catch (error) {
            console.error('FormData parsing error:', error);
            return NextResponse.json({
                error: 'Failed to parse request body. Please ensure the file size is within limits and try again.'
            }, { status: 400 });
        }

        const file = formData.get('audio') as File;
        const customApiKey = formData.get('api_key') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            }, { status: 413 });
        }

        // Stream the file in chunks
        const chunks: Buffer[] = [];
        const arrayBuffer = await file.arrayBuffer();
        let offset = 0;

        while (offset < arrayBuffer.byteLength) {
            const chunk = arrayBuffer.slice(offset, offset + CHUNK_SIZE);
            chunks.push(Buffer.from(chunk));
            offset += CHUNK_SIZE;
        }

        const buffer = Buffer.concat(chunks);

        try {
            const apiKey = customApiKey || "AIzaSyALYOu3CPnz4rGCHL0rtQvE6JB9xL3PRu0";
            // const apiKey = customApiKey || process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('No API key provided');
            }

            const subtitles = await generateLyrics(buffer, apiKey);
            const fileId = uuidv4();
            subtitlesCache.set(fileId, subtitles);

            return NextResponse.json({
                subtitles,
                file_id: fileId,
            });
        } catch (error: any) {
            console.error('API Error:', error);
            return NextResponse.json({
                error: error.message || 'Failed to generate lyrics'
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Request Error:', error);
        return NextResponse.json({
            error: 'Failed to process request. Please try again.'
        }, { status: 500 });
    }
}