/**
 * Industrial Computer Vision Hub - Core Script Engine
 * Dev/Creator : tubakhxn
 * Includes: System time, multi-tab routing, log streamer, settings config,
 * and high-fidelity canvas computer vision simulations.
 */

// ─── STATE MANAGEMENT & SETTINGS ─────────────────────────────────────────────
let activeTab = 'home';
let systemLogs = [];
const maxLogs = 50;

// Configurable parameters (Default matching Python scripts)
let confThreshold = 0.28;
let iouThreshold = 0.40;
let trailLength = 40;
let scanlineIntensity = 0.20;
let alertFlashTriggers = true;

// Tab header text definitions
const headerText = {
    home: { title: 'Overview Dashboard', subtitle: 'Real-time status of computer vision subsystems' },
    wildlife: { title: 'Wildlife & Bird Monitor', subtitle: 'Real-time bird population metrics and migration paths' },
    traffic: { title: 'Traffic Intersection Intel', subtitle: 'Automated roundabout lane analysis and congestion scoring' },
    flood: { title: 'Flood Risk Predictor', subtitle: 'Neural river segmentation and infrastructure warning alerts' },
    upload: { title: 'Custom Media Analyzer', subtitle: 'Run simulated YOLO inference on uploaded video or images' },
    settings: { title: 'AI System Configurations', subtitle: 'Fine-tune threshold limits, tracker history, and HUD visual effects' }
};

// Subsystem mappings for log labels
const tabSubsystems = {
    home: 'Overview',
    wildlife: 'ECOLOGICAL_AI',
    traffic: 'TRAFFIC_AI',
    flood: 'FLOOD_RISK_AI',
    upload: 'CUSTOM_INFERENCE',
    settings: 'SYSTEM_CONFIG'
};

// Mini Chart helper class
class MiniChart {
    constructor(canvasId, maxPoints = 20, color = '#00e6ff') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.maxPoints = maxPoints;
        this.color = color;
        this.data = Array(maxPoints).fill(0);
    }

    pushValue(val) {
        if (!this.canvas) return;
        this.data.push(val);
        if (this.data.length > this.maxPoints) {
            this.data.shift();
        }
        this.draw();
    }

    draw() {
        if (!this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const padding = 5;

        ctx.clearRect(0, 0, w, h);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            let y = padding + (i * (h - padding * 2)) / 3;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        const maxVal = Math.max(...this.data, 5);
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        
        const stepX = w / (this.maxPoints - 1);
        for (let i = 0; i < this.data.length; i++) {
            let val = this.data[i];
            let x = i * stepX;
            let y = h - padding - ((val / maxVal) * (h - padding * 2));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Fill area under line
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = this.color === '#00e6ff' ? 'rgba(0, 230, 255, 0.05)' : 'rgba(0, 255, 120, 0.05)';
        ctx.fill();
    }
}

// Initializing Charts
let wlChart, trChart;

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTime();
    initRouting();
    initSettings();
    initLogStreamer();
    initUploadTab();

    wlChart = new MiniChart('chart-wildlife', 20, '#00e6ff');
    trChart = new MiniChart('chart-traffic', 20, '#00ff78');

    // Boot complete logs
    addLog('[SYSTEM] All subsystems initialized successfully.', 'text-green');
    addLog('[HARDWARE] Neural cores initialized. Memory: 16.0 GB CUDA Shared VRAM.', 'text-cyan');
    
    // Start central animation loop
    requestAnimationFrame(animationLoop);
});

// Update System Clock (with exact current date)
function initTime() {
    const timeEl = document.getElementById('system-time');
    const updateTime = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const s = String(d.getSeconds()).padStart(2, '0');
        timeEl.textContent = `${y}-${m}-${day}  ${h}:${min}:${s}`;
    };
    setInterval(updateTime, 1000);
    updateTime();
}

// Terminal log adding helper
function addLog(text, type = '') {
    const consoleBody = document.getElementById('terminal-logs');
    if (!consoleBody) return;
    
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    const line = document.createElement('div');
    line.className = 'log-line';
    if (type) line.classList.add(type);
    line.textContent = `[${time}] ${text}`;
    
    consoleBody.appendChild(line);
    systemLogs.push(line);
    
    if (systemLogs.length > maxLogs) {
        const removed = systemLogs.shift();
        removed.remove();
    }
    
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

// Tab routing controls
function initRouting() {
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    const termSubsystemEl = document.getElementById('term-subsystem');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            if (!tab) return;
            
            navItems.forEach(n => n.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(`screen-${tab}`).classList.add('active');
            
            activeTab = tab;
            
            // Header titles update
            titleEl.textContent = headerText[tab].title;
            subtitleEl.textContent = headerText[tab].subtitle;
            termSubsystemEl.textContent = `Active Subsystem: ${tabSubsystems[tab]}`;
            
            addLog(`Subsystem routing requested: Loading ${tabSubsystems[tab]} views.`, 'text-cyan');
        });
    });

    // Home cards clickable navigation shortcuts
    const cards = document.querySelectorAll('.subsystem-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-target');
            const correspondingNavItem = document.querySelector(`.nav-item[data-tab="${target}"]`);
            if (correspondingNavItem) correspondingNavItem.click();
        });
    });
}

