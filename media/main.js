const vscode = acquireVsCodeApi();

// Restore previous state
const previousState = vscode.getState();
if (previousState) {
    document.getElementById('font-size').value = previousState.fontSize || 16;
    document.getElementById('font-color').value = previousState.fontColor || '#000000';
    document.getElementById('header-bg-color').value = previousState.headerBgColor || '#f2f2f2';
    applyStyles();
}

window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'csvUpdate') {
        const csvData = message.data;
        renderCsv(csvData);
    } else if (message.type === 'restoreState') {
        const state = message.data;
        document.getElementById('font-size').value = state.fontSize || 16;
        document.getElementById('font-color').value = state.fontColor || '#000000';
        document.getElementById('header-bg-color').value = state.headerBgColor || '#f2f2f2';
        applyStyles();
    }
});

function renderCsv(csvData) {
    const tableContainer = document.getElementById('csv-table-container');
    if (!csvData) {
        tableContainer.innerHTML = '<p>No data to display.</p>';
        return;
    }

    const rows = csvData.split('\n');
    if (rows.length === 0) {
        tableContainer.innerHTML = '<p>CSV is empty.</p>';
        return;
    }

    let html = '<table>';
    
    // Header
    const headers = rows[0].split(',');
    html += '<thead><tr>';
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead>';

    // Body
    html += '<tbody>';
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row) {
            const cells = row.split(',');
            html += '<tr>';
            cells.forEach(cell => {
                html += `<td>${cell}</td>`;
            });
            html += '</tr>';
        }
    }
    html += '</tbody></table>';

    tableContainer.innerHTML = html;
    applyStyles();
}

function applyStyles() {
    const tableContainer = document.getElementById('csv-table-container');
    const fontSize = document.getElementById('font-size').value;
    const fontColor = document.getElementById('font-color').value;
    const headerBgColor = document.getElementById('header-bg-color').value;

    tableContainer.style.fontSize = `${fontSize}px`;
    tableContainer.style.color = fontColor;

    document.querySelectorAll('th').forEach(th => {
        th.style.backgroundColor = headerBgColor;
    });

    const state = { fontSize, fontColor, headerBgColor };
    vscode.setState(state);
    vscode.postMessage({
        type: 'saveState',
        data: state
    });
}

document.getElementById('font-size').addEventListener('input', applyStyles);
document.getElementById('font-color').addEventListener('input', applyStyles);
document.getElementById('header-bg-color').addEventListener('input', applyStyles); 