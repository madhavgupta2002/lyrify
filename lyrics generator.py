import google.generativeai as genai
import os

prompt = """Generate a Lyrical Subtitle File for this song in the SRT format. 
The SRT format should follow this structure for each subtitle:
1. Subtitle number
2. Timestamp in format: HH:MM:SS,mmm --> HH:MM:SS,mmm
3. Blank line

For example:
1
00:00:01,000 --> 00:00:04,000
First line of lyrics

Please include accurate timestamps that match when each line is actually sung in the audio. Make sure the durations are appropriate for each line of lyrics.
Please wrap the subtitles between [SUBTITLES_START] and [SUBTITLES_END] tags."""

genai.configure(api_key="AIzaSyALYOu3CPnz4rGCHL0rtQvE6JB9xL3PRu0")
model = genai.GenerativeModel("gemini-exp-1206", generation_config={
    "max_output_tokens": 8192
})

# Load the audio file
audio_url = "audio.mp3"  # Replace with your audio URL
audio_file = genai.upload_file(audio_url)

# Generate response from audio
response = model.generate_content([prompt, audio_file])
# Extract subtitles from response
response_text = response.text
start_tag = "[SUBTITLES_START]"
end_tag = "[SUBTITLES_END]"

if start_tag in response_text and end_tag in response_text:
    subtitles = response_text[response_text.find(start_tag) + len(start_tag):response_text.find(end_tag)].strip()
else:
    subtitles = response_text

# Write subtitles to subs.srt file
with open("subs.srt", "w", encoding="utf-8") as f:
    f.write(subtitles)
print("Subtitles have been saved to subs.srt")