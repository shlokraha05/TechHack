import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from analyzer import StructuralAnalyzer

# Path to your frontend folder
FRONTEND_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_FOLDER)
# Enable CORS for all routes
CORS(app)

# --- NEW: Serve the UI directly on http://localhost:5000 ---
@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_FOLDER, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(FRONTEND_FOLDER, filename)
# -----------------------------------------------------------

@app.route('/analyze', methods=['POST'])
def analyze():
    # Check if image was sent
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
        
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        image_bytes = file.read()
        analyzer = StructuralAnalyzer(image_bytes)
        result = analyzer.process()
        
        return jsonify(result), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app on port 5000
    app.run(debug=True, port=5000)
