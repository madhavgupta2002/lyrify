from flask import Flask, render_template, request, jsonify, send_file
import google.generativeai as genai
import os
from werkzeug.utils import secure_filename
import uuid
import io

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Store generated subtitles temporarily
subtitles_cache = {}

prompt = """Generate a Lyrical Subtitle File for this song in the SRT format. 
The SRT format should follow this structure for each subtitle:
1. Subtitle number
2. Timestamp in format: HH:MM:SS,mmm --> HH:MM:SS,mmm
3. Blank line
4. If the Line isnt in English, put the english translation in square brackets of the corresponding line.

For example:
1
00:00:01,000 --> 00:00:04,000
First line of lyrics

Please include accurate timestamps that match when each line is actually sung in the audio. Make sure the durations are appropriate for each line of lyrics.
Please wrap the subtitles between [SUBTITLES_START] and [SUBTITLES_END] tags."""

genai.configure(api_key=os.getenv("API_KEY"))
model = genai.GenerativeModel("gemini-exp-1206", generation_config={
    "max_output_tokens": 8192
})

def generate_lyrics(audio_path):
    audio_file = genai.upload_file(audio_path)
    response = model.generate_content([prompt, audio_file])
    response_text = response.text
    
    start_tag = "[SUBTITLES_START]"
    end_tag = "[SUBTITLES_END]"

    if start_tag in response_text and end_tag in response_text:
        subtitles = response_text[response_text.find(start_tag) + len(start_tag):response_text.find(end_tag)].strip()
    else:
        subtitles = response_text
        
    return subtitles

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    if 'audio' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            subtitles = generate_lyrics(filepath)
            os.remove(filepath)  # Clean up the uploaded file
            
            # Generate a unique ID for these subtitles and store them
            file_id = str(uuid.uuid4())
            subtitles_cache[file_id] = subtitles
            
            return jsonify({
                'subtitles': subtitles,
                'file_id': file_id
            })
        except Exception as e:
            os.remove(filepath)  # Clean up the uploaded file
            return jsonify({'error': str(e)}), 500

@app.route('/download/<file_id>')
def download_srt(file_id):
    if file_id not in subtitles_cache:
        return jsonify({'error': 'File not found'}), 404
        
    subtitles = subtitles_cache[file_id]
    
    # Create a file-like object in memory
    srt_file = io.StringIO(subtitles)
    
    # Create the response
    return send_file(
        io.BytesIO(srt_file.getvalue().encode('utf-8')),
        mimetype='text/srt',
        as_attachment=True,
        download_name='subtitles.srt'
    )

if __name__ == '__main__':
    app.run(debug=True)