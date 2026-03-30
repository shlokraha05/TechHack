const State = {
    isProcessing: false,
    file: null,
    apiData: null
};

// ======================== PAGE INITIALIZATION (MPA LOGIC) ========================
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on Dashboard
    if (document.getElementById('dashboardView')) {
        initializeDashboard();
    }
    
    // Check if Cost Table logic is needed
    if (document.getElementById('costView') || document.getElementById('cost-table-body')) {
        window.updateCalculations();
    }
});

// ======================== PIPELINE & UPLOAD LOGIC (INDEX.HTML) ========================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const pipelineContainer = document.getElementById('pipelineContainer');
const pipelineStepsContainer = document.getElementById('pipelineSteps');
const viewResultsBtn = document.getElementById('viewResultsBtn');
const assetName = document.getElementById('assetName');

if (dropZone) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-struct-cyan');
    });
    
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-struct-cyan'));
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-struct-cyan');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });
}

function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleFile(file) {
    if (State.isProcessing) return;
    State.isProcessing = true;
    State.file = file;

    // Cache image to memory
    try {
        const base64Img = await convertImageToBase64(file);
        localStorage.setItem('techHack_imgData', base64Img);
    } catch (e) {
        console.error("Failed to cache image for MPA handoff:", e);
    }

    assetName.innerText = file.name;
    dropZone.classList.add('hidden');
    pipelineContainer.classList.remove('hidden');
    viewResultsBtn.classList.add('hidden');
    document.getElementById('serverErrorBox').classList.add('hidden');
    
    const stepNames = ["Parse", "Reconstruct", "3D Model", "Materials", "Explain"];
    pipelineStepsContainer.innerHTML = '';
    
    stepNames.forEach((name, idx) => {
        const box = document.createElement('div');
        box.className = 'border border-struct-border bg-struct-surface rounded object-cover overflow-hidden flex flex-col p-3 transition-colors opacity-50 block-step';
        box.id = `step-box-${idx}`;
        box.innerHTML = `
            <div class="h-0.5 w-full bg-struct-border mb-2 block-bar transition-colors"></div>
            <p class="text-[10px] text-slate-500 font-mono mb-1">0${idx+1}</p>
            <p class="text-xs font-semibold text-slate-400 block-title transition-colors">${name}</p>
        `;
        pipelineStepsContainer.appendChild(box);
    });

    const formData = new FormData();
    formData.append('image', file);

    const pipelineProgress = document.getElementById('pipelineProgress');
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
        if(currentStep < stepNames.length - 1) { 
            activateStep(currentStep);
            pipelineProgress.innerText = `${Math.round((currentStep / stepNames.length) * 100)}%`;
            currentStep++;
        }
    }, 600);

    try {
        const response = await fetch('http://127.0.0.1:5000/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache API response for Dashboard rendering
        localStorage.setItem('techHack_apiData', JSON.stringify(data));
        
        clearInterval(progressInterval);
        
        for(let i=0; i<stepNames.length; i++) activateStep(i, true);
        pipelineProgress.innerText = '100%';
        document.getElementById('pipelineStatusText').innerText = "PIPELINE OPTIMIZED.";
        document.getElementById('pipelineStatusText').classList.replace('text-struct-accent', 'text-struct-cyan');
        document.getElementById('pipelineStatusText').classList.remove('animate-pulse');
        
        // Adjust the view results link for the new MPA
        viewResultsBtn.onclick = () => window.location.href = 'dashboard.html';
        viewResultsBtn.classList.remove('hidden');

    } catch (error) {
        clearInterval(progressInterval);
        console.error(error);
        const errBox = document.getElementById('serverErrorBox');
        errBox.classList.remove('hidden');
        errBox.innerText = error.message;
    } finally {
        State.isProcessing = false;
        lucide.createIcons();
    }
}

function activateStep(index, isFinal = false) {
    const box = document.getElementById(`step-box-${index}`);
    if(box) {
        box.classList.remove('opacity-50');
        box.classList.add('border-struct-cyan/30', 'bg-struct-cyan/5');
        box.querySelector('.block-bar').classList.replace('bg-struct-border', 'bg-struct-cyan');
        box.querySelector('.block-title').classList.replace('text-slate-400', 'text-white');
    }
}


// ======================== DASHBOARD LOGIC (DASHBOARD.HTML) ========================
function initializeDashboard() {
    const apiDataStr = localStorage.getItem('techHack_apiData');
    const imgDataStr = localStorage.getItem('techHack_imgData');
    
    if (apiDataStr && imgDataStr) {
        const data = JSON.parse(apiDataStr);
        populateDashboard(data);
        
        const img = new Image();
        img.onload = () => {
            if(!window.viewer2dInstance) {
                window.viewer2dInstance = new Viewer2D('canvas2dContainer', 'view2d');
            }
            if(!window.viewer3dInstance) {
                window.viewer3dInstance = new Viewer3D('canvas3dContainer');
            }
            
            window.viewer2dInstance.setData(data.walls, data.issues);
            window.viewer3dInstance.setData(data);
            window.viewer2dInstance.setImage(img, data.polygons);
            
            setTimeout(() => {
                window.viewer3dInstance.resize();
                window.viewer2dInstance.resize();
            }, 100);
        };
        img.src = imgDataStr;
    } else {
        console.warn("No analysis payload cached in session.");
        // We could redirect back to index.html here, but it's good to allow manual viewing without errors.
    }
}