// System settings controls
function initSettings() {
    const setConf = document.getElementById('set-conf');
    const setIou = document.getElementById('set-iou');
    const setTrail = document.getElementById('set-trail');
    const setScanline = document.getElementById('set-scanline');
    const setFlash = document.getElementById('set-flash');
    
    const valConf = document.getElementById('val-conf');
    const valIou = document.getElementById('val-iou');
    const valTrail = document.getElementById('val-trail');
    const valScanline = document.getElementById('val-scanline');
    
    const updateDisplays = () => {
        valConf.textContent = (setConf.value / 100).toFixed(2);
        valIou.textContent = (setIou.value / 100).toFixed(2);
        valTrail.textContent = setTrail.value;
        valScanline.textContent = setScanline.value + '%';
    };

    const loadValues = () => {
        confThreshold = setConf.value / 100;
        iouThreshold = setIou.value / 100;
        trailLength = parseInt(setTrail.value);
        scanlineIntensity = setScanline.value / 100;
        alertFlashTriggers = setFlash.checked;
    };

    [setConf, setIou, setTrail, setScanline].forEach(slider => {
        slider.addEventListener('input', () => {
            updateDisplays();
            loadValues();
        });
    });
    setFlash.addEventListener('change', loadValues);

    document.getElementById('btn-save-settings').addEventListener('click', () => {
        addLog('[SETTINGS] Configurations updated in local JSON cache.', 'text-green');
    });

    document.getElementById('btn-default-settings').addEventListener('click', () => {
        setConf.value = 28;
        setIou.value = 40;
        setTrail.value = 40;
        setScanline.value = 20;
        setFlash.checked = true;
        updateDisplays();
        loadValues();
        addLog('[SETTINGS] Restored default factory neural properties.', 'text-yellow');
    });

    updateDisplays();
    loadValues();
}

// Background log stream simulation
function initLogStreamer() {
    setInterval(() => {
        if (activeTab === 'wildlife') {
            const classIds = [14, 15, 16, 21];
            const names = ['bird', 'cat', 'dog', 'bear'];
            const idx = Math.floor(Math.random() * names.length);
            const id = Math.floor(Math.random() * 30) + 1;
            const conf = (Math.random() * 0.2 + 0.78).toFixed(2);
            addLog(`[INFERENCE] YOLOv8 Class ${classIds[idx]} (${names[idx]}) detected. Tracking ID: #${id}. Conf: ${conf}`);
        } else if (activeTab === 'traffic') {
            const directions = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
            const cars = ['sedan', 'truck', 'motorcycle', 'bus'];
            const dIdx = Math.floor(Math.random() * directions.length);
            const cIdx = Math.floor(Math.random() * cars.length);
            const id = Math.floor(Math.random() * 50) + 10;
            addLog(`[TRAFFIC] Vehicle detected at ${directions[dIdx]} zone. Class: ${cars[cIdx]}. Track ID: #${id}. Speed: ${Math.floor(Math.random()*20+35)} km/h.`);
        } else if (activeTab === 'flood') {
            const risk = document.getElementById('fl-badge').textContent;
            const cov = document.getElementById('fl-coverage').textContent;
            if (risk === 'CRITICAL') {
                addLog(`[WARN] Critical flooding detected. Water Coverage: ${cov}. EVACUATE urban blocks immediately.`, 'text-red');
            } else if (risk === 'DANGER') {
                addLog(`[WARN] Water levels entering danger zone. Infrastructure warning trigger.`, 'text-orange');
            } else {
                addLog(`[FLOOD] Water body contours mapped. Coverage: ${cov}. Depth estimate active.`);
            }
        }
    }, 4500);
}

// ─── PROCEDURAL SIMULATIONS (CANVAS BASED) ───────────────────────────────────

