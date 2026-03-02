export function exportJSON(blocks) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blocks));
    downloadFile(dataStr, "voxel_shape.json");
}

export function exportCSV(blocks) {
    if (blocks.length === 0) return;
    const header = "x,y,z\\n";
    const csv = blocks.map(b => `${b.x},${b.y},${b.z}`).join("\\n");
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(header + csv);
    downloadFile(dataStr, "voxel_shape.csv");
}

export function copyToClipboard(blocks) {
    if (blocks.length === 0) {
        alert("Brak bloków do skopiowania");
        return;
    }
    const txt = blocks.map(b => `[${b.x}, ${b.y}, ${b.z}]`).join(",\\n");
    navigator.clipboard.writeText(`[\\n${txt}\\n]`).then(() => {
        alert("Skopiowano do schowka!");
    }).catch(err => {
        console.error("Błąd kopiowania:", err);
        alert("Nie udało się skopiować");
    });
}

function downloadFile(dataUrl, filename) {
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataUrl);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}