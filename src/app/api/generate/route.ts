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
    console.log('Starting tmpfiles.org upload for:', filename);

    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    formData.append('file', blob, filename);

    try {
        console.log('Sending request to tmpfiles.org...');
        const response = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: formData
        });

        console.log('tmpfiles.org response status:', response.status);
        const contentType = response.headers.get('content-type');
        console.log('tmpfiles.org response content-type:', contentType);

        const data = await response.json();
        console.log('tmpfiles.org response data:', data);

        if (!data.data?.url) {
            console.error('No URL in tmpfiles.org response');
            throw new Error('Failed to upload to tmpfiles.org');
        }

        const viewUrl = data.data.url;
        const downloadUrl = viewUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        console.log('Generated download URL:', downloadUrl);
        return downloadUrl;
    } catch (error) {
        console.error('Error uploading to tmpfiles.org:', error);
        throw error;
    }
}

async function generateLyrics(audioUrl: string, apiKey: string): Promise<string> {
    console.log('Starting lyrics generation with URL:', audioUrl);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-exp-1206", generationConfig: { temperature: 0 } });

    try {
        console.log('Downloading audio file from URL...');
        const audioResponse = await fetch(audioUrl);
        console.log('Audio download status:', audioResponse.status);

        if (!audioResponse.ok) {
            console.error('Failed to download audio file');
            throw new Error('Failed to download audio file from temporary storage');
        }

        const audioBuffer = await audioResponse.arrayBuffer();
        console.log('Audio file downloaded, size:', audioBuffer.byteLength);

        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        const mimeType = 'audio/mpeg';

        console.log('Calling Gemini API...');
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
        console.log('Received response from Gemini API');

        // Extract subtitles between tags
        const startTag = "[SUBTITLES_START]";
        const endTag = "[SUBTITLES_END]";

        if (responseText.includes(startTag) && responseText.includes(endTag)) {
            const subtitles = responseText.substring(
                responseText.indexOf(startTag) + startTag.length,
                responseText.indexOf(endTag)
            ).trim();
            console.log('Successfully extracted subtitles');
            return subtitles;
        }

        console.log('No subtitle tags found, returning raw response');
        return responseText;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate lyrics');
    }
}

export async function POST(request: NextRequest) {
    console.log('Received POST request to /api/generate');

    try {
        const formData = await request.formData();
        const file = formData.get('audio') as File;
        const customApiKey = formData.get('api_key') as string;

        console.log('Request details:', {
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type,
            hasCustomApiKey: !!customApiKey
        });

        if (!file) {
            console.error('No file in request');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log('Converted file to buffer, size:', buffer.length);

        try {
            // Upload to tmpfiles.org first
            const downloadUrl = await uploadToTmpFiles(buffer, file.name);
            console.log('File uploaded to tmpfiles.org');

            // Use custom API key if provided, otherwise use environment variable
            const apiKey = customApiKey || 'AIzaSyALYOu3CPnz4rGCHL0rtQvE6JB9xL3PRu0';
            if (!apiKey) {
                console.error('No API key available');
                throw new Error('No API key provided');
            }

            const subtitles = await generateLyrics(downloadUrl, apiKey);
            console.log('Successfully generated lyrics');

            // Generate a unique ID for these subtitles and store them
            const fileId = uuidv4();
            subtitlesCache.set(fileId, subtitles);
            console.log('Stored subtitles with ID:', fileId);

            return NextResponse.json({
                subtitles,
                file_id: fileId,
            });
        } catch (error) {
            console.error('Inner try-catch error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Outer try-catch error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process file' },
            { status: 500 }
        );
    }
}