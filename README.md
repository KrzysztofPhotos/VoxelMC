# 🏰 Voxel Shape Engine

A lightweight, browser-based procedural engine for generating complex voxel shapes, inspired by **Plotz**.

## 🚀 Overview

Voxel Shape Engine is an ES6 JavaScript tool designed for generating and visualizing 3D voxel structures. It features a dual-view system:
*   **2D Layer View:** For precise layer-by-layer building (like in Minecraft).
*   **3D Perspective:** Powered by **Three.js**, offering realistic lighting, textures, and material types (Solid, Glossy, Mirror, Glass).

## ✨ Features

*   **Procedural Shapes:** Sphere, Ellipsoid, Torus, Helixes, Paraboloids, and more.
*   **Advanced Structures:**
    *   **Procedural House:** A standard customizable house model.
    *   **NEW: Medieval House:** A complex village-style house with stone foundations, timber framing, gabled roof, and chimney.
    *   **Procedural Bridge:** Arch bridge with customizable span and gates.
    *   **Procedural Tower:** Circular tower with defensive platforms.
*   **Realistic Rendering:** Environment maps (Minecraft HDR, Studio), shadow mapping, and PBR materials.
*   **Export Tools:** Download your designs as JSON or CSV, or copy block coordinates directly to the clipboard.

## 🏛️ New: Medieval House Module

The latest update introduces the `ProceduralMedievalHouse`, designed to look like a small cottage from a medieval village.

### Customization Parameters:
*   **Width/Depth:** Control the footprint.
*   **Wall/Roof Height:** Adjust the height and steepness.
*   **Timber Frame:** Toggle the traditional wooden skeleton.
*   **Chimney:** Add a brick chimney with realistic smoke-ready placement.
*   **Overhang:** Control how much the roof extends beyond the walls.
*   **Window Count:** Distribute windows across the facade.

## 🛠️ Tech Stack

*   **Core:** Vanilla JavaScript (ES6 Modules).
*   **3D Graphics:** [Three.js](https://threejs.org/).
*   **Materials:** Minecraft-inspired textures from the `assets/` directory.

## 📖 How to use

1.  Open `index.html` in any modern browser.
2.  Select a **Kształt** (Shape) from the sidebar.
3.  Adjust parameters to see changes in real-time.
4.  Switch to **Podgląd 3D** to see the full structure with textures.
5.  Set **Materiał 3D** to **"Tekstura (Minecraft)"** for the best experience with the Medieval House.

---

*Made with 🛠️ for voxel lovers.*