// Generic Drawing Helpers
function drawHUDScanlines(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;
    
    // Draw sci-fi border grid overlay
    ctx.strokeStyle = 'rgba(0, 230, 255, 0.05)';
    ctx.lineWidth = 1;
    const size = 40;
    for(let x=0; x<w; x+=size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for(let y=0; y<h; y+=size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    // Draw horizontal running scanline overlay
    if (scanlineIntensity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${scanlineIntensity})`;
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 1);
        }
    }
}

function drawBoundingBox(ctx, x, y, width, height, label, conf, id, colorString = '#00e6ff') {
    ctx.strokeStyle = colorString;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, width, height);

    // Bounding box neon corners
    ctx.fillStyle = colorString;
    const cornerSize = 6;
    // Top Left
    ctx.fillRect(x-1, y-1, cornerSize, 2);
    ctx.fillRect(x-1, y-1, 2, cornerSize);
    // Top Right
    ctx.fillRect(x+width - cornerSize + 1, y-1, cornerSize, 2);
    ctx.fillRect(x+width-1, y-1, 2, cornerSize);
    // Bottom Left
    ctx.fillRect(x-1, y+height-1, cornerSize, 2);
    ctx.fillRect(x-1, y+height-cornerSize + 1, 2, cornerSize);
    // Bottom Right
    ctx.fillRect(x+width - cornerSize + 1, y+height-1, cornerSize, 2);
    ctx.fillRect(x+width-1, y+height-cornerSize + 1, 2, cornerSize);

    // Text Badge overlay
    ctx.font = '9px monospace';
    const text = `${label} #${id} [${(conf*100).toFixed(0)}%]`;
    const textW = ctx.measureText(text).width + 6;
    ctx.fillRect(x - 1, y - 13, textW, 12);

    ctx.fillStyle = '#060913';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(text, x + 2, y - 4);
}

// 1. WILDLIFE SYSTEM
const wildlifeState = {
    particles: [],
    heatmapData: [],
    showHeatmap: false,
    totalCounted: 0,
    birdsActive: 0,
    animalsActive: 0,
    lastChartUpdate: 0,
};

function initWildlifeParticles() {
    wildlifeState.particles = [];
    // Spawn 8 Birds (represented as particles flying)
    for (let i = 0; i < 8; i++) {
        wildlifeState.particles.push({
            id: i + 1,
            type: 'bird',
            x: Math.random() * 700 + 50,
            y: Math.random() * 200 + 40,
            vx: Math.random() * 2 + 1,
            vy: (Math.random() - 0.5) * 1.2,
            size: 16,
            trail: [],
            conf: Math.random() * 0.15 + 0.82
        });
        wildlifeState.totalCounted++;
    }
    // Spawn 4 Deer/Animals (moving on ground)
    for (let i = 0; i < 4; i++) {
        wildlifeState.particles.push({
            id: i + 9,
            type: 'animal',
            x: Math.random() * 700 + 50,
            y: Math.random() * 120 + 320,
            vx: Math.random() * 1 + 0.5,
            vy: (Math.random() - 0.5) * 0.4,
            size: 24,
            trail: [],
            conf: Math.random() * 0.12 + 0.85
        });
        wildlifeState.totalCounted++;
    }
}

function updateWildlife(canvas, ctx) {
    if (wildlifeState.particles.length === 0) {
        initWildlifeParticles();
    }

    const w = canvas.width;
    const h = canvas.height;

    // Draw background (Forest environment visualization)
    ctx.fillStyle = '#060f0d'; // Forest dark base
    ctx.fillRect(0, 0, w, h);
    
    // Draw landscape ground
    ctx.fillStyle = '#081711';
    ctx.beginPath();
    ctx.moveTo(0, 310);
    ctx.bezierCurveTo(200, 290, 500, 330, w, 300);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // Draw trees simple visual vectors
    ctx.fillStyle = '#05110c';
    ctx.fillRect(80, 200, 15, 120);
    ctx.fillRect(680, 190, 20, 130);
    ctx.beginPath();
    ctx.arc(87, 180, 55, 0, Math.PI * 2);
    ctx.arc(690, 160, 70, 0, Math.PI * 2);
    ctx.fill();

    // Draw HUD system telemetry elements
    ctx.fillStyle = 'rgba(0, 230, 255, 0.05)';
    ctx.fillRect(10, 10, w - 20, 32);
    ctx.strokeStyle = 'rgba(0, 230, 255, 0.15)';
    ctx.strokeRect(10, 10, w - 20, 32);
    ctx.fillStyle = '#00e6ff';
    ctx.font = '10px monospace';
    ctx.fillText('⚡ YOLOv8 ECOLOGICAL RADAR FEED  |  MODELS LOADED: yolo_wildlife.pt', 22, 30);
    
    // Update and draw particles
    let birdVxSum = 0, birdVySum = 0, birdCount = 0;
    let animCount = 0;

    wildlifeState.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Keep trail points
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > trailLength) p.trail.shift();

        // Bounds wrap around
        if (p.type === 'bird') {
            if (p.x > w + 20) { p.x = -20; p.y = Math.random() * 200 + 40; p.id = Math.floor(Math.random()*50)+20; p.conf = Math.random()*0.15+0.8; wildlifeState.totalCounted++; }
            if (p.y < 20 || p.y > 260) p.vy = -p.vy;
            birdVxSum += p.vx;
            birdVySum += p.vy;
            birdCount++;
        } else {
            if (p.x > w + 25) { p.x = -25; p.y = Math.random() * 100 + 320; p.id = Math.floor(Math.random()*50)+20; p.conf = Math.random()*0.15+0.8; wildlifeState.totalCounted++; }
            if (p.y < 310 || p.y > h - 30) p.vy = -p.vy;
            animCount++;
        }

        // Push positions to heatmap data pool
        if (Math.random() < 0.15) {
            wildlifeState.heatmapData.push({ x: p.x, y: p.y, intensity: 20 });
        }

        // Draw Trails
        ctx.beginPath();
        ctx.strokeStyle = p.type === 'bird' ? 'rgba(0, 230, 255, 0.35)' : 'rgba(0, 255, 120, 0.35)';
        ctx.lineWidth = 1;
        p.trail.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Draw Bounding Boxes and ID badges
        const color = p.type === 'bird' ? '#00e6ff' : '#00ff78';
        drawBoundingBox(ctx, p.x - p.size/2, p.y - p.size/2, p.size, p.size, p.type, p.conf, p.id, color);
        
        // Render simple bird/animal drawings inside bounding boxes
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
        ctx.fill();
    });

    // Cleanup heatmap data if it gets too large
    if (wildlifeState.heatmapData.length > 300) {
        wildlifeState.heatmapData.splice(0, 50);
    }

    // Render Heatmap overlay if active
    if (wildlifeState.showHeatmap) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw intensity blobs
        wildlifeState.heatmapData.forEach(h => {
            let rad = 30;
            let grad = tempCtx.createRadialGradient(h.x, h.y, 0, h.x, h.y, rad);
            grad.addColorStop(0, `rgba(255, 0, 0, 0.25)`);
            grad.addColorStop(0.5, `rgba(255, 230, 0, 0.08)`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            tempCtx.fillStyle = grad;
            tempCtx.beginPath();
            tempCtx.arc(h.x, h.y, rad, 0, Math.PI*2);
            tempCtx.fill();
        });
        ctx.globalAlpha = 0.75;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
        
        // Draw Heatmap scale marker in bottom left corner
        ctx.fillStyle = 'rgba(6, 9, 19, 0.8)';
        ctx.fillRect(20, h - 50, 160, 30);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(20, h - 50, 160, 30);
        let scaleGrad = ctx.createLinearGradient(30, 0, 170, 0);
        scaleGrad.addColorStop(0, '#0000ff');
        scaleGrad.addColorStop(0.5, '#ffff00');
        scaleGrad.addColorStop(1, '#ff0000');
        ctx.fillStyle = scaleGrad;
        ctx.fillRect(30, h - 42, 140, 6);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText('LOW DENSITY', 30, h - 28);
        ctx.fillText('HIGH DENSITY', 125, h - 28);
    }

    // Update telemetry display DOM nodes
    wildlifeState.birdsActive = birdCount;
    wildlifeState.animalsActive = animCount;
    
    document.getElementById('wl-birds').textContent = birdCount;
    document.getElementById('wl-animals').textContent = animCount;
    document.getElementById('wl-total').textContent = wildlifeState.totalCounted;

    // Calculate bird migration flow direction vector
    const avgVx = birdVxSum / Math.max(birdCount, 1);
    const avgVy = birdVySum / Math.max(birdCount, 1);
    const angleRad = Math.atan2(avgVy, avgVx);
    const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;
    
    let directionStr = 'EAST';
    if (angleDeg > 337.5 || angleDeg <= 22.5) directionStr = 'E';
    else if (angleDeg > 22.5 && angleDeg <= 67.5) directionStr = 'ESE';
    else if (angleDeg > 67.5 && angleDeg <= 112.5) directionStr = 'SE';
    else if (angleDeg > 112.5 && angleDeg <= 157.5) directionStr = 'SSE';
    else if (angleDeg > 157.5 && angleDeg <= 202.5) directionStr = 'S';
    else if (angleDeg > 202.5 && angleDeg <= 247.5) directionStr = 'WSW';
    else if (angleDeg > 247.5 && angleDeg <= 292.5) directionStr = 'W';
    else directionStr = 'ENE';

    const outputDir = `${directionStr} (${angleDeg.toFixed(0)}°)`;
    document.getElementById('wl-migration').textContent = outputDir;
    document.getElementById('home-wildlife-count').textContent = birdCount + animCount;
    document.getElementById('home-wildlife-dir').textContent = directionStr;

    // Draw flow directional vector arrow on HUD top-right
    ctx.strokeStyle = '#00e6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w - 50, 80, 20, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(w - 50, 80);
    const arrowX = w - 50 + Math.cos(angleRad) * 15;
    const arrowY = 80 + Math.sin(angleRad) * 15;
    ctx.lineTo(arrowX, arrowY);
    ctx.stroke();

    ctx.font = '8px monospace';
    ctx.fillStyle = '#00e6ff';
    ctx.fillText('MIGRATION FLOW', w - 90, 115);

    // Update Chart every 2.5 seconds
    const now = Date.now();
    if (now - wildlifeState.lastChartUpdate > 2500) {
        wlChart.pushValue(birdCount + animCount);
        wildlifeState.lastChartUpdate = now;
    }
}

