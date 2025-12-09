# Flow Map Component

A comprehensive, enterprise-grade map component for Salesforce Screen Flows supporting Google Maps and Leaflet with markers, clustering, drawing, and GeoJSON features.

## Features

### Map Types
- **Google Maps**: Standard mapping with familiar UI, max 100 markers
- **Leaflet Maps**: Unlimited markers, clustering, drawing tools, GeoJSON support

### Data Sources
- **Manual**: Provide markers via JSON
- **Variable**: Use Flow variables to populate markers
- **Query**: Dynamic SOQL queries with field mappings

### Marker Options
- **Types**: Default, Circle, Rectangle, Polygon, Pin, Custom Icon (SVG)
- **Customization**: Fill color, opacity, stroke color, stroke width, scale
- **Clustering**: Group nearby markers (Leaflet only)
- **Dragging**: Allow users to reposition markers

### Drawing Tools (Leaflet Only)
- Marker, Line, Polygon, Circle
- Edit and Delete modes
- Save drawings as Content Documents
- Auto-save functionality

### GeoJSON Support
- Display static GeoJSON (read-only)
- Load editable GeoJSON from Content Documents
- Export drawn shapes as GeoJSON

### Additional Features
- List view with auto/visible/hidden modes
- Search and filter functionality
- Header with title, caption, icon, and custom buttons
- Multiple output attributes for Flow integration

## Installation

### Prerequisites
1. Salesforce org with Flow enabled
2. Static resources for Leaflet (if using Leaflet maps)

### Static Resources Setup

For Leaflet maps functionality, you need to create the following static resources:

#### 1. Leaflet Core Library
Download from: https://leafletjs.com/download.html

Create a ZIP file containing:
```
leaflet/
├── leaflet.js
├── leaflet.css
└── images/
    ├── marker-icon.png
    ├── marker-icon-2x.png
    ├── marker-shadow.png
    └── layers.png
```

Upload as Static Resource named: `leaflet`

#### 2. Leaflet MarkerCluster Plugin
Download from: https://github.com/Leaflet/Leaflet.markercluster

Create a ZIP file containing:
```
leafletMarkerCluster/
├── leaflet.markercluster.js
├── MarkerCluster.css
└── MarkerCluster.Default.css
```

Upload as Static Resource named: `leafletMarkerCluster`

#### 3. Leaflet Draw Plugin
Download from: https://github.com/Leaflet/Leaflet.draw

Create a ZIP file containing:
```
leafletDraw/
├── leaflet.draw.js
├── leaflet.draw.css
└── images/
    └── (draw plugin images)
```

Upload as Static Resource named: `leafletDraw`

### Deployment

Deploy using Salesforce CLI:
```bash
sfdx force:source:deploy -p force-app
```

Or use VS Code with Salesforce Extensions.

## Usage

### Basic Configuration

1. Open Flow Builder
2. Add a Screen element
3. Drag "Flow Map" component onto the screen
4. Configure properties:
   - **Map Type**: Choose Google or Leaflet
   - **Data Source Type**: Select Manual, Variable, or Query
   - **Object API Name**: (for Query) e.g., `Account`
   - **Field Mappings**: Map your object fields to map attributes

### Example: Display Accounts on Map

```
Map Type: google
Data Source Type: query
Object API Name: Account
Title Field: Name
Latitude Field: BillingLatitude
Longitude Field: BillingLongitude
City Field: BillingCity
State Field: BillingState
Country Field: BillingCountry
```

### Example: Manual Markers JSON

```json
[
  {
    "id": "marker1",
    "title": "San Francisco Office",
    "description": "Headquarters",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "city": "San Francisco",
    "state": "CA",
    "country": "USA"
  },
  {
    "id": "marker2",
    "title": "New York Office",
    "description": "East Coast Hub",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "state": "NY",
    "country": "USA"
  }
]
```

### Example: Filter Fields JSON

```json
[
  {
    "fieldName": "Industry",
    "label": "Industry",
    "type": "picklist"
  },
  {
    "fieldName": "BillingCity",
    "label": "City",
    "type": "text"
  }
]
```

### Example: Header Buttons JSON

```json
[
  {
    "name": "refresh",
    "label": "Refresh",
    "variant": "neutral",
    "iconName": "utility:refresh"
  },
  {
    "name": "add",
    "label": "Add Location",
    "variant": "brand",
    "iconName": "utility:add"
  }
]
```

## Properties Reference

### Basic Configuration
| Property | Type | Description |
|----------|------|-------------|
| title | String | Header title |
| caption | String | Header subtitle |
| iconName | String | SLDS icon (e.g., utility:location) |
| height | String | Map height (e.g., 400px, 50vh) |
| isJoined | Boolean | Flat header bottom for joining components |

