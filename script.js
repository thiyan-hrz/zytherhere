// Road Safety Inspector - Frontend Logic

// API Configuration
const API_BASE = window.location.origin + '/api';

// State
let inspectionState = {
    isRunning: false,
    currentFrame: null,
    results: null,
    history: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚦 Road Safety Inspector initialized');
    loadReports();
});

// Start Inspection
async function startInspection() {
    const overlay = document.getElementById('videoOverlay');
    overlay.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/start_inspection`, {
            method: 'POST'
        });
        
        if (response.ok) {
            inspectionState.isRunning = true;
            updateStatus('Inspection running...');
            pollResults();
        }
    } catch (error) {
        console.error('Error starting inspection:', error);
        updateStatus('Error starting inspection');
    }
}

// Poll for Results
async function pollResults() {
    if (!inspectionState.isRunning) return;
    
    try {
        const response = await fetch(`${API_BASE}/get_results`);
        const data = await response.json();
        
        if (data.status === 'complete') {
            inspectionState.isRunning = false;
            updateResults(data.results);
            updateStatus('Inspection complete');
        } else if (data.status === 'processing') {
            updateStatus(`Processing... ${data.progress || 0}%`);
            setTimeout(pollResults, 1000);
        } else {
            setTimeout(pollResults, 2000);
        }
    } catch (error) {
        console.error('Error polling results:', error);
        setTimeout(pollResults, 3000);
    }
}

// Update Results Display
function updateResults(results) {
    if (!results) return;
    
    // Update stats
    document.getElementById('overallScore').textContent = results.overall_score?.toFixed(0) + '%' || '--%';
    document.getElementById('surfaceScore').textContent = results.surface?.score?.toFixed(0) + '%' || '--%';
    document.getElementById('safetyScore').textContent = results.safety?.score?.toFixed(0) + '%' || '--%';
    document.getElementById('infraScore').textContent = results.infrastructure?.score?.toFixed(0) + '%' || '--%';
    
    // Update grade
    const grade = results.quality_grade || 'Pending';
    document.getElementById('qualityGrade').textContent = grade;
    document.getElementById('qualityGrade').style.color = getGradeColor(grade);
    
    // Update defects
    const defects = results.detected_defects || {};
    document.getElementById('potholeCount').textContent = defects.potholes?.length || 0;
    document.getElementById('crackCount').textContent = defects.cracks?.length || 0;
    document.getElementById('roughCount').textContent = defects.rough_patches?.length || 0;
    
    // Update safety features
    const features = results.detected_features || {};
    document.getElementById('laneStatus').textContent = features.lane_markings?.length > 0 ? '✅ Visible' : '⚠️ Missing';
    document.getElementById('signStatus').textContent = features.signs?.length > 0 ? '✅ Detected' : '⚠️ Not Found';
    document.getElementById('lightStatus').textContent = features.traffic_lights?.length > 0 ? '✅ Working' : '⚠️ Missing';
    document.getElementById('crosswalkStatus').textContent = features.crosswalks?.length > 0 ? '✅ Visible' : '⚠️ Missing';
    
    // Update video feed if available
    if (results.annotated_frame) {
        document.getElementById('videoFeed').src = `data:image/jpeg;base64,${results.annotated_frame}`;
    }
}

// Get Grade Color
function getGradeColor(grade) {
    const colors = {
        'Excellent': '#00ff88',
        'Good': '#4CAF50',
        'Fair': '#FFC107',
        'Poor': '#FF5722',
        'Critical': '#FF0000'
    };
    return colors[grade] || '#8899aa';
}

// Update Status
function updateStatus(message) {
    const overlay = document.getElementById('videoOverlay');
    const statusEl = overlay.querySelector('p');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

// Upload Video
function uploadVideo() {
    document.getElementById('uploadModal').classList.add('show');
}

function closeModal() {
    document.getElementById('uploadModal').classList.remove('show');
}

// Process Upload
async function processUpload() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Please select a video file');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('video', file);
    
    try {
        const response = await fetch(`${API_BASE}/upload_video`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            closeModal();
            updateStatus('Processing uploaded video...');
            startInspection();
        }
    } catch (error) {
        console.error('Error uploading video:', error);
        alert('Error uploading video');
    }
}

// Load Reports
async function loadReports() {
    try {
        const response = await fetch(`${API_BASE}/reports`);
        if (response.ok) {
            const data = await response.json();
            displayReports(data.reports || []);
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

function displayReports(reports) {
    const container = document.getElementById('reportList');
    if (!reports || reports.length === 0) {
        container.innerHTML = `
            <div class="report-item">
                <div class="report-info">
                    <span class="report-date">No reports available</span>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reports.map(report => `
        <div class="report-item">
            <div class="report-info">
                <span class="report-date">${report.date || 'Unknown date'}</span>
                <span class="report-score">Score: ${report.score || '--'}%</span>
            </div>
            <button class="btn-small" onclick="viewReport('${report.id}')">
                <i class="fas fa-eye"></i>
            </button>
        </div>
    `).join('');
}

// View Report
function viewReport(reportId) {
    // Navigate to report detail page
    window.location.href = `/report/${reportId}`;
}

// Export Report
function exportReport() {
    if (!inspectionState.results) {
        alert('No results to export');
        return;
    }
    
    window.location.href = `${API_BASE}/export_report`;
}

// Toggle Play
function togglePlay() {
    const btn = document.querySelector('.video-controls button:first-child i');
    if (inspectionState.isRunning) {
        btn.className = 'fas fa-pause';
    } else {
        btn.className = 'fas fa-play';
    }
}

// Capture Frame
function captureFrame() {
    const img = document.getElementById('videoFeed');
    if (img.src) {
        const link = document.createElement('a');
        link.download = `inspection_${Date.now()}.jpg`;
        link.href = img.src;
        link.click();
    }
}

// Refresh Reports
function refreshReports() {
    loadReports();
}

// File input change handler
document.getElementById('fileInput').addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const fileName = this.files[0].name;
        document.querySelector('.upload-area p').textContent = `Selected: ${fileName}`;
    }
});

// Drag and drop support
const uploadArea = document.querySelector('.upload-area');
if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#00ff88';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            document.getElementById('fileInput').files = files;
            document.querySelector('.upload-area p').textContent = `Selected: ${files[0].name}`;
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        togglePlay();
    }
    if (e.key === 's' || e.key === 'S') {
        captureFrame();
    }
    if (e.key === 'Escape') {
        closeModal();
    }
});