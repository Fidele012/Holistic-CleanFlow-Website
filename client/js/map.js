// Initialize Google Maps
let map;
let markers = [];

function initMap() {
    // Default center (you can change these coordinates)
    const defaultCenter = { lat: 0, lng: 0 };

    // Create map instance
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: defaultCenter,
        styles: [
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#3498db' }]
            }
        ]
    });

    // Get user's location if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);
                addMarker(userLocation, 'Your Location', 'user');
            },
            (error) => {
                console.error('Geolocation error:', error);
            }
        );
    }

    // Load water service locations
    loadWaterServiceLocations();
}

// Add marker to map
function addMarker(position, title, type) {
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: title,
        icon: getMarkerIcon(type)
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
        content: `<div class="info-window">
                    <h3>${title}</h3>
                    <p>Type: ${type}</p>
                    <button onclick="reportIssue(${position.lat}, ${position.lng})">
                        Report Issue
                    </button>
                </div>`
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

// Get marker icon based on type
function getMarkerIcon(type) {
    const icons = {
        user: {
            url: '/images/user-marker.png',
            scaledSize: new google.maps.Size(30, 30)
        },
        waterService: {
            url: '/images/water-service-marker.png',
            scaledSize: new google.maps.Size(30, 30)
        },
        issue: {
            url: '/images/issue-marker.png',
            scaledSize: new google.maps.Size(30, 30)
        }
    };
    return icons[type] || null;
}

// Load water service locations from API
async function loadWaterServiceLocations() {
    try {
        const response = await fetch('/api/locations/water-services');
        const locations = await response.json();

        locations.forEach(location => {
            addMarker(
                { lat: location.latitude, lng: location.longitude },
                location.name,
                'waterService'
            );
        });
    } catch (error) {
        console.error('Error loading water service locations:', error);
    }
}

// Report issue at specific location
async function reportIssue(lat, lng) {
    const description = prompt('Please describe the issue:');
    if (!description) return;

    try {
        const response = await fetch('/api/issues/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                latitude: lat,
                longitude: lng,
                description: description
            })
        });

        const data = await response.json();
        if (response.ok) {
            addMarker({ lat, lng }, 'Reported Issue', 'issue');
            alert('Issue reported successfully');
        } else {
            alert(data.message || 'Failed to report issue');
        }
    } catch (error) {
        console.error('Error reporting issue:', error);
        alert('An error occurred while reporting the issue');
    }
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', initMap); 