// 2. TRAFFIC INTERSECTION SYSTEM
const trafficState = {
    vehicles: [],
    totDetected: 0,
    showZones: true,
    lastChartUpdate: 0,
    wrongWayAlerts: 0,
    greenLightTime: 0,
    signalColor: 'GREEN'
};

function spawnVehicle() {
    const directions = ['N', 'S', 'E', 'W'];
    const origin = directions[Math.floor(Math.random() * directions.length)];
    const types = ['car', 'truck', 'motorcycle', 'bus'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let x, y, vx, vy, size;
    const speed = Math.random() * 1.5 + 1.2;
    const wrongWay = Math.random() < 0.05; // 5% chance of wrong-way drivers

    if (origin === 'N') {
        x = 380; y = -20; vx = 0; vy = speed * (wrongWay ? -0.8 : 1); size = 18;
    } else if (origin === 'S') {
        x = 420; y = 500; vx = 0; vy = -speed * (wrongWay ? -0.8 : 1); size = 18;
    } else if (origin === 'W') {
        x = -20; y = 260; vx = speed * (wrongWay ? -0.8 : 1); vy = 0; size = 18;
    } else { // E
        x = 820; y = 220; vx = -speed * (wrongWay ? -0.8 : 1); vy = 0; size = 18;
    }

    if (type === 'truck') size = 26;
    if (type === 'motorcycle') size = 12;
    if (type === 'bus') size = 28;

    trafficState.vehicles.push({
        id: Math.floor(Math.random() * 899) + 100,
        type: type,
        x: x, y: y, vx: vx, vy: vy, size: size,
        trail: [],
        conf: Math.random() * 0.12 + 0.84,
        wrongWay: wrongWay,
        logged: false
    });
    trafficState.totDetected++;
}

function updateTraffic(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;

    // Draw intersection layout base
    ctx.fillStyle = '#0d131f'; // Deep road base
    ctx.fillRect(0, 0, w, h);

    // Draw Cross lanes
    ctx.fillStyle = '#171f2e';
    ctx.fillRect(350, 0, 100, h); // vertical lane
    ctx.fillRect(0, 190, w, 100); // horizontal lane

    // Roundabout Center circle block
    ctx.fillStyle = '#222d3d';
    ctx.strokeStyle = 'rgba(0, 230, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(400, 240, 60, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Road lane markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([10, 15]);
    ctx.lineWidth = 1;
    // Vert centers
    ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 180); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(400, 300); ctx.lineTo(400, h); ctx.stroke();
    // Horiz centers
    ctx.beginPath(); ctx.moveTo(0, 240); ctx.lineTo(340, 240); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(460, 240); ctx.lineTo(w, 240); ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw 4 Colored zones if highlighted
    if (trafficState.showZones) {
        ctx.lineWidth = 1;
        // North (Blue)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fillRect(350, 10, 100, 120);
        ctx.strokeRect(350, 10, 100, 120);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('[NORTH_ZONE]', 355, 22);

        // East (Red/Pink)
        ctx.fillStyle = 'rgba(255, 59, 48, 0.06)';
        ctx.strokeStyle = 'rgba(255, 59, 48, 0.2)';
        ctx.fillRect(520, 190, 260, 100);
        ctx.strokeRect(520, 190, 260, 100);
        ctx.fillStyle = 'rgba(255, 59, 48, 0.5)';
        ctx.fillText('[EAST_ZONE]', 530, 204);

        // South (Green)
        ctx.fillStyle = 'rgba(0, 255, 120, 0.06)';
        ctx.strokeStyle = 'rgba(0, 255, 120, 0.2)';
        ctx.fillRect(350, 350, 100, 120);
        ctx.strokeRect(350, 350, 100, 120);
        ctx.fillStyle = 'rgba(0, 255, 120, 0.5)';
        ctx.fillText('[SOUTH_ZONE]', 355, 362);

        // West (Yellow/Gold)
        ctx.fillStyle = 'rgba(255, 210, 0, 0.06)';
        ctx.strokeStyle = 'rgba(255, 210, 0, 0.2)';
        ctx.fillRect(20, 190, 260, 100);
        ctx.strokeRect(20, 190, 260, 100);
        ctx.fillStyle = 'rgba(255, 210, 0, 0.5)';
        ctx.fillText('[WEST_ZONE]', 30, 204);
    }

    // Traffic Signal Timer Simulation
    trafficState.greenLightTime++;
    if (trafficState.greenLightTime > 250) {
        trafficState.signalColor = trafficState.signalColor === 'GREEN' ? 'RED' : 'GREEN';
        trafficState.greenLightTime = 0;
        addLog(`[TRAFFIC] Signal light changed to ${trafficState.signalColor}`, 'text-yellow');
    }

    // Render central HUD signals indicators
    ctx.fillStyle = trafficState.signalColor === 'GREEN' ? '#00ff78' : '#ff3b30';
    ctx.beginPath();
    ctx.arc(400, 240, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Spawning vehicles randomly
    if (Math.random() < 0.02 && trafficState.vehicles.length < 12) {
        spawnVehicle();
    }

    // Update and draw vehicles
    let counts = { N: 0, E: 0, S: 0, W: 0 };
    let stoppedCount = 0;

    for (let i = trafficState.vehicles.length - 1; i >= 0; i--) {
        const v = trafficState.vehicles[i];
        
        // Roundabout slowdown/traffic signal check
        let isStopped = false;
        if (trafficState.signalColor === 'RED') {
            // Stop logic for N heading down, S heading up, etc.
            if (v.vy > 0 && v.y > 100 && v.y < 120) { v.y = 100; isStopped = true; }
            if (v.vy < 0 && v.y < 380 && v.y > 360) { v.y = 380; isStopped = true; }
            if (v.vx > 0 && v.x > 180 && v.x < 200) { v.x = 180; isStopped = true; }
            if (v.vx < 0 && v.x < 620 && v.x > 600) { v.x = 620; isStopped = true; }
        }

        if (!isStopped) {
            v.x += v.vx;
            v.y += v.vy;
            
            // Proximity navigation curves around roundabout center
            const dx = v.x - 400;
            const dy = v.y - 240;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 80) {
                // Apply a gentle rotational drift
                if (v.vx > 0) v.y += 0.8;
                if (v.vx < 0) v.y -= 0.8;
                if (v.vy > 0) v.x -= 0.8;
                if (v.vy < 0) v.x += 0.8;
            }
        } else {
            stoppedCount++;
        }

        // Keep trail points
        v.trail.push({ x: v.x, y: v.y });
        if (v.trail.length > trailLength) v.trail.shift();

        // Increment counts per zone
        if (v.y > 10 && v.y < 130 && v.x > 350 && v.x < 450) counts.N++;
        if (v.x > 520 && v.x < 780 && v.y > 190 && v.y < 290) counts.E++;
        if (v.y > 350 && v.y < 470 && v.x > 350 && v.x < 450) counts.S++;
        if (v.x > 20 && v.x < 280 && v.y > 190 && v.y < 290) counts.W++;

        // Out of bounds check
        if (v.x < -40 || v.x > w + 40 || v.y < -40 || v.y > h + 40) {
            trafficState.vehicles.splice(i, 1);
            continue;
        }

        // Draw Trails
        ctx.beginPath();
        ctx.strokeStyle = '#00ff78';
        ctx.lineWidth = 1;
        v.trail.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Draw direction arrow inside trails
        if (v.trail.length > 2 && !isStopped) {
            const last = v.trail[v.trail.length - 1];
            const prev = v.trail[v.trail.length - 3];
            const aRad = Math.atan2(last.y - prev.y, last.x - prev.x);
            ctx.fillStyle = '#00ff78';
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(last.x - Math.cos(aRad - 0.3) * 6, last.y - Math.sin(aRad - 0.3) * 6);
            ctx.lineTo(last.x - Math.cos(aRad + 0.3) * 6, last.y - Math.sin(aRad + 0.3) * 6);
            ctx.fill();
        }

        // Draw bounding box
        const color = v.wrongWay ? '#ff3b30' : '#00ff78';
        drawBoundingBox(ctx, v.x - v.size/2, v.y - v.size/2, v.size, v.size, v.type, v.conf, v.id, color);
        
        // Log wrong-way trigger
        if (v.wrongWay && !v.logged) {
            v.logged = true;
            trafficState.wrongWayAlerts++;
            addLog(`[TRAFFIC_ALERT] Wrong-way vehicle detected! ID: #${v.id}. Type: ${v.type}.`, 'text-red');
        }
    }

    // Update UI Stats Elements
    document.getElementById('tr-north').textContent = counts.N;
    document.getElementById('tr-east').textContent = counts.E;
    document.getElementById('tr-south').textContent = counts.S;
    document.getElementById('tr-west').textContent = counts.W;
    
    document.getElementById('tr-north-bar').style.width = Math.min(counts.N*20, 100) + '%';
    document.getElementById('tr-east-bar').style.width = Math.min(counts.E*20, 100) + '%';
    document.getElementById('tr-south-bar').style.width = Math.min(counts.S*20, 100) + '%';
    document.getElementById('tr-west-bar').style.width = Math.min(counts.W*20, 100) + '%';

    // Congestion rating calculation
    const totalCurrent = trafficState.vehicles.length;
    const congestion = totalCurrent > 0 ? Math.min(Math.round((stoppedCount / totalCurrent) * 100), 100) : 0;
    document.getElementById('tr-congestion-rate').textContent = congestion + '%';
    document.getElementById('tr-wrong-way').textContent = trafficState.wrongWayAlerts;
    document.getElementById('tr-tot-detected').textContent = trafficState.totDetected;

    document.getElementById('home-traffic-count').textContent = Math.round(trafficState.totDetected / 2.5); // vehicles/min scaled
    document.getElementById('home-traffic-risk').textContent = congestion + '%';

    // Update traffic throughput flow rate chart
    const now = Date.now();
    if (now - trafficState.lastChartUpdate > 2500) {
        trChart.pushValue(totalCurrent);
        trafficState.lastChartUpdate = now;
    }
}

