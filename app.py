"""
Road Safety Inspection System - Flask Backend
For Netlify Functions deployment
"""

import os
import json
import base64
import tempfile
from datetime import datetime
from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
import cv2
import numpy as np

# Import the inspection logic
from road_inspector import RoadInspectionSystem

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Initialize inspection system
inspector = RoadInspectionSystem()
inspection_state = {
    'running': False,
    'results': None,
    'progress': 0,
    'status': 'idle'
}

@app.route('/')
def index():
    """Serve the main dashboard."""
    return render_template('dashboard.html')

@app.route('/api/start_inspection', methods=['POST'])
def start_inspection():
    """Start the inspection process."""
    global inspection_state
    
    if inspection_state['running']:
        return jsonify({'status': 'already_running'}), 400
    
    inspection_state['running'] = True
    inspection_state['progress'] = 0
    inspection_state['status'] = 'processing'
    inspection_state['results'] = None
    
    # Start processing in background (simplified for demo)
    # In production, use Celery or similar
    import threading
    thread = threading.Thread(target=process_inspection)
    thread.start()
    
    return jsonify({'status': 'started'})

def process_inspection():
    """Process the inspection in background."""
    global inspection_state
    
    try:
        # For demo, use a sample image or video
        # In production, use actual video input
        sample_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        sample_frame[:] = (30, 30, 50)  # Dark background
        
        # Add some sample lines for demo
        cv2.line(sample_frame, (100, 200), (500, 200), (0, 255, 0), 3)
        cv2.line(sample_frame, (320, 100), (320, 400), (0, 255, 255), 3)
        cv2.rectangle(sample_frame, (200, 150), (300, 250), (0, 0, 255), 2)
        
        # Analyze frame
        results = inspector.analyze_frame(sample_frame)
        
        # Convert frame to base64
        _, buffer = cv2.imencode('.jpg', sample_frame)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Prepare results
        inspection_state['results'] = {
            'overall_score': results['overall_score'],
            'quality_grade': results['grade'],
            'surface': results['surface'],
            'safety': results['safety'],
            'infrastructure': results['infrastructure'],
            'detected_defects': {
                'potholes': results['detected_defects']['potholes'],
                'cracks': results['detected_defects']['cracks'],
                'rough_patches': results['detected_defects']['rough_patches']
            },
            'detected_features': {
                'lane_markings': results['detected_features']['lane_markings'],
                'signs': results['detected_features']['signs'],
                'traffic_lights': results['detected_features']['traffic_lights'],
                'crosswalks': results['detected_features']['crosswalks']
            },
            'annotated_frame': frame_base64
        }
        
        inspection_state['status'] = 'complete'
        inspection_state['progress'] = 100
        
    except Exception as e:
        inspection_state['status'] = f'error: {str(e)}'
        inspection_state['running'] = False
    
    finally:
        inspection_state['running'] = False

@app.route('/api/get_results', methods=['GET'])
def get_results():
    """Get inspection results."""
    global inspection_state
    
    if inspection_state['status'] == 'complete':
        return jsonify({
            'status': 'complete',
            'results': inspection_state['results']
        })
    elif inspection_state['status'] == 'processing':
        return jsonify({
            'status': 'processing',
            'progress': inspection_state['progress']
        })
    elif 'error' in inspection_state['status']:
        return jsonify({
            'status': 'error',
            'message': inspection_state['status']
        })
    else:
        return jsonify({
            'status': 'idle'
        })

@app.route('/api/upload_video', methods=['POST'])
def upload_video():
    """Upload and process a video file."""
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Save uploaded file temporarily
    temp_path = tempfile.mktemp(suffix='.mp4')
    file.save(temp_path)
    
    # Process video (simplified for demo)
    # In production, implement full video processing
    
    return jsonify({
        'status': 'uploaded',
        'filename': file.filename
    })

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Get list of inspection reports."""
    # Sample reports for demo
    reports = [
        {
            'id': '1',
            'date': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'score': 87,
            'grade': 'Good'
        },
        {
            'id': '2',
            'date': (datetime.now().timestamp() - 86400),
            'score': 65,
            'grade': 'Fair'
        }
    ]
    return jsonify({'reports': reports})

@app.route('/api/export_report', methods=['GET'])
def export_report():
    """Export the inspection report."""
    global inspection_state
    
    if not inspection_state['results']:
        return jsonify({'error': 'No results to export'}), 400
    
    # Create report data
    report_data = {
        'timestamp': datetime.now().isoformat(),
        'inspector': 'thiyan',
        'results': inspection_state['results']
    }
    
    # Create temporary file
    temp_path = tempfile.mktemp(suffix='.json')
    with open(temp_path, 'w') as f:
        json.dump(report_data, f, indent=2)
    
    return send_file(temp_path, as_attachment=True, download_name='inspection_report.json')

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)