# Lyrify

A web application that generates synchronized SRT subtitles for audio files using Google's Gemini AI model.

## Features

- Upload audio files to generate synchronized lyrics
- Automatic timestamp generation for each lyric line
- Support for non-English lyrics with English translations
- Download generated subtitles in SRT format
- Modern, responsive UI with drag-and-drop support
- Optional custom Gemini API key input

## Tech Stack

- Backend: Flask (Python)
- Frontend: HTML, JavaScript, Tailwind CSS
- AI: Google Gemini AI

## Setup

1. Clone the repository:
```bash
git clone https://github.com/madhavgupta2002/lyrify.git
cd lyrify
```

2. Install dependencies:
```bash
pip install flask google-generativeai werkzeug
```

3. Set up your Google API key:
   - Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` and add your Gemini API key
   - Alternatively, you can provide the API key through the web interface when using the application

4. Run the application:
```bash
python lyrics_generator.py
```

The application will be available at `http://localhost:5000`

## Usage

1. Open the application in your web browser
2. (Optional) Click "Use Custom API Key" to enter your own Gemini API key
3. Upload an audio file using the drag-and-drop interface
4. Click "Generate Lyrics" to create synchronized subtitles
5. Download the generated SRT file using the "Download SRT File" button

## License

MIT 
