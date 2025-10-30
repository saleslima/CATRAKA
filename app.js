import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCNg46NNXslJte3HhGJCLn4Gz3vimzFWKI",
    authDomain: "acesso-guarda.firebaseapp.com",
    databaseURL: "https://acesso-guarda-default-rtdb.firebaseio.com",
    projectId: "acesso-guarda",
    storageBucket: "acesso-guarda.firebasestorage.app",
    messagingSenderId: "745452785005",
    appId: "1:745452785005:web:f2e5ca01aca67687ed1e64",
    measurementId: "G-J5D6CB2L8W"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const form = document.getElementById('accessForm');
const dataHoraInput = document.getElementById('dataHora');
const recordsList = document.getElementById('recordsList');
const tipoSelect = document.getElementById('tipo');
const postoGraduacaoGroup = document.getElementById('postoGraduacaoGroup');
const postoGraduacaoSelect = document.getElementById('postoGraduacao');
const reRgInput = document.getElementById('reRg');
const statusSelect = document.getElementById('status');
const reportBtn = document.getElementById('reportBtn');
const nightModeToggle = document.getElementById('nightModeToggle');
const cadastroBtn = document.getElementById('cadastroBtn');
const accessForm = document.getElementById('accessForm');

let allRecords = {};
let pendingFormData = null;

// Cadastro button functionality
cadastroBtn.addEventListener('click', () => {
    if (accessForm.style.display === 'none') {
        accessForm.style.display = 'block';
        cadastroBtn.textContent = 'Fechar Cadastro';
    } else {
        accessForm.style.display = 'none';
        cadastroBtn.textContent = 'Cadastro';
        form.reset();
        postoGraduacaoGroup.style.display = 'none';
        postoGraduacaoSelect.required = false;
    }
});

// Show/hide posto/graduação based on tipo selection
tipoSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Militar') {
        postoGraduacaoGroup.style.display = 'block';
        postoGraduacaoSelect.required = true;
        // Auto-set status to Autorizado for Militar
        statusSelect.value = 'Autorizado';
    } else {
        postoGraduacaoGroup.style.display = 'none';
        postoGraduacaoSelect.required = false;
        postoGraduacaoSelect.value = '';
        // Reset status selection for Civil
        statusSelect.value = '';
    }
});

// Check for existing RE/RG when user finishes typing
reRgInput.addEventListener('blur', () => {
    const reRgValue = reRgInput.value.trim().toUpperCase();
    reRgInput.value = reRgValue;
    if (!reRgValue) return;
    
    const existingRecord = Object.values(allRecords).find(
        record => record.reRg === reRgValue
    );
    
    if (existingRecord) {
        showExistingRecordModal(existingRecord);
    }
});

// Night mode functionality
const savedNightMode = localStorage.getItem('nightMode') === 'true';
if (savedNightMode) {
    document.body.classList.add('night-mode');
    nightModeToggle.textContent = '☀️';
}

nightModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('night-mode');
    const isNightMode = document.body.classList.contains('night-mode');
    nightModeToggle.textContent = isNightMode ? '☀️' : '🌙';
    localStorage.setItem('nightMode', isNightMode);
});

// Report functionality
reportBtn.addEventListener('click', () => {
    showPasswordModal();
});

function showPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Acesso ao Relatório</h3>
            <p style="margin-bottom: 16px; color: #555;">Digite a senha para acessar os relatórios:</p>
            <div class="form-group">
                <label for="passwordInput">Senha:</label>
                <input type="password" id="passwordInput" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: 'Noto Sans', sans-serif;" placeholder="Digite a senha..." autocomplete="off">
            </div>
            <div class="modal-buttons" style="margin-top: 20px;">
                <button class="btn-yes" id="verifyPassword">Acessar</button>
                <button class="btn-no" id="cancelPassword">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const passwordInput = modal.querySelector('#passwordInput');
    passwordInput.focus();
    
    const verifyPassword = () => {
        const password = passwordInput.value.trim();
        if (password === 'barra02controle') {
            modal.remove();
            showReportModal();
        } else {
            showNotification('Senha incorreta', true);
            passwordInput.value = '';
            passwordInput.focus();
        }
    };
    
    modal.querySelector('#verifyPassword').addEventListener('click', verifyPassword);
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyPassword();
        }
    });
    
    modal.querySelector('#cancelPassword').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function showExistingRecordModal(record) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Registro Encontrado</h3>
            <p style="margin-bottom: 16px; color: #555;">Já existe um registro com este RE/RG. Deseja usar os dados existentes?</p>
            <div class="record-details">
                <div><strong>Tipo:</strong> ${record.tipo}</div>
                ${record.postoGraduacao ? `<div><strong>Posto/Graduação:</strong> ${record.postoGraduacao}</div>` : ''}
                <div><strong>RE/RG:</strong> ${record.reRg}</div>
                ${record.nomeCompleto ? `<div><strong>Nome Completo:</strong> ${record.nomeCompleto}</div>` : ''}
                <div><strong>Unidade:</strong> ${record.unidade}</div>
                <div><strong>Telefone:</strong> ${record.telefone}</div>
            </div>
            <div class="modal-buttons">
                <button class="btn-yes">Sim, usar dados</button>
                <button class="btn-no">Não, digitar novo</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.btn-yes').addEventListener('click', () => {
        fillFormWithRecord(record);
        modal.remove();
    });
    
    modal.querySelector('.btn-no').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function fillFormWithRecord(record) {
    document.getElementById('tipo').value = record.tipo;
    tipoSelect.dispatchEvent(new Event('change'));
    
    if (record.postoGraduacao) {
        document.getElementById('postoGraduacao').value = record.postoGraduacao;
    }
    
    if (record.nomeCompleto) {
        document.getElementById('nomeCompleto').value = record.nomeCompleto;
    }
    
    document.getElementById('unidade').value = record.unidade;
    document.getElementById('telefone').value = record.telefone;
    document.getElementById('destino').focus();
}

