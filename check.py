import re
content = open('index.html', encoding='utf-8').read()
ids = ['city-input', 'search-btn', 'locate-btn', 'theme-toggle', 'dashboard-toggle', 'mic-btn', 'unit-switch', 'favorite-btn', 'favorites-container', 'error-msg', 'weather-canvas', 'alert-banner', 'alert-text', 'close-alert-btn', 'ai-summary', 'ai-text', 'read-aloud-btn', 'dashboard-view', 'dashboard-grid', 'current-weather-wrapper']
missing = [i for i in ids if not re.search(f'id=["\']{i}["\']', content)]
print('Missing IDs:', missing)
print('extended-data class:', 'extended-data' in content)
print('forecast class:', 'forecast' in content)
