import { useEffect, useRef, useState } from 'react';

interface Subtitle {
    id: number;
    startTime: number;
    endTime: number;
    text: string;
}

interface AudioPlayerProps {
    audioFile: File;
    subtitles: string;
}

export default function AudioPlayer({ audioFile, subtitles }: AudioPlayerProps) {
    const [parsedSubtitles, setParsedSubtitles] = useState<Subtitle[]>([]);
    const [currentLyric, setCurrentLyric] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Parse SRT format to structured data
    useEffect(() => {
        const parseTimestamp = (timestamp: string): number => {
            if (!timestamp || typeof timestamp !== 'string') {
                console.error('Invalid timestamp format:', timestamp);
                return 0;
            }
            try {
                const [minutes, seconds] = timestamp.split(':').map(part => part.trim());
                if (!minutes || !seconds) {
                    console.error('Invalid timestamp parts:', timestamp);
                    return 0;
                }

                const [secs, ms] = seconds.split(',');
                if (!secs || !ms) {
                    console.error('Invalid seconds format:', seconds);
                    return 0;
                }

                return parseInt(minutes) * 60 + parseInt(secs) + parseInt(ms) / 1000;
            } catch (error) {
                console.error('Error parsing timestamp:', error);
                return 0;
            }
        };

        const parseSRT = (srtContent: string): Subtitle[] => {
            if (!srtContent || typeof srtContent !== 'string') {
                console.error('Invalid SRT content:', srtContent);
                return [];
            }

            try {
                const subtitles: Subtitle[] = [];
                // Remove all blank lines and split by real entries
                const cleanContent = srtContent.split('\n').filter(line => line.trim() !== '').join('\n');
                let currentSubtitle: Partial<Subtitle> = {};
                let textLines: string[] = [];

                cleanContent.split('\n').forEach(line => {
                    const trimmedLine = line.trim();

                    // Check if line is a subtitle number
                    if (/^\d+$/.test(trimmedLine)) {
                        // Save previous subtitle if exists
                        if (currentSubtitle.id && currentSubtitle.startTime !== undefined &&
                            currentSubtitle.endTime !== undefined && textLines.length > 0) {
                            subtitles.push({
                                id: currentSubtitle.id,
                                startTime: currentSubtitle.startTime,
                                endTime: currentSubtitle.endTime,
                                text: textLines.join(' ')
                            });
                        }

                        // Start new subtitle
                        currentSubtitle = { id: parseInt(trimmedLine) };
                        textLines = [];
                    }
                    // Check if line is timestamp range
                    else if (trimmedLine.includes('-->')) {
                        const [start, end] = trimmedLine.split('-->').map(t => t.trim());
                        currentSubtitle.startTime = parseTimestamp(start);
                        currentSubtitle.endTime = parseTimestamp(end);
                    }
                    // Must be text content
                    else {
                        textLines.push(trimmedLine);
                    }
                });

                // Don't forget to add the last subtitle
                if (currentSubtitle.id && currentSubtitle.startTime !== undefined &&
                    currentSubtitle.endTime !== undefined && textLines.length > 0) {
                    subtitles.push({
                        id: currentSubtitle.id,
                        startTime: currentSubtitle.startTime,
                        endTime: currentSubtitle.endTime,
                        text: textLines.join(' ')
                    });
                }

                return subtitles;
            } catch (error) {
                console.error('Error parsing SRT:', error);
                return [];
            }
        };

        setParsedSubtitles(parseSRT(subtitles));
    }, [subtitles]);

    // Update current lyric based on audio time
    const handleTimeUpdate = () => {
        if (!audioRef.current) return;

        const currentTime = audioRef.current.currentTime;
        const currentSubtitle = parsedSubtitles.find(
            (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
        );

        setCurrentLyric(currentSubtitle?.text || '');
    };

    // Handle play/pause
    const togglePlayPause = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        if (audioFile && audioRef.current) {
            const url = URL.createObjectURL(audioFile);
            audioRef.current.src = url;
            return () => URL.revokeObjectURL(url);
        }
    }, [audioFile]);

    return (
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
            <div className="flex flex-col items-center space-y-4">
                <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                />

                <div className="w-full min-h-[100px] bg-gray-900/50 rounded-lg p-4 flex items-center justify-center text-center">
                    <p className="text-xl font-semibold text-white transition-all duration-300">
                        {currentLyric || 'Lyrics will appear here...'}
                    </p>
                </div>
            </div>
        </div>
    );
}