// 3. FLOOD SCREEN SYSTEM
const floodState = {
    rain: [],
    waterHeight: 60, // starts at 60px height overlay (corresponds to manual slider input)
    lastVal: 20
};

function updateFlood(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;

    // Fetch manual water level slider input
    const slider = document.getElementById('slider-water-level');
    let waterVal = parseInt(slider.value); // 0 to 100
    
    // Simulate manual configuration changed log
    if (waterVal !== floodState.lastVal) {
        addLog(`[SYSTEM] Manual flood simulator water level set to ${waterVal}%`, 'text-cyan');
        floodState.lastVal = waterVal;
    }

    // Set height based on percentage
    const targetHeight = (waterVal / 100) * 200; // max water height of 200px from bottom
    floodState.waterHeight += (targetHeight - floodState.waterHeight) * 0.05; // smooth transition

    // ── Background (Urban infrastructure view) ───────────────────
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    // Draw sky backdrop with soft clouds
    let skyGrad = ctx.createLinearGradient(0,0,0,150);
    skyGrad.addColorStop(0, '#0c1322');
    skyGrad.addColorStop(1, '#1b263b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,w,240);

    // Draw simple mountains
    ctx.fillStyle = '#111724';
    ctx.beginPath();
    ctx.moveTo(0, 240); ctx.lineTo(150, 160); ctx.lineTo(320, 240);
    ctx.moveTo(280, 240); ctx.lineTo(480, 120); ctx.lineTo(680, 240);
    ctx.fill();

    // Draw LOW-LYING HIGHWAY ROAD (floods at 35% height / 70px)
    ctx.fillStyle = '#1c2436';
    ctx.fillRect(50, 380, w - 100, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(50, 394, w - 100, 2); // center lines

    // Draw RIVER CHANNEL BASIN (default safe zone)
    ctx.fillStyle = '#111b2c';
    ctx.beginPath();
    ctx.moveTo(300, 480);
    ctx.lineTo(340, 360);
    ctx.lineTo(460, 360);
    ctx.lineTo(500, 480);
    ctx.fill();

    // Draw concrete BRIDGE spanning over the river (height = 340px, submerses at 55% height / 110px)
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(250, 330, 300, 30); // deck
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(290, 360, 20, 120); // support left
    ctx.fillRect(490, 360, 20, 120); // support right

    // Draw POWER STATION / BUILDINGS (height = 290px, submerses at 70% / 140px)
    ctx.fillStyle = '#3a4454';
    ctx.fillRect(650, 280, 80, 100); // building structure
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(665, 260, 20, 20); // exhaust tower
    // Windows
    ctx.fillStyle = 'rgba(255, 230, 0, 0.4)';
    ctx.fillRect(670, 300, 12, 12);
    ctx.fillRect(698, 300, 12, 12);
    ctx.fillRect(670, 330, 12, 12);
    ctx.fillRect(698, 330, 12, 12);

    // ── Simulate Rain Particles based on level ────────────────────
    const rainDensity = Math.floor((waterVal / 100) * 15) + 3;
    if (floodState.rain.length < rainDensity) {
        floodState.rain.push({
            x: Math.random() * w,
            y: Math.random() * -50,
            len: Math.random() * 15 + 10,
            vy: Math.random() * 8 + 12
        });
    }

    ctx.strokeStyle = 'rgba(156, 163, 175, 0.25)';
    ctx.lineWidth = 1;
    for (let i = floodState.rain.length - 1; i >= 0; i--) {
        let r = floodState.rain[i];
        r.y += r.vy;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x, r.y + r.len);
        ctx.stroke();

        // Remove if hit bottom ground
        if (r.y > h - floodState.waterHeight) {
            floodState.rain.splice(i, 1);
        }
    }

    // ── Draw Rising Flood Water Overlay (Neural Segmentation Mock) ─
    const yFloor = h - floodState.waterHeight;
    
    // Draw segmented water poly
    ctx.fillStyle = 'rgba(0, 140, 255, 0.35)'; // Blue translucent segmentation
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, yFloor);
    
    // Create minor sinusoidal ripples in water surface
    const waveCount = 8;
    const waveAmp = Math.min(waterVal / 12, 6);
    const step = w / waveCount;
    for (let i = 1; i <= waveCount; i++) {
        let cx = (i - 0.5) * step;
        let cy = yFloor + Math.sin((Date.now() / 300) + i) * waveAmp;
        let ex = i * step;
        ctx.quadraticCurveTo(cx, cy, ex, yFloor);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Draw glowing water border outlines
    ctx.strokeStyle = '#00e6ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // ── Infrastructure hit and alerts checks ───────────────────────
    let coverage = (floodState.waterHeight / 200) * 100;
    if (coverage < 0) coverage = 0;
    
    // Depth scale estimation: e.g. 100% water height is 8.0 meters
    let depth = (coverage / 100) * 8.0;

    let level = 'SAFE';
    let riskBadge = document.getElementById('fl-badge');
    
    if (coverage > 65) {
        level = 'CRITICAL';
        riskBadge.className = 'risk-badge badge-critical';
    } else if (coverage > 35) {
        level = 'DANGER';
        riskBadge.className = 'risk-badge badge-danger';
    } else if (coverage > 15) {
        level = 'WARNING';
        riskBadge.className = 'risk-badge badge-warn';
    } else {
        level = 'SAFE';
        riskBadge.className = 'risk-badge badge-safe';
    }
    riskBadge.textContent = level;

    // Check infrastructure alerts
    let bridgeStatus = document.getElementById('tr-bridge-status');
    let roadStatus = document.getElementById('tr-road-status');
    let resStatus = document.getElementById('tr-res-status');

    let bridgeStatusRow = document.getElementById('infra-bridge');
    let roadStatusRow = document.getElementById('infra-road');
    let resStatusRow = document.getElementById('infra-power');

    // Bridge submerses if water level is high (approx. 50% slider/height)
    if (yFloor < 360) {
        bridgeStatus.textContent = '⚠ SUBMERGED (CLOSED)';
        bridgeStatus.className = 'status-text text-red';
        bridgeStatusRow.style.borderColor = 'rgba(255, 59, 48, 0.4)';
        // Draw red outline around bridge deck
        ctx.strokeStyle = '#ff3b30';
        ctx.lineWidth = 2;
        ctx.strokeRect(250, 330, 300, 30);
    } else {
        bridgeStatus.textContent = 'OPERATIONAL';
        bridgeStatus.className = 'status-text text-green';
        bridgeStatusRow.style.borderColor = 'transparent';
    }

    // Road floods at 35% height
    if (yFloor < 390) {
        roadStatus.textContent = '⚠ FLOODED (CLOSED)';
        roadStatus.className = 'status-text text-red';
        roadStatusRow.style.borderColor = 'rgba(255, 59, 48, 0.4)';
        ctx.strokeStyle = '#ff3b30';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(50, 380, w - 100, 30);
    } else {
        roadStatus.textContent = 'DRY';
        roadStatus.className = 'status-text text-green';
        roadStatusRow.style.borderColor = 'transparent';
    }

    // Residential building floods at 70% height
    if (yFloor < 320) {
        resStatus.textContent = '⚠ CRITICAL EVACUATION';
        resStatus.className = 'status-text text-red';
        resStatusRow.style.borderColor = 'rgba(255, 59, 48, 0.4)';
        ctx.strokeStyle = '#ff3b30';
        ctx.lineWidth = 2;
        ctx.strokeRect(650, 280, 80, 100);
    } else {
        resStatus.textContent = 'SECURE';
        resStatus.className = 'status-text text-green';
        resStatusRow.style.borderColor = 'transparent';
    }

    // Update UI Stats
    document.getElementById('fl-coverage').textContent = coverage.toFixed(1) + '%';
    document.getElementById('fl-depth').textContent = depth.toFixed(1) + ' m';

    document.getElementById('home-flood-pct').textContent = coverage.toFixed(1) + '%';
    document.getElementById('home-flood-risk').textContent = level;
    
    const riskHomeColorMap = { SAFE: 'text-green', WARNING: 'text-yellow', DANGER: 'text-orange', CRITICAL: 'text-red' };
    const homeRiskText = document.getElementById('home-flood-risk');
    homeRiskText.className = 'stat-num ' + riskHomeColorMap[level];
}

// 4. CUSTOM MEDIA UPLOAD SYSTEM
const uploadState = {
    file: null,
    fileType: '',
    fileName: '',
    isPlaying: false,
    scanLineY: 0,
    scanDir: 1,
    detectedObjects: [],
    analysisActive: false,
    frameNumber: 0
};

function initUploadTab() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const btnAnalyze = document.getElementById('btn-upload-analyze');
    const btnClear = document.getElementById('btn-upload-clear');
    
    // Open file dialog on zone click
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag-and-drop event listeners
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--neon-cyan)';
            dropZone.style.backgroundColor = 'rgba(10, 14, 26, 0.92)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(0, 230, 255, 0.3)';
            dropZone.style.backgroundColor = 'rgba(10, 14, 26, 0.85)';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleUploadedFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            handleUploadedFile(fileInput.files[0]);
        }
    });

    btnAnalyze.addEventListener('click', () => {
        if (!uploadState.file) return;
        uploadState.analysisActive = true;
        btnAnalyze.disabled = true;
        btnAnalyze.textContent = 'YOLO ANALYZING...';
        addLog(`[INFERENCE] Triggered custom YOLOv8 prediction pipeline for: ${uploadState.fileName}`, 'text-cyan');
        
        if (uploadState.fileType === 'video') {
            const videoEl = document.getElementById('video-upload-element');
            videoEl.play();
            uploadState.isPlaying = true;
        }
    });

    btnClear.addEventListener('click', () => {
        clearUploadedMedia();
    });
}

