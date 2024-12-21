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
                // Split by : and handle both HH:MM:SS,ms and MM:SS,ms formats
                const parts = timestamp.split(':');
                let hours = 0, minutes = 0, seconds = '';

                if (parts.length === 3) {
                    // HH:MM:SS,ms format
                    const [h, m, s] = parts.map(p => p.trim());
                    hours = parseInt(h);
                    minutes = parseInt(m);
                    seconds = s;
                } else if (parts.length === 2) {
                    // MM:SS,ms format
                    const [m, s] = parts.map(p => p.trim());
                    minutes = parseInt(m);
                    seconds = s;
                } else {
                    console.error('Invalid timestamp format:', timestamp);
                    return 0;
                }

                const [secs, ms] = seconds.split(',');
                if (!secs || !ms) {
                    console.error('Invalid seconds format:', seconds);
                    return 0;
                }

                return (
                    hours * 3600 +
                    minutes * 60 +
                    parseInt(secs) +
                    parseInt(ms) / 1000
                );
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
                // Remove SUBTITLES_START line if present
                let content = srtContent;
                if (content.startsWith('[SUBTITLES_START]')) {
                    content = content.substring('[SUBTITLES_START]'.length).trim();
                }
                // Remove any blank lines before splitting into blocks
                const cleanedContent = content.replace(/\n\s*\n/g, '\n\n').trim();
                const blocks = cleanedContent.split('\n\n');

                blocks.forEach((block) => {
                    const lines = block.split('\n');
                    if (lines.length >= 3) {
                        const id = parseInt(lines[0]);
                        const timeParts = lines[1].split(' --> ');

                        if (timeParts.length !== 2) {
                            console.error('Invalid time format:', lines[1]);
                            return;
                        }

                        const [startStr, endStr] = timeParts;
                        const text = lines.slice(2).join('\n');

                        if (!isNaN(id) && startStr && endStr) {
                            subtitles.push({
                                id,
                                startTime: parseTimestamp(startStr.trim()),
                                endTime: parseTimestamp(endStr.trim()),
                                text,
                            });
                        }
                    }
                });

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