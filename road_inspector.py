"""
Road Safety Inspection System - Core Logic
Optimized for serverless deployment
"""

import cv2
import numpy as np
import time
from skimage import exposure, filters, feature
from skimage.measure import label, regionprops
from scipy import ndimage

class RoadSurfaceAnalyzer:
    """Analyzes road surface quality."""
    
    def detect_potholes(self, image):
        """Detect potholes using image processing."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = exposure.equalize_adapthist(gray)
        gray = (gray * 255).astype(np.uint8)
        
        edges = cv2.Canny(gray, 50, 150)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        potholes = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:
                x, y, w, h = cv2.boundingRect(contour)
                severity = min(1.0, area / 5000)
                potholes.append({
                    "bbox": [x, y, x+w, y+h],
                    "area": area,
                    "severity": severity
                })
        
        return potholes
    
    def detect_cracks(self, image):
        """Detect road cracks."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
        edges = cv2.Canny(blurred, 30, 100, apertureSize=3)
        
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=30,
                                minLineLength=30, maxLineGap=10)
        
        cracks = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
                severity = min(1.0, length / 200)
                cracks.append({
                    "start": [x1, y1],
                    "end": [x2, y2],
                    "length": length,
                    "severity": severity
                })
        
        return cracks
    
    def assess_roughness(self, image):
        """Assess road roughness."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        roughness_score = np.std(gray) / 128.0
        roughness_score = min(1.0, roughness_score)
        
        local_std = ndimage.generic_filter(gray, np.std, size=15)
        rough_mask = (local_std > np.mean(local_std) * 1.5)
        labeled, num_features = label(rough_mask, connectivity=2, return_num=True)
        
        rough_patches = []
        for region in regionprops(labeled):
            if region.area > 200:
                y1, x1, y2, x2 = region.bbox
                severity = min(1.0, region.area / 10000)
                rough_patches.append({
                    "bbox": [x1, y1, x2, y2],
                    "area": region.area,
                    "severity": severity
                })
        
        return rough_patches, roughness_score


class SafetyFeatureDetector:
    """Detects road safety features."""
    
    def detect_lane_markings(self, image):
        """Detect lane markings."""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        white_mask = cv2.inRange(hsv, np.array([0, 0, 180]), np.array([180, 30, 255]))
        yellow_mask = cv2.inRange(hsv, np.array([15, 50, 150]), np.array([30, 255, 255]))
        combined = cv2.bitwise_or(white_mask, yellow_mask)
        
        kernel = np.ones((3, 3), np.uint8)
        cleaned = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
        edges = cv2.Canny(cleaned, 50, 150)
        
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50,
                                minLineLength=100, maxLineGap=30)
        
        markings = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                markings.append({
                    "start": [x1, y1],
                    "end": [x2, y2],
                    "status": "visible"
                })
        
        return markings
    
    def detect_traffic_signs(self, image):
        """Detect traffic signs."""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        red_mask1 = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([10, 255, 255]))
        red_mask2 = cv2.inRange(hsv, np.array([160, 50, 50]), np.array([180, 255, 255]))
        red_mask = cv2.bitwise_or(red_mask1, red_mask2)
        blue_mask = cv2.inRange(hsv, np.array([100, 50, 50]), np.array([130, 255, 255]))
        
        signs = []
        for mask in [red_mask, blue_mask]:
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for contour in contours:
                area = cv2.contourArea(contour)
                if 100 < area < 5000:
                    x, y, w, h = cv2.boundingRect(contour)
                    signs.append({
                        "bbox": [x, y, x+w, y+h],
                        "confidence": min(1.0, area / 2000)
                    })
        
        return signs
    
    def detect_barriers(self, image):
        """Detect road barriers."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100,
                                minLineLength=100, maxLineGap=20)
        
        barriers = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                barriers.append({
                    "start": [x1, y1],
                    "end": [x2, y2]
                })
        
        return barriers