function handleUploadedFile(file) {
    uploadState.file = file;
    uploadState.fileName = file.name;
    uploadState.fileType = file.type.startsWith('video/') ? 'video' : 'image';
    
    document.getElementById('uploaded-file-name').textContent = file.name;
    document.getElementById('drop-zone').style.display = 'none';
    document.getElementById('btn-upload-analyze').disabled = false;

    addLog(`[FILE] Loaded media resource: ${file.name} (type: ${uploadState.fileType})`);

    // Load file into elements
    const reader = new FileReader();
    if (uploadState.fileType === 'image') {
        const img = new Image();
        reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = () => {
                uploadState.imgElement = img;
                generateMockDetections(800, 480);
            };
        };
        reader.readAsDataURL(file);
    } else {
        const videoEl = document.getElementById('video-upload-element');
        reader.onload = (e) => {
            videoEl.src = e.target.result;
            videoEl.onloadedmetadata = () => {
                generateMockDetections(800, 480);
            };
        };
        reader.readAsDataURL(file);
    }
}

function clearUploadedMedia() {
    uploadState.file = null;
    uploadState.fileType = '';
    uploadState.fileName = '';
    uploadState.isPlaying = false;
    uploadState.analysisActive = false;
    uploadState.detectedObjects = [];
    
    const videoEl = document.getElementById('video-upload-element');
    videoEl.pause();
    videoEl.src = '';
    
    document.getElementById('uploaded-file-name').textContent = 'None Selected';
    document.getElementById('drop-zone').style.display = 'flex';
    document.getElementById('btn-upload-analyze').disabled = true;
    document.getElementById('btn-upload-analyze').textContent = 'Start AI Analysis';
    document.getElementById('upload-detect-count').textContent = '0';
    
    addLog('[FILE] Media analyzer cleared.', 'text-yellow');
}

