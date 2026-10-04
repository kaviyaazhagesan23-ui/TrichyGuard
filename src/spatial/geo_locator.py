import os
import json
from shapely.geometry import Point, shape

class TrichyGeoLocator:
    """
    Handles Point-in-Polygon (PIP) spatial lookups for Trichy city zones 
    using verified GeoJSON boundary files.
    """
    def __init__(self, geojson_path):
        self.geojson_path = geojson_path
        self.zones = {}
        self._load_boundaries()

    def _load_boundaries(self):
        if not os.path.exists(self.geojson_path):
            print(f"[WARNING] GeoJSON file not found at: {self.geojson_path}")
            return
        
        try:
            with open(self.geojson_path, 'r') as f:
                data = json.load(f)
            
            features = data.get("features", [])
            for feat in features:
                zone_id = feat.get("properties", {}).get("zone_id")
                geom_data = feat.get("geometry")
                
                # Check if polygon coordinates are provided and non-empty
                if geom_data and geom_data.get("coordinates") and len(geom_data["coordinates"]) > 0:
                    self.zones[zone_id] = shape(geom_data)
                else:
                    print(f"[INFO] Zone '{zone_id}' has no verified polygon coordinates populated yet.")
        except Exception as e:
            print(f"[ERROR] Failed to parse GeoJSON boundaries: {e}")

    def locate_point(self, lat, lon):
        """
        Determines which zone contains the given latitude and longitude.
        Handles coordinate validation, boundary touching, and out-of-bounds cases.
        """
        # 1. Validate coordinate ranges
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            return {"status": "error", "message": "Latitude and longitude must be numeric values."}
        
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return {"status": "error", "message": "Coordinates are out of valid global geographic ranges (-90 to 90, -180 to 180)."}
        
        # 2. Check if polygons are initialized
        if not self.zones:
            return {
                "status": "uninitialized", 
                "zone": None, 
                "message": "GeoJSON template contains no verified polygon coordinates. Populate 'data/trichy_zones.geojson' with real boundaries."
            }

        # Note: Shapely Point expects (longitude, latitude)
        point = Point(lon, lat)

        matching_zones = []
        boundary_zones = []

        # 3. Evaluate Point-in-Polygon and boundary conditions
        for zone_id, poly in self.zones.items():
            if poly.contains(point):
                matching_zones.append(zone_id)
            elif poly.touches(point) or poly.boundary.distance(point) < 1e-6:
                boundary_zones.append(zone_id)

        # 4. Resolve matches and edge cases
        if matching_zones:
            return {
                "status": "success", 
                "zone": matching_zones[0], 
                "note": "Point strictly contained within zone polygon."
            }
        elif boundary_zones:
            return {
                "status": "success", 
                "zone": boundary_zones[0], 
                "note": "Point lies on shared boundary; resolved deterministically."
            }
        else:
            return {
                "status": "out_of_bounds", 
                "zone": None, 
                "message": "Point falls outside all defined zone polygons."
            }

# Simple test execution block
if __name__ == "__main__":
    print("=" * 60)
    print("TRICHYGUARD: GEOGRAPHIC LOCATOR MODULE TEST")
    print("=" * 60)
    
    geojson_file = os.path.join("data", "trichy_zones.geojson")
    locator = TrichyGeoLocator(geojson_file)
    
    # Test coordinate (Center of Trichy)
    test_lat, test_lon = 10.7905, 78.7047
    print(f"\nTesting coordinate lookup for Lat: {test_lat}, Lon: {test_lon}...")
    
    result = locator.locate_point(test_lat, test_lon)
    print("Lookup Result:")
    for k, v in result.items():
        print(f"  - {k}: {v}")
    
    print("=" * 60)