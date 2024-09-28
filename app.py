from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

API_KEY = '3ce92aa806b4c527acf526324f6cd8e9'  # Replace with your TMDb API key
API_URL = 'https://api.themoviedb.org/3'

# Function to fetch movies based on genre ID
def fetch_movies(genre_id=None):
    try:
        url = f"{API_URL}/discover/movie?api_key={API_KEY}&sort_by=popularity.desc"
        if genre_id:
            url += f"&with_genres={genre_id}"
        
        response = requests.get(url)
        response.raise_for_status()  # Check if the request was successful
        data = response.json()
        return data.get('results', [])
    except requests.RequestException as e:
        print(f"Error fetching movies: {e}")
        return []

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/movies', methods=['POST'])
def filter_movies():
    genre = request.form.get('genre')
    genre_ids = {
        'action': 28,
        'comedy': 35,
        'romance': 10749
    }
    genre_id = genre_ids.get(genre, '')

    movies = fetch_movies(genre_id)
    return jsonify(movies)

if __name__ == '__main__':
    app.run(debug=True)