function generateMockDetections(w, h) {
    const classes = ['bird', 'car', 'truck', 'deer', 'cat', 'person'];
    const colors = ['#00e6ff', '#00ff78', '#ff8c00', '#ffd200', '#ff3b30', '#3b82f6'];
    
    uploadState.detectedObjects = [];
    
    // Create 3 to 6 mock detections scattered around
    const count = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < count; i++) {
        const cIdx = Math.floor(Math.random() * classes.length);
        const sizeX = Math.random() * 80 + 40;
        const sizeY = Math.random() * 80 + 40;
        
        uploadState.detectedObjects.push({
            class: classes[cIdx],
            color: colors[cIdx],
            x: Math.random() * (w - 200) + 100,
            y: Math.random() * (h - 200) + 100,
            w: sizeX,
            h: sizeY,
            id: Math.floor(Math.random() * 80) + 1,
            conf: Math.random() * 0.18 + 0.78,
            // movement speeds if it's a simulated video track
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        });
    }
    
    document.getElementById('upload-detect-count').textContent = uploadState.detectedObjects.length;
}

function updateUploadAnalyzer(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;

    // Background base
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    if (!uploadState.file) {
        // Draw standard scanning placeholder text
        ctx.strokeStyle = 'rgba(0, 230, 255, 0.15)';
        ctx.strokeRect(10, 10, w - 20, h - 20);
        ctx.fillStyle = 'rgba(0, 230, 255, 0.4)';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ AWAITING EXTERNAL MEDIA RESOURCE UPLOAD...', w/2, h/2);
        ctx.textAlign = 'left'; // reset
        return;
    }

    // Render media content (Image or Video Frame)
    if (uploadState.fileType === 'image' && uploadState.imgElement) {
        ctx.drawImage(uploadState.imgElement, 0, 0, w, h);
    } else if (uploadState.fileType === 'video') {
        const videoEl = document.getElementById('video-upload-element');
        ctx.drawImage(videoEl, 0, 0, w, h);
    }

    // Draw active running scan laser if analysis is triggered
    if (uploadState.analysisActive) {
        // Scanning laser movement
        uploadState.scanLineY += 3.5 * uploadState.scanDir;
        if (uploadState.scanLineY > h || uploadState.scanLineY < 0) {
            uploadState.scanDir *= -1;
            // Scramble boxes slightly every pass to simulate real-time stream tracks updating
            if (uploadState.fileType === 'video') {
                generateMockDetections(w, h);
            }
        }

        // Draw horizontal laser bar
        let scanGrad = ctx.createLinearGradient(0, uploadState.scanLineY - 10, 0, uploadState.scanLineY + 10);
        scanGrad.addColorStop(0, 'rgba(0, 230, 255, 0)');
        scanGrad.addColorStop(0.5, 'rgba(0, 230, 255, 0.8)');
        scanGrad.addColorStop(1, 'rgba(0, 230, 255, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, uploadState.scanLineY - 12, w, 24);

        // Update and render bounding boxes
        uploadState.detectedObjects.forEach(obj => {
            if (uploadState.fileType === 'video' && uploadState.isPlaying) {
                // Update object positions slightly
                obj.x += obj.vx;
                obj.y += obj.vy;
                // Bounce bounds check
                if (obj.x < 50 || obj.x > w - 150) obj.vx *= -1;
                if (obj.y < 50 || obj.y > h - 150) obj.vy *= -1;
            }
            
            drawBoundingBox(ctx, obj.x, obj.y, obj.w, obj.h, obj.class, obj.conf, obj.id, obj.color);
        });

        // Overlay scanning HUD markers
        ctx.fillStyle = '#00e6ff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`● ANALYSIS ACTIVE  |  FRAME: #${Math.floor(Date.now() / 60) % 10000}`, 20, 30);
    } else {
        // Render pending indicator
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#00e6ff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ MEDIA RESOURCE LOADED. CLICK "START AI ANALYSIS" TO INFER.', w/2, h/2);
        ctx.textAlign = 'left';
    }
}

// ─── MAIN CENTRAL LOOP FOR RENDERING TABS ───────────────────────────────────
function animationLoop() {
    // Current Active Tab Drawing
    if (activeTab === 'wildlife') {
        const wlCanvas = document.getElementById('canvas-wildlife');
        if (wlCanvas) {
            const ctx = wlCanvas.getContext('2d');
            updateWildlife(wlCanvas, ctx);
            drawHUDScanlines(wlCanvas, ctx);
        }
    } else if (activeTab === 'traffic') {
        const trCanvas = document.getElementById('canvas-traffic');
        if (trCanvas) {
            const ctx = trCanvas.getContext('2d');
            updateTraffic(trCanvas, ctx);
            drawHUDScanlines(trCanvas, ctx);
        }
    } else if (activeTab === 'flood') {
        const flCanvas = document.getElementById('canvas-flood');
        if (flCanvas) {
            const ctx = flCanvas.getContext('2d');
            updateFlood(flCanvas, ctx);
            drawHUDScanlines(flCanvas, ctx);
        }
    } else if (activeTab === 'upload') {
        const upCanvas = document.getElementById('canvas-upload');
        if (upCanvas) {
            const ctx = upCanvas.getContext('2d');
            updateUploadAnalyzer(upCanvas, ctx);
            drawHUDScanlines(upCanvas, ctx);
        }
    }

    // Toggle heatmap listener inside loop
    const btnHeatmap = document.getElementById('btn-wildlife-heatmap');
    if (btnHeatmap) {
        btnHeatmap.onclick = (e) => {
            e.preventDefault();
            wildlifeState.showHeatmap = !wildlifeState.showHeatmap;
            if (wildlifeState.showHeatmap) {
                btnHeatmap.classList.add('active');
                addLog('[SYSTEM] Integrated Wildlife Thermal Spatial Heatmap overlay.', 'text-cyan');
            } else {
                btnHeatmap.classList.remove('active');
                addLog('[SYSTEM] Thermal Spatial Heatmap overlay disabled.');
            }
        };
    }

    // Toggle zones highlight listener inside loop
    const btnZones = document.getElementById('btn-traffic-zones');
    if (btnZones) {
        btnZones.onclick = (e) => {
            e.preventDefault();
            trafficState.showZones = !trafficState.showZones;
            if (trafficState.showZones) {
                btnZones.classList.add('active');
                addLog('[SYSTEM] Highlighted Approach Lanes (N/S/E/W zones) active.');
            } else {
                btnZones.classList.remove('active');
                addLog('[SYSTEM] Hide Approach Lanes highlights.');
            }
        };
    }

    // Reset wildlife counts
    const btnResetWl = document.getElementById('btn-reset-wildlife');
    if (btnResetWl) {
        btnResetWl.onclick = () => {
            wildlifeState.totalCounted = 0;
            initWildlifeParticles();
            addLog('[SYSTEM] Reset Wildlife cumulative counting tracking registry.', 'text-yellow');
        };
    }

    requestAnimationFrame(animationLoop);
}
