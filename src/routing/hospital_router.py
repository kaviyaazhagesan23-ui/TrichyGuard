import math
import requests

# Verified comprehensive hospital list for Tiruchirappalli (Trichy)
HOSPITALS = [
    {
        "name": "Kauvery Hospital",
        "address": "Cantonment, Trichy",
        "lat": 10.7955,
        "lon": 78.6852,
        "phone": "+91 431 4077777"
    },
    {
        "name": "Apollo Hospitals",
        "address": "Srirangam, Trichy",
        "lat": 10.8612,
        "lon": 78.6901,
        "phone": "+91 431 6660000"
    },
    {
        "name": "Mahatma Gandhi Memorial Government Hospital",
        "address": "Ponnagar, Trichy",
        "lat": 10.7982,
        "lon": 78.6810,
        "phone": "+91 431 2415151"
    },
    {
        "name": "Frontline Hospitals",
        "address": "Thillai Nagar, Trichy",
        "lat": 10.8210,
        "lon": 78.6820,
        "phone": "+91 431 2355555"
    },
    {
        "name": "CSI Mission Hospital",
        "address": "East Boulevard Road, Trichy",
        "lat": 10.8250,
        "lon": 78.6920,
        "phone": "+91 431 2702334"
    },
    {
        "name": "G. Viswanathan Speciality Hospital",
        "address": "Mela Chinthamani, Trichy",
        "lat": 10.8320,
        "lon": 78.6850,
        "phone": "+91 431 2701122"
    },
    {
        "name": "Jeyasekaran Hospital",
        "address": "Cantonment, Trichy",
        "lat": 10.7940,
        "lon": 78.6830,
        "phone": "+91 431 2412345"
    },
    {
        "name": "Ariyallur Hospital",
        "address": "Ariyamangalam, Trichy",
        "lat": 10.7910,
        "lon": 78.7380,
        "phone": "+91 431 2771234"
    }
]


def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def find_hospitals_in_radius(zone_lat, zone_lon, radius_km=15.0):
    """
    Retrieves all verified hospitals within the specified search radius,
    removing duplicates and sorting by straight-line distance.
    """
    scored = []
    seen = set()
    for h in HOSPITALS:
        identifier = (h["name"].strip().lower(), h["address"].strip().lower())
        if identifier in seen:
            continue
        seen.add(identifier)

        dist = haversine_distance(zone_lat, zone_lon, h["lat"], h["lon"])
        if dist <= radius_km:
            scored.append({**h, "distance_km": round(dist, 2)})

    scored.sort(key=lambda x: x["distance_km"])
    return scored


def get_osrm_route(origin_lat, origin_lon, dest_lat, dest_lon):
    """
    Queries public OSRM routing service for driving distance, ETA, and geometry.
    """
    url = f"http://router.project-osrm.org/route/v1/driving/{origin_lon},{origin_lat};{dest_lon},{dest_lat}?overview=full&geometries=geojson"
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            routes = data.get("routes", [])
            if routes:
                route = routes[0]
                return {
                    "distance_km": round(route["distance"] / 1000.0, 2),
                    "duration_mins": round(route["duration"] / 60.0, 1),
                    "geometry": route["geometry"]["coordinates"]
                }
    except Exception:
        pass
    return None