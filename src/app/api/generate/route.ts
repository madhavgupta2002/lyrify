import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { subtitlesCache } from '../utils/cache';

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

async function uploadToTmpFiles(buffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    formData.append('file', blob, filename);

    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (!data.data.url) {
        throw new Error('Failed to upload to tmpfiles.org');
    }

    // Convert view URL to download URL
    // From: https://tmpfiles.org/18251406/test.mp3
    // To: https://tmpfiles.org/dl/18251406/test.mp3
    const viewUrl = data.data.url;
    const downloadUrl = viewUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    return downloadUrl;
}

async function generateLyrics(audioUrl: string, apiKey: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-exp-1206", generationConfig: { temperature: 0 } });

    try {
        // Download the audio file
        const audioResponse = await fetch(audioUrl);
        const audioBuffer = await audioResponse.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        const mimeType = 'audio/mpeg';

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

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        try {
            // Upload to tmpfiles.org first
            const downloadUrl = await uploadToTmpFiles(buffer, file.name);

            // Use custom API key if provided, otherwise use environment variable
            const apiKey = customApiKey || 'AIzaSyALYOu3CPnz4rGCHL0rtQvE6JB9xL3PRu0';
            if (!apiKey) {
                throw new Error('No API key provided');
            }

            const subtitles = await generateLyrics(downloadUrl, apiKey);

            // Generate a unique ID for these subtitles and store them
            const fileId = uuidv4();
            subtitlesCache.set(fileId, subtitles);

            return NextResponse.json({
                subtitles,
                file_id: fileId,
            });
        } catch (error) {
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