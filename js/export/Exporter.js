export function exportJSON(blocks) {
    if (blocks.length === 0) {
        alert("No blocks to export");
        return;
    }
    const dataStr = JSON.stringify(blocks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'voxels.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

export function exportCSV(blocks) {
    if (blocks.length === 0) {
        alert("No blocks to export");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,x,y,z,type\n";
    blocks.forEach(b => {
        csvContent += `${b.x},${b.y},${b.z},${b.type}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "voxels.csv");
    document.body.appendChild(link);
    link.click();
}

export async function copyToClipboard(blocks) {
    if (blocks.length === 0) {
        alert("No blocks to copy");
        return;
    }
    const text = blocks.map(b => `${b.x},${b.y},${b.z},${b.type}`).join('\n');
    try {
        await navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    } catch (err) {
        console.error("Copy error:", err);
        alert("Failed to copy");
    }
}