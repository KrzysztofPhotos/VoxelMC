# VoxelGen - Plotz Clone

Generator matematycznych brył voxelowych dla Minecraft, działający w pełni w przeglądarce (frontend-only). Aplikacja nie wymaga backendu i jest zbudowana przy użyciu czystego JavaScriptu, HTML i CSS. Dodatkowo wykorzystuje Three.js do podglądu wygenerowanych brył w 3D.

## Funkcje
- **Obsługiwane kształty**: Okrąg (2D), Elipsa (2D), Kula, Elipsoida, Cylinder, Stożek, Torus.
- **Parametry**: Możliwość modyfikacji promienia, szerokości, wysokości, a także opcja wydrążenia bryły (Hollow) ze zmienną grubością ściany.
- **Widok 2D**: Podgląd konkretnej warstwy Y. Obsługa przesuwania myszką i przybliżania rolką myszy. Najechanie na obszar roboczy wyświetla współrzędne bloku.
- **Widok 3D**: Sprzętowo akcelerowany (InstancedMesh, Three.js) interaktywny podgląd całej bryły.
- **Eksport**: Możliwość zapisu wygenerowanych współrzędnych do plików `JSON`, `CSV` lub skopiowania bezpośrednio do schowka.

## Wymagania
Dowolna nowoczesna przeglądarka obsługująca ES6 Modules (ESM) i moduły WebGL.

## Instrukcja Uruchomienia

Ponieważ aplikacja wykorzystuje moduły JavaScript (tagi `<script type="module">`), pliki muszą być serwowane przez lokalny serwer HTTP. Otwarcie bezpośrednio pliku `index.html` (protokół `file://`) w większości przeglądarek spowoduje błąd CORS.

Oto jak w łatwy sposób uruchomić serwer:

### Opcja 1: Używając Python 3 (Polecane)
Większość systemów ma preinstalowanego Pythona. Otwórz terminal (lub wiersz poleceń) w folderze z projektem i uruchom:
```bash
python3 -m http.server 8000
```
Następnie otwórz przeglądarkę pod adresem: http://localhost:8000

### Opcja 2: Używając Node.js
Jeżeli masz zainstalowane Node.js, możesz użyć pakietu `npx` i np. serwera `http-server`:
```bash
npx http-server . -p 8000
```
Przejdź do przeglądarki pod adres: http://localhost:8000

### Opcja 3: Rozszerzenie w VS Code
1. Zainstaluj rozszerzenie "Live Server" w edytorze Visual Studio Code.
2. Otwórz plik `index.html`.
3. Kliknij przycisk "Go Live" w prawym dolnym rogu paska statusu.

## Struktura plików
```
.
├── index.html            # Główny widok HTML
├── styles.css            # Minimalistyczne style inżynieryjne
├── js/
│   ├── main.js           # Punkt wejścia aplikacji
│   ├── ui/
│   │   └── UI.js         # Zarządzanie zdarzeniami DOM
│   ├── renderer/
│   │   ├── Renderer2D.js # Silnik Canvas 2D
│   │   └── Renderer3D.js # Silnik Three.js (3D)
│   ├── math/
│   │   └── VoxelMath.js  # Operacje matematyczne
│   ├── shapes/
│   │   ├── Shape.js      # Klasa bazowa (funkcje SDF)
│   │   ├── Sphere.js
│   │   ├── Circle.js
│   │   ├── Ellipse.js
│   │   ├── Ellipsoid.js
│   │   ├── Cylinder.js
│   │   ├── Cone.js
│   │   └── Torus.js
│   └── export/
│       └── Exporter.js   # Funkcje do zapisu plików (JSON/CSV)
└── README.md             # Instrukcja
```