function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    dataHoraInput.value = formatted;
}

updateDateTime();
setInterval(updateDateTime, 1000);

// Convert all text inputs to uppercase
document.querySelectorAll('input[type="text"], input[type="tel"]').forEach(input => {
    if (input.id !== 'dataHora') {
        input.addEventListener('input', (e) => {
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.toUpperCase();
            e.target.setSelectionRange(start, end);
        });
    }
});

// Phone number validation and formatting
const telefoneInput = document.getElementById('telefone');
telefoneInput.addEventListener('input', (e) => {
    // Remove all non-numeric characters
    let value = e.target.value.replace(/\D/g, '');
    
    // Limit to maximum 11 digits
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    e.target.value = value;
});

telefoneInput.addEventListener('blur', (e) => {
    const value = e.target.value.replace(/\D/g, '');
    
    if (value.length === 0) return;
    
    // Check if third digit is 9 (mobile)
    if (value.length >= 3) {
        const thirdDigit = value.charAt(2);
        
        if (thirdDigit === '9') {
            // Mobile: should have 11 digits (DDD + 9 + 8 digits)
            if (value.length !== 11) {
                showNotification('Telefone celular deve ter 11 dígitos (DDD + número)', true);
                e.target.focus();
                return;
            }
        } else {
            // Landline: should have 10 digits (DDD + 8 digits)
            if (value.length !== 10) {
                showNotification('Telefone fixo deve ter 10 dígitos (DDD + número)', true);
                e.target.focus();
                return;
            }
        }
    } else if (value.length < 10) {
        showNotification('Telefone deve ter no mínimo 10 dígitos', true);
        e.target.focus();
    }
});

function showReportModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay report-modal';
    modal.innerHTML = `
        <div class="modal">
            <h3>Gerar Relatório de Acessos</h3>
            <div class="date-range-inputs">
                <div class="form-group">
                    <label for="dataInicio">Data/Hora Início:</label>
                    <input type="datetime-local" id="dataInicio" required>
                </div>
                <div class="form-group">
                    <label for="dataFim">Data/Hora Fim:</label>
                    <input type="datetime-local" id="dataFim" required>
                </div>
            </div>
            <button class="btn-yes" id="searchReport" style="width: 100%; margin-bottom: 16px;">Pesquisar</button>
            <div id="reportResults"></div>
            <div class="modal-buttons">
                <button class="btn-yes" id="savePdf" style="display: none;">Salvar PDF</button>
                <button class="btn-no" id="closeReport">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const dataInicio = modal.querySelector('#dataInicio');
    const dataFim = modal.querySelector('#dataFim');
    const reportResults = modal.querySelector('#reportResults');
    const savePdfBtn = modal.querySelector('#savePdf');
    let filteredRecords = [];
    
    modal.querySelector('#searchReport').addEventListener('click', () => {
        if (!dataInicio.value || !dataFim.value) {
            showNotification('Por favor, preencha as datas de início e fim', true);
            return;
        }
        
        const startDate = new Date(dataInicio.value).getTime();
        const endDate = new Date(dataFim.value).getTime();
        
        if (startDate > endDate) {
            showNotification('Data inicial não pode ser maior que data final', true);
            return;
        }
        
        filteredRecords = Object.entries(allRecords)
            .map(([id, record]) => ({ id, ...record }))
            .filter(record => record.timestamp >= startDate && record.timestamp <= endDate)
            .sort((a, b) => b.timestamp - a.timestamp);
        
        if (filteredRecords.length === 0) {
            reportResults.innerHTML = '<div class="report-count">Nenhum registro encontrado neste período</div>';
            savePdfBtn.style.display = 'none';
            return;
        }
        
        savePdfBtn.style.display = 'block';
        
        const recordsHtml = filteredRecords.map(record => `
            <div class="record-item">
                <div class="record-header">
                    <span class="record-type">${record.tipo}${record.postoGraduacao ? ` - ${record.postoGraduacao}` : ''}</span>
                    <span class="record-datetime">${record.dataHora}</span>
                </div>
                <div class="record-details">
                    <div><strong>RE/RG:</strong> ${record.reRg}</div>
                    <div><strong>Unidade:</strong> ${record.unidade}</div>
                    <div><strong>Destino:</strong> ${record.destino}</div>
                    <div><strong>Telefone:</strong> ${record.telefone}</div>
                    <div><strong>Status:</strong> <span style="color: ${record.status === 'Autorizado' ? '#16a34a' : '#dc2626'}; font-weight: 600;">${record.status}</span></div>
                    ${record.horaSaida ? `<div><strong>Hora Saída:</strong> ${record.horaSaida}</div>` : ''}
                    ${record.observacao ? `<div style="grid-column: 1 / -1;"><strong>Observação:</strong> ${record.observacao}</div>` : ''}
                </div>
            </div>
        `).join('');
        
        reportResults.innerHTML = `
            <div class="report-count">Total de registros encontrados: ${filteredRecords.length}</div>
            <div class="report-results">${recordsHtml}</div>
        `;
    });
    
    savePdfBtn.addEventListener('click', () => {
        generatePDF(filteredRecords, dataInicio.value, dataFim.value);
    });
    
    modal.querySelector('#closeReport').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function generatePDF(records, startDate, endDate) {
    const startFormatted = new Date(startDate).toLocaleString('pt-BR');
    const endFormatted = new Date(endDate).toLocaleString('pt-BR');
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Acessos - COPOM PMESP</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
                h2 { text-align: center; font-size: 14px; margin-bottom: 5px; }
                .period { text-align: center; font-size: 12px; margin-bottom: 20px; color: #666; }
                .count { text-align: center; font-size: 12px; margin-bottom: 20px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; font-size: 10px; }
                th, td { border: 1px solid #000; padding: 6px; text-align: left; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .status-autorizado { color: green; font-weight: bold; }
                .status-nao-autorizado { color: red; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>RELATÓRIO DE CONTROLE DE ACESSO</h1>
            <h2>COPOM - Polícia Militar de São Paulo</h2>
            <div class="period">Período: ${startFormatted} até ${endFormatted}</div>
            <div class="count">Total de Registros: ${records.length}</div>
            <table>
                <thead>
                    <tr>
                        <th>Data/Hora Entrada</th>
                        <th>Tipo</th>
                        <th>Posto/Grad.</th>
                        <th>RE/RG</th>
                        <th>Nome Completo</th>
                        <th>Unidade</th>
                        <th>Destino</th>
                        <th>Telefone</th>
                        <th>Status</th>
                        <th>Hora Saída</th>
                        <th>Observação</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    records.forEach(record => {
        html += `
            <tr>
                <td>${record.dataHora}</td>
                <td>${record.tipo}</td>
                <td>${record.postoGraduacao || '-'}</td>
                <td>${record.reRg}</td>
                <td>${record.nomeCompleto || '-'}</td>
                <td>${record.unidade}</td>
                <td>${record.destino}</td>
                <td>${record.telefone}</td>
                <td class="${record.status === 'Autorizado' ? 'status-autorizado' : 'status-nao-autorizado'}">${record.status}</td>
                <td>${record.horaSaida || '-'}</td>
                <td>${record.observacao || '-'}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_acessos_${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Relatório HTML gerado! Abra o arquivo e use Ctrl+P para salvar como PDF');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        tipo: document.getElementById('tipo').value,
        reRg: document.getElementById('reRg').value,
        nomeCompleto: document.getElementById('nomeCompleto').value,
        unidade: document.getElementById('unidade').value,
        destino: document.getElementById('destino').value,
        telefone: document.getElementById('telefone').value,
        status: document.getElementById('status').value,
        dataHora: dataHoraInput.value,
        timestamp: Date.now()
    };
    
    if (formData.tipo === 'Militar') {
        formData.postoGraduacao = document.getElementById('postoGraduacao').value;
    }

    // Automatically add exit time for non-authorized status
    if (formData.status === 'Não Autorizado') {
        const now = new Date();
        formData.horaSaida = now.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        formData.timestampSaida = Date.now();
    }

    if (formData.status === 'Não Autorizado') {
        pendingFormData = formData;
        showObservationModal();
        return;
    }

    try {
        await push(ref(database, 'acessos'), formData);
        form.reset();
        postoGraduacaoGroup.style.display = 'none';
        postoGraduacaoSelect.required = false;
        updateDateTime();
        showNotification('Registro salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showNotification('Erro ao salvar registro', true);
    }
});

function showObservationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>Acesso Não Autorizado</h3>
            <p style="margin-bottom: 16px; color: #555;">Por favor, insira uma observação sobre o motivo da não autorização:</p>
            <textarea id="observacao" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: 'Noto Sans', sans-serif; resize: vertical; text-transform: uppercase;" placeholder="Digite a observação..." required></textarea>
            <div class="modal-buttons" style="margin-top: 20px;">
                <button class="btn-yes" id="saveObservation">Salvar</button>
                <button class="btn-no" id="cancelObservation">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const textarea = modal.querySelector('#observacao');
    textarea.addEventListener('input', (e) => {
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.toUpperCase();
        e.target.setSelectionRange(start, end);
    });
    
    textarea.focus();
    
    modal.querySelector('#saveObservation').addEventListener('click', async () => {
        const observacao = textarea.value.trim();
        if (!observacao) {
            showNotification('Por favor, insira uma observação', true);
            return;
        }
        
        pendingFormData.observacao = observacao;
        
        try {
            await push(ref(database, 'acessos'), pendingFormData);
            form.reset();
            postoGraduacaoGroup.style.display = 'none';
            postoGraduacaoSelect.required = false;
            updateDateTime();
            modal.remove();
            pendingFormData = null;
            showNotification('Registro salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showNotification('Erro ao salvar registro', true);
        }
    });
    
    modal.querySelector('#cancelObservation').addEventListener('click', () => {
        modal.remove();
        pendingFormData = null;
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            pendingFormData = null;
        }
    });
}

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${isError ? '#e53e3e' : '#1a1a1a'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

onValue(ref(database, 'acessos'), (snapshot) => {
    const data = snapshot.val();
    allRecords = data || {};
    
    if (!data) {
        recordsList.innerHTML = '<div class="no-records">Nenhum registro encontrado</div>';
        return;
    }
    
    const records = Object.entries(data)
        .map(([id, record]) => ({ id, ...record }))
        .sort((a, b) => b.timestamp - a.timestamp);
    
    // Filter records from last 13 hours without exit time
    const thirteenHoursAgo = Date.now() - (13 * 60 * 60 * 1000);
    const recentRecords = records.filter(record => 
        record.timestamp >= thirteenHoursAgo && !record.horaSaida
    );
    
    if (recentRecords.length === 0) {
        recordsList.innerHTML = '<div class="no-records">Nenhum registro encontrado nas últimas 13 horas</div>';
        return;
    }
    
    recordsList.innerHTML = recentRecords.map(record => `
        <div class="record-item">
            <div class="record-header">
                <span class="record-type">${record.tipo}${record.postoGraduacao ? ` - ${record.postoGraduacao}` : ''}</span>
                <span class="record-datetime">${record.dataHora}</span>
            </div>
            <div class="record-details">
                <div><strong>RE/RG:</strong> ${record.reRg}</div>
                ${record.nomeCompleto ? `<div><strong>Nome:</strong> ${record.nomeCompleto}</div>` : ''}
                <div><strong>Unidade:</strong> ${record.unidade}</div>
                <div><strong>Destino:</strong> ${record.destino}</div>
                <div><strong>Telefone:</strong> ${record.telefone}</div>
                <div><strong>Status:</strong> <span style="color: ${record.status === 'Autorizado' ? '#16a34a' : '#dc2626'}; font-weight: 600;">${record.status}</span></div>
                ${record.observacao ? `<div style="grid-column: 1 / -1;"><strong>Observação:</strong> ${record.observacao}</div>` : ''}
            </div>
            <button class="btn-exit-time" data-id="${record.id}">Registrar Hora de Saída</button>
        </div>
    `).join('');
    
    // Add event listeners to exit time buttons
    document.querySelectorAll('.btn-exit-time').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const recordId = e.target.dataset.id;
            const now = new Date();
            const horaSaida = now.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            try {
                const { update } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
                await update(ref(database, `acessos/${recordId}`), {
                    horaSaida: horaSaida,
                    timestampSaida: Date.now()
                });
                showNotification('Hora de saída registrada com sucesso!');
            } catch (error) {
                console.error('Erro ao registrar hora de saída:', error);
                showNotification('Erro ao registrar hora de saída', true);
            }
        });
    });
});