### Map Type
| Property | Type | Description |
|----------|------|-------------|
| mapType | String | `google` or `leaflet` |

### Data Source
| Property | Type | Description |
|----------|------|-------------|
| dataSourceType | String | `manual`, `variable`, or `query` |
| objectApiName | String | Salesforce object API name |
| queryFilter | String | WHERE clause (without WHERE) |
| recordLimit | Integer | Max records (default: 100) |
| markersJson | String | JSON array of markers |

### Field Mappings
| Property | Type | Description |
|----------|------|-------------|
| titleField | String | Field for marker title |
| descriptionField | String | Field for description |
| latitudeField | String | Field for latitude |
| longitudeField | String | Field for longitude |
| addressField | String | Full address field |
| cityField | String | City field |
| stateField | String | State/Province field |
| postalCodeField | String | Postal code field |
| countryField | String | Country field |

### Marker Configuration
| Property | Type | Description |
|----------|------|-------------|
| markerType | String | `default`, `circle`, `rectangle`, `polygon`, `pin`, `customIcon` |
| markerFillColor | String | Hex color (e.g., #EA4335) |
| markerFillOpacity | String | 0-1 (e.g., 0.7) |
| markerStrokeColor | String | Hex color |
| markerStrokeWidth | Integer | Pixels |
| markerRadius | Integer | Pixels (for circle) |
| markerScale | String | Scale factor |
| customIconSvg | String | SVG markup |

### Marker Clustering (Leaflet)
| Property | Type | Description |
|----------|------|-------------|
| enableClustering | Boolean | Enable clustering |
| showCoverageOnHover | Boolean | Show cluster boundary |
| maxClusterRadius | Integer | Cluster radius in pixels |
| disableClusteringAtZoom | Integer | Zoom level to disable |

### Drawing (Leaflet)
| Property | Type | Description |
|----------|------|-------------|
| enableDrawing | Boolean | Enable drawing tools |
| drawToolMarker | Boolean | Marker tool |
| drawToolLine | Boolean | Line tool |
| drawToolPolygon | Boolean | Polygon tool |
| drawToolCircle | Boolean | Circle tool |
| drawToolEdit | Boolean | Edit mode |
| drawToolDelete | Boolean | Delete mode |
| drawToolbarPosition | String | `topleft`, `topright`, `bottomleft`, `bottomright` |

### Drawing Save
| Property | Type | Description |
|----------|------|-------------|
| saveAsContentDocument | Boolean | Save as file |
| autoSaveContentDocument | Boolean | Auto-save |
| contentDocumentLinkedEntityId | String | Record to link |
| contentDocumentTitle | String | Document title |

### Output Attributes
| Property | Type | Description |
|----------|------|-------------|
| selectedMarkerId | String | Selected marker ID |
| selectedMarkerTitle | String | Selected marker title |
| selectedMarkerLatitude | String | Selected latitude |
| selectedMarkerLongitude | String | Selected longitude |
| selectedMarkerData | String | Full marker JSON |
| drawnShapesGeoJson | String | Drawn shapes as GeoJSON |
| draggedMarkerData | String | Dragged marker data |
| headerActionName | String | Clicked button name |
| contentDocumentIdOutput | String | Saved document ID |

## Flow Integration Examples

### Capture Selected Location
1. Add the Flow Map component to a screen
2. Create a text variable: `selectedRecordId`
3. After the screen, use a Decision element to check if `{!flowMap.selectedMarkerId}` is not blank
4. Use the selected ID in subsequent elements

### Save Map Drawings
1. Enable drawing tools
2. Set `Save as Content Document = true`
3. Set `Content Document Linked Entity ID` to your record ID variable
4. After the screen, the `contentDocumentIdOutput` contains the saved document ID

### React to Header Button Clicks
1. Configure header buttons JSON
2. After the screen, use a Decision element based on `{!flowMap.headerActionName}`
3. Route to different paths based on button clicked

## Troubleshooting

### Map Not Loading
- Verify static resources are uploaded correctly
- Check browser console for errors
- Ensure Leaflet files are in correct structure

### Markers Not Appearing
- Verify latitude/longitude fields contain valid numbers
- For Google Maps, addresses can be used
- For Leaflet, lat/lng are required

### Drawing Tools Not Working
- Ensure `mapType` is set to `leaflet`
- Verify `leafletDraw` static resource is properly configured
- Check that `enableDrawing` is true

### Clustering Not Working
- Ensure `mapType` is set to `leaflet`
- Verify `leafletMarkerCluster` static resource exists
- Set `enableClustering` to true

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions are welcome! Please submit pull requests with:
- Clear description of changes
- Updated tests
- Documentation updates if applicable

## Support

For issues and feature requests, please create a GitHub issue.
