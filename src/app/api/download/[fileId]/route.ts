import { NextRequest, NextResponse } from 'next/server';

// Import the subtitles cache from the generate route
// import { subtitlesCache } from '../../generate/route';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    const { fileId } = await params;
    // const subtitles = subtitlesCache.get(fileId);

    // if (!subtitles) {
    //     return NextResponse.json({ error: 'File not found' }, { status: 404 });
    // }

    // Create headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'text/srt');
    headers.set('Content-Disposition', 'attachment; filename="subtitles.srt"');

    return new NextResponse('', {
        status: 200,
        headers,
    });
} 