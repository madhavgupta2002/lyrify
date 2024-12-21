# Lyrify

A web application that generates synchronized SRT subtitles for audio files using Google's Gemini AI model.

## Features

- Upload audio files to generate synchronized lyrics
- Automatic timestamp generation for each lyric line
- Support for non-English lyrics with English translations
- Download generated subtitles in SRT format
- Modern, responsive UI with drag-and-drop support

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
```bash
export API_KEY="your_gemini_api_key"
```

4. Run the application:
```bash
python lyrics_generator.py
```

The application will be available at `http://localhost:5000`

## License

MIT 