function populateDashboard(data) {
    const matContainer = document.getElementById('materialsList');
    if (matContainer) {
        matContainer.innerHTML = '';
        if (data.materials && data.materials.length > 0) {
            data.materials.forEach(matGroup => {
                const topRec = matGroup.recommendations[0]; 
                
                const card = document.createElement('div');
                card.className = 'bg-[#181920] border border-struct-border hover:border-struct-accent/50 transition-colors rounded-xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden group';
                card.innerHTML = `
                    <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-struct-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="flex justify-between items-start mb-6">
                        <div>
                             <div class="px-2 py-1 bg-struct-accent/10 text-struct-accent text-[8px] font-bold uppercase tracking-widest rounded mb-3 inline-block border border-struct-accent/20">Wall Seg #${matGroup.wallId}</div>
                             <h4 class="text-white font-bold text-lg">${topRec.name}</h4>
                        </div>
                        <div class="bg-[#1e1f29] border border-white/5 px-3 py-1.5 rounded-md flex flex-col items-center">
                            <span class="text-white font-mono text-sm leading-none">${topRec.score}</span>
                            <span class="text-[8px] text-slate-500 pt-1 leading-none uppercase tracking-widest">Score</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 border-t border-struct-border pt-4">
                        <div><p class="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Cost</p><p class="text-xs text-struct-cyan font-medium">${topRec.cost}</p></div>
                        <div><p class="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Strength</p><p class="text-xs text-struct-cyan font-medium">${topRec.strength}</p></div>
                        <div><p class="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Durability</p><p class="text-xs text-white">${topRec.durability}</p></div>
                    </div>
                `;
                matContainer.appendChild(card);
            });
        }
    }

    const expContainer = document.getElementById('explanationsList');
    if (expContainer) {
        expContainer.innerHTML = '';
        if (data.explanations && data.explanations.length > 0) {
            data.explanations.forEach(exp => {
                const p = document.createElement('p');
                p.className = 'text-sm text-slate-300 leading-relaxed max-w-4xl tracking-wide';
                p.innerHTML = exp.replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-bold bg-struct-surface px-1 py-0.5 rounded">$1</span>');
                expContainer.appendChild(p);
            });
        } else {
            expContainer.innerHTML = '<p class="text-sm text-slate-500">No explicit AI insights generated for this structure.</p>';
        }
    }
}

// ======================== UI INTERACTIONS ========================

// Dashboard Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Only run logic if we are actually using JS tabs (data-target)
        if (!e.target.hasAttribute('data-target')) return;
        
        tabBtns.forEach(b => {
             if (b.hasAttribute('data-target')) {
                 b.classList.remove('text-white', 'border-struct-accent');
                 b.classList.add('text-slate-500', 'border-transparent');
             }
        });
        e.target.classList.add('text-white', 'border-struct-accent');
        e.target.classList.remove('text-slate-500', 'border-transparent');
        
        tabContents.forEach(content => content.classList.add('hidden'));
        const targetId = e.target.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.classList.remove('hidden');
    });
});

// Docs Layout Side-navigation
window.handleDocNav = function(clickedBtn, sectionId) {
    const allBtns = document.querySelectorAll('.doc-nav-btn');
    allBtns.forEach(btn => {
        btn.classList.remove('active', 'bg-slate-800/80', 'text-cyan-400', 'border-cyan-400');
        btn.classList.add('text-slate-500', 'border-transparent', 'hover:text-slate-300', 'hover:bg-slate-900/40');
    });
    
    clickedBtn.classList.add('active', 'bg-slate-800/80', 'text-cyan-400', 'border-cyan-400');
    clickedBtn.classList.remove('text-slate-500', 'border-transparent', 'hover:text-slate-300', 'hover:bg-slate-900/40');
    
    const target = document.getElementById(sectionId);
    if(target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Cost Controller Calculator
window.updateCalculations = function() {
    let grandTotal = 0;
    let activeItems = 0;

    document.querySelectorAll('tbody#cost-table-body tr').forEach(row => {
        const priceInput = row.querySelector('.price-input');
        const qtyInput = row.querySelector('.qty-input');
        if (!priceInput || !qtyInput) return;
        
        const price = parseFloat(priceInput.value) || 0;
        const qty = parseFloat(qtyInput.value) || 0;
        
        const total = price * qty;
        if(qty > 0) activeItems++;
        
        const rowTotalEl = row.querySelector('.row-total');
        if(rowTotalEl) {
            rowTotalEl.innerText = total.toLocaleString('en-IN', {
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2
            });
        }
        grandTotal += total;
    });

    const grandTotalEl = document.getElementById('grand-total');
    if(grandTotalEl) {
        grandTotalEl.innerText = grandTotal.toLocaleString('en-IN', {
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2
        });
    }

    const itemCountEl = document.getElementById('item-count');
    if(itemCountEl) {
        itemCountEl.innerText = activeItems + (activeItems === 1 ? " Material" : " Materials");
    }
};

document.querySelectorAll('.price-input, .qty-input').forEach(input => {
    input.addEventListener('input', window.updateCalculations);
});

// ======================== MPA INITIALIZATION ROUTER ========================
document.addEventListener('DOMContentLoaded', () => {
    // If we land on the dashboard, parse cached payload and render 3D
    if (document.getElementById('dashboardView')) {
        initializeDashboard();
    }
    
    // If we land on the Cost Controller, trigger initial calculation loop
    if (document.querySelector('.qty-input') && typeof window.updateCalculations === 'function') {
        window.updateCalculations();
    }
});
