from flask import Flask, request, jsonify
from flask_cors import CORS
from job_scraper import scrape_url, ScrapeError

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'success': True, 'status': 'ok' })

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.get_json()
    url  = data.get('url', '').strip()

    if not url:
        return jsonify({ 'success': False, 'message': 'URL is required.' }), 422

    try:
        result = scrape_url(url)
        if not result:
            return jsonify({ 'success': False, 'message': 'Failed to scrape this URL.' }), 422

        return jsonify({ 'success': True, 'data': result })

    except ScrapeError as e:
        return jsonify({ 'success': False, 'message': str(e) }), 422

    except Exception as e:
        return jsonify({ 'success': False, 'message': str(e) }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)