class InfrastructureAnalyzer:
    """Analyzes traffic infrastructure."""
    
    def detect_traffic_lights(self, image):
        """Detect traffic lights."""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        colors = {
            "red": ([0, 50, 50], [10, 255, 255]),
            "red2": ([160, 50, 50], [180, 255, 255]),
            "yellow": ([15, 50, 150], [35, 255, 255]),
            "green": ([40, 50, 50], [80, 255, 255])
        }
        
        lights = []
        for color_name, (lower, upper) in colors.items():
            mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if 30 < area < 1000:
                    x, y, w, h = cv2.boundingRect(contour)
                    lights.append({
                        "bbox": [x, y, x+w, y+h],
                        "color": color_name,
                        "working": area > 50
                    })
        
        return lights
    
    def detect_crosswalks(self, image):
        """Detect crosswalks."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        
        horizontal = cv2.morphologyEx(edges, cv2.MORPH_OPEN,
                                      cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1)))
        vertical = cv2.morphologyEx(edges, cv2.MORPH_OPEN,
                                    cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25)))
        combined = cv2.add(horizontal, vertical)
        
        contours, _ = cv2.findContours(combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        crosswalks = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if 2000 < area < 20000:
                x, y, w, h = cv2.boundingRect(contour)
                crosswalks.append({
                    "bbox": [x, y, x+w, y+h],
                    "status": "visible"
                })
        
        return crosswalks


class RoadInspectionSystem:
    """Main inspection system."""
    
    def __init__(self):
        self.surface_analyzer = RoadSurfaceAnalyzer()
        self.safety_detector = SafetyFeatureDetector()
        self.infrastructure_analyzer = InfrastructureAnalyzer()
    
    def analyze_frame(self, frame):
        """Analyze a single frame."""
        # Surface analysis
        potholes = self.surface_analyzer.detect_potholes(frame)
        cracks = self.surface_analyzer.detect_cracks(frame)
        rough_patches, roughness = self.surface_analyzer.assess_roughness(frame)
        
        # Safety features
        lane_markings = self.safety_detector.detect_lane_markings(frame)
        signs = self.safety_detector.detect_traffic_signs(frame)
        barriers = self.safety_detector.detect_barriers(frame)
        
        # Infrastructure
        traffic_lights = self.infrastructure_analyzer.detect_traffic_lights(frame)
        crosswalks = self.infrastructure_analyzer.detect_crosswalks(frame)
        
        # Calculate scores
        surface_score = self._calculate_surface_score(potholes, cracks, rough_patches)
        safety_score = self._calculate_safety_score(lane_markings, signs, barriers)
        infrastructure_score = self._calculate_infrastructure_score(traffic_lights, crosswalks)
        overall_score = (surface_score * 0.35 + safety_score * 0.30 + infrastructure_score * 0.35)
        
        # Determine grade
        grade = self._get_grade(overall_score)
        
        return {
            "overall_score": overall_score,
            "grade": grade,
            "surface": {
                "score": surface_score,
                "potholes": len(potholes),
                "cracks": len(cracks),
                "rough_patches": len(rough_patches),
                "roughness_score": roughness
            },
            "safety": {
                "score": safety_score,
                "lane_markings": len(lane_markings),
                "signs": len(signs),
                "barriers": len(barriers)
            },
            "infrastructure": {
                "score": infrastructure_score,
                "traffic_lights": len(traffic_lights),
                "crosswalks": len(crosswalks)
            },
            "detected_defects": {
                "potholes": potholes,
                "cracks": cracks,
                "rough_patches": rough_patches
            },
            "detected_features": {
                "lane_markings": lane_markings,
                "signs": signs,
                "barriers": barriers,
                "traffic_lights": traffic_lights,
                "crosswalks": crosswalks
            }
        }
    
    def _calculate_surface_score(self, potholes, cracks, rough_patches):
        """Calculate surface quality score."""
        total = len(potholes) + len(cracks) + len(rough_patches)
        severe = sum(1 for p in potholes if p.get("severity", 0) > 0.5)
        return max(0, 100 - total * 5 - severe * 10)
    
    def _calculate_safety_score(self, markings, signs, barriers):
        """Calculate safety features score."""
        marking_score = min(100, len(markings) * 20)
        sign_score = min(100, len(signs) * 20)
        barrier_score = min(100, len(barriers) * 25)
        return (marking_score * 0.4 + sign_score * 0.3 + barrier_score * 0.3)
    
    def _calculate_infrastructure_score(self, lights, crosswalks):
        """Calculate infrastructure score."""
        working = sum(1 for l in lights if l.get("working", False))
        light_score = 100 if len(lights) == 0 else (working / len(lights)) * 100
        crosswalk_score = min(100, len(crosswalks) * 30)
        return (light_score * 0.6 + crosswalk_score * 0.4)
    
    def _get_grade(self, score):
        """Get quality grade."""
        if score >= 90:
            return "Excellent"
        elif score >= 70:
            return "Good"
        elif score >= 50:
            return "Fair"
        elif score >= 30:
            return "Poor"
        else:
            return "Critical"