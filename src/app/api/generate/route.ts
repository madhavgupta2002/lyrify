import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Store generated subtitles temporarily but don't export it
const subtitlesCache = new Map<string, string>();
// export const subtitlesCache = new Map<string, string>();
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

async function generateLyrics(audioPath: string, apiKey: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-exp-1206", generationConfig: { temperature: 0 } });

    // Read the audio file as base64
    const audioBuffer = await readFile(audioPath);
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

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('audio') as File;
        const customApiKey = formData.get('api_key') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Create a unique filename
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${uuidv4()}-${file.name}`;
        const uploadDir = join(process.cwd(), 'uploads');
        const filepath = join(uploadDir, filename);

        // Save file to disk
        await writeFile(filepath, buffer);

        try {
            // Use custom API key if provided, otherwise use environment variable
            const apiKey = customApiKey || process.env.API_KEY;
            if (!apiKey) {
                throw new Error('No API key provided');
            }

            const subtitles = await generateLyrics(filepath, apiKey);

            // Generate a unique ID for these subtitles and store them
            const fileId = uuidv4();
            subtitlesCache.set(fileId, subtitles);

            // Clean up the uploaded file
            await unlink(filepath);

            return NextResponse.json({
                subtitles,
                file_id: fileId,
            });
        } catch (error) {
            // Clean up the uploaded file in case of error
            await unlink(filepath);
            throw error;
        }
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process file' },
            { status: 500 }
        );
    }
}