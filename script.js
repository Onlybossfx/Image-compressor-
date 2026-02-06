// ===== APP STATE =====
const state = {
    files: [],
    compressedFiles: [],
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    isProcessing: false,
    processingQueue: [],
    currentProcessingIndex: 0
};

// ===== DOM ELEMENTS =====
const elements = {
    // File Input
    fileInput: document.getElementById('fileInput'),
    dropZone: document.getElementById('dropZone'),
    fileList: document.getElementById('fileList'),
    
    // Settings
    qualitySlider: document.getElementById('quality'),
    qualityValue: document.getElementById('qualityValue'),
    maxWidthSlider: document.getElementById('maxWidth'),
    widthValue: document.getElementById('widthValue'),
    formatButtons: document.querySelectorAll('.format-btn'),
    compressionLevel: document.getElementById('compressionLevel'),
    preserveExif: document.getElementById('preserveExif'),
    maintainAspect: document.getElementById('maintainAspect'),
    
    // Advanced Settings
    advancedToggle: document.getElementById('advancedToggle'),
    advancedSettings: document.getElementById('advancedSettings'),
    
    // Action Buttons
    clearAllBtn: document.getElementById('clearAll'),
    compressBtn: document.getElementById('compressBtn'),
    downloadAllBtn: document.getElementById('downloadAll'),
    
    // Results
    comparisonViewer: document.getElementById('comparisonViewer'),
    resultsBody: document.getElementById('resultsBody'),
    totalSavings: document.getElementById('totalSavings'),
    savingsValue: document.querySelector('.savings-value'),
    savingsPercent: document.querySelector('.savings-percent'),
    
    // Metrics
    totalData: document.getElementById('totalData'),
    avgCompression: document.getElementById('avgCompression'),
    timeSaved: document.getElementById('timeSaved'),
    memoryUsage: document.getElementById('memoryUsage'),
    performanceScore: document.getElementById('performanceScore'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    progressBar: document.getElementById('progressBar'),
    currentFile: document.getElementById('currentFile'),
    progressPercent: document.getElementById('progressPercent'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ===== UTILITY FUNCTIONS =====
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatPercentage(value) {
    return Math.round(value) + '%';
}

function calculateSavings(original, compressed) {
    const savings = original - compressed;
    const percentage = original > 0 ? (savings / original) * 100 : 0;
    return {
        size: savings,
        percentage: percentage
    };
}

function showToast(type, title, message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove
    const removeToast = () => {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', removeToast);
    
    // Auto remove after duration
    setTimeout(removeToast, duration);
}

// ===== FILE HANDLING =====
function addFiles(fileList) {
    const newFiles = Array.from(fileList).filter(file => 
        file.type.startsWith('image/') && 
        !state.files.some(existing => existing.name === file.name && existing.size === file.size)
    );
    
    if (newFiles.length === 0) return;
    
    state.files.push(...newFiles);
    updateFileList();
    updateMetrics();
    
    showToast('success', 'Files Added', `Added ${newFiles.length} image${newFiles.length > 1 ? 's' : ''} to queue`);
}

function removeFile(index) {
    const file = state.files[index];
    state.files.splice(index, 1);
    
    // Also remove compressed version if exists
    const compressedIndex = state.compressedFiles.findIndex(f => f.originalName === file.name);
    if (compressedIndex !== -1) {
        state.compressedFiles.splice(compressedIndex, 1);
    }
    
    updateFileList();
    updateResultsTable();
    updateMetrics();
    updateComparisonViewer();
}

function updateFileList() {
    elements.fileList.innerHTML = '';
    
    if (state.files.length === 0) {
        elements.fileList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>No images selected</p>
            </div>
        `;
        return;
    }
    
    state.files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-image file-icon"></i>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <div class="file-actions">
                <button class="file-action-btn" title="Preview" data-index="${index}" data-action="preview">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="file-action-btn" title="Remove" data-index="${index}" data-action="remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        elements.fileList.appendChild(fileItem);
    });
    
    // Add event listeners
    document.querySelectorAll('[data-action="remove"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('button').dataset.index);
            removeFile(index);
        });
    });
    
    document.querySelectorAll('[data-action="preview"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('button').dataset.index);
            previewFile(index);
        });
    });
}

// ===== SETTINGS HANDLERS =====
function updateSliderValues() {
    elements.qualityValue.textContent = elements.qualitySlider.value + '%';
    elements.widthValue.textContent = elements.maxWidthSlider.value + 'px';
}

function initFormatButtons() {
    elements.formatButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.formatButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function initAdvancedToggle() {
    elements.advancedToggle.addEventListener('click', () => {
        const isActive = elements.advancedSettings.classList.toggle('show');
        elements.advancedToggle.classList.toggle('active', isActive);
        
        const icon = elements.advancedToggle.querySelector('.fa-chevron-down');
        if (icon) {
            icon.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0)';
        }
    });
}

// ===== COMPRESSION =====
async function compressImage(file, options, index, total) {
    try {
        updateLoadingProgress(index + 1, total, file.name);
        
        const compressionOptions = {
            maxSizeMB: options.maxSizeMB || 20,
            maxWidthOrHeight: options.maxWidth || undefined,
            useWebWorker: true,
            maxIteration: options.compressionLevel || 4,
            exifOrientation: options.preserveExif ? undefined : 1,
            initialQuality: options.quality / 100,
            alwaysKeepResolution: options.maintainAspect !== false
        };
        
        const compressedFile = await imageCompression(file, compressionOptions);
        
        // Handle format conversion if needed
        let finalFile = compressedFile;
        const format = document.querySelector('.format-btn.active').dataset.format;
        
        if (format !== 'original') {
            // In a real implementation, you would convert the format here
            // For now, we'll just use the compressed file
            finalFile = compressedFile;
        }
        
        return {
            file: finalFile,
            originalSize: file.size,
            compressedSize: finalFile.size,
            originalName: file.name,
            format: format
        };
    } catch (error) {
        console.error('Compression error:', error);
        throw error;
    }
}

async processAllImages() {
    if (state.files.length === 0 || state.isProcessing) return;
    
    state.isProcessing = true;
    state.compressedFiles = [];
    state.totalOriginalSize = 0;
    state.totalCompressedSize = 0;
    
    // Show loading
    elements.loadingOverlay.classList.add('active');
    elements.compressBtn.disabled = true;
    elements.compressBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Get compression options
    const options = {
        quality: parseInt(elements.qualitySlider.value),
        maxWidth: parseInt(elements.maxWidthSlider.value),
        compressionLevel: parseInt(elements.compressionLevel.value),
        preserveExif: elements.preserveExif.checked,
        maintainAspect: elements.maintainAspect.checked
    };
    
    try {
        for (let i = 0; i < state.files.length; i++) {
            const file = state.files[i];
            
            try {
                const result = await compressImage(file, options, i, state.files.length);
                state.compressedFiles.push(result);
                
                // Update running totals
                state.totalOriginalSize += result.originalSize;
                state.totalCompressedSize += result.compressedSize;
                
                // Update results table in real-time
                updateResultsTable();
                updateMetrics();
                
            } catch (error) {
                console.error(`Failed to compress ${file.name}:`, error);
                // Add error entry
                state.compressedFiles.push({
                    error: true,
                    originalName: file.name,
                    originalSize: file.size
                });
            }
        }
        
        // Complete
        updateComparisonViewer();
        updateMetrics();
        elements.downloadAllBtn.disabled = false;
        
        showToast('success', 'Compression Complete', 
            `Compressed ${state.compressedFiles.length} image${state.compressedFiles.length > 1 ? 's' : ''} successfully`);
        
    } catch (error) {
        showToast('error', 'Compression Failed', 'An error occurred during compression');
    } finally {
        // Hide loading
        elements.loadingOverlay.classList.remove('active');
        elements.compressBtn.disabled = false;
        elements.compressBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Compress All Images';
        state.isProcessing = false;
    }
}

function updateLoadingProgress(current, total, fileName) {
    const percent = Math.round((current / total) * 100);
    elements.progressBar.style.width = percent + '%';
    elements.progressPercent.textContent = percent + '%';
    elements.currentFile.textContent = fileName || 'Processing...';
    elements.loadingText.textContent = `Processing image ${current} of ${total}`;
}

// ===== RESULTS DISPLAY =====
function updateResultsTable() {
    elements.resultsBody.innerHTML = '';
    
    if (state.compressedFiles.length === 0) {
        elements.resultsBody.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-image"></i>
                <p>No images processed yet</p>
            </div>
        `;
        return;
    }
    
    state.compressedFiles.forEach((result, index) => {
        const row = document.createElement('div');
        row.className = 'table-row';
        
        if (result.error) {
            row.innerHTML = `
                <div class="col-name">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${result.originalName}</span>
                </div>
                <div class="col-original">${formatFileSize(result.originalSize)}</div>
                <div class="col-compressed">—</div>
                <div class="col-savings">—</div>
                <div class="col-status">
                    <span class="status-badge error">Error</span>
                </div>
            `;
        } else {
            const savings = calculateSavings(result.originalSize, result.compressedSize);
            
            row.innerHTML = `
                <div class="col-name">
                    <i class="fas fa-file-image"></i>
                    <span>${result.originalName}</span>
                </div>
                <div class="col-original">${formatFileSize(result.originalSize)}</div>
                <div class="col-compressed">${formatFileSize(result.compressedSize)}</div>
                <div class="col-savings">${formatFileSize(savings.size)} (${formatPercentage(savings.percentage)})</div>
                <div class="col-status">
                    <span class="status-badge success">Success</span>
                </div>
            `;
        }
        
        elements.resultsBody.appendChild(row);
    });
}

function updateComparisonViewer() {
    if (state.compressedFiles.length === 0 || state.compressedFiles.some(f => f.error)) {
        elements.comparisonViewer.innerHTML = `
            <div class="comparison-placeholder">
                <i class="fas fa-exchange-alt"></i>
                <p>Upload and compress images to see comparison</p>
            </div>
        `;
        return;
    }
    
    // Show first successful compression
    const firstSuccess = state.compressedFiles.find(f => !f.error);
    if (!firstSuccess) return;
    
    elements.comparisonViewer.innerHTML = `
        <div class="comparison-container">
            <div class="comparison-item">
                <div class="comparison-label">Original (${formatFileSize(firstSuccess.originalSize)})</div>
                <div class="comparison-image">
                    <img src="${URL.createObjectURL(state.files.find(f => f.name === firstSuccess.originalName))}" 
                         alt="Original">
                </div>
            </div>
            <div class="comparison-item">
                <div class="comparison-label">Compressed (${formatFileSize(firstSuccess.compressedSize)})</div>
                <div class="comparison-image">
                    <img src="${URL.createObjectURL(firstSuccess.file)}" 
                         alt="Compressed">
                </div>
            </div>
        </div>
    `;
}

function updateMetrics() {
    // Update savings
    const savings = calculateSavings(state.totalOriginalSize, state.totalCompressedSize);
    elements.savingsValue.textContent = formatFileSize(savings.size);
    elements.savingsPercent.textContent = formatPercentage(savings.percentage);
    
    // Update data processed
    elements.totalData.textContent = formatFileSize(state.totalOriginalSize);
    
    // Update average compression
    const avg = state.compressedFiles.length > 0 && !state.compressedFiles.every(f => f.error) ? 
        savings.percentage : 0;
    elements.avgCompression.textContent = formatPercentage(avg);
    
    // Update time saved (estimate: 1MB = 1 second of download time)
    const timeSavedSeconds = Math.round(savings.size / (1024 * 1024));
    elements.timeSaved.textContent = `${timeSavedSeconds}s`;
    
    // Update memory usage (rough estimate)
    const memoryUsed = (state.totalOriginalSize + state.totalCompressedSize) / (1024 * 1024);
    elements.memoryUsage.textContent = memoryUsed.toFixed(1) + ' MB';
    
    // Update performance score
    const score = Math.min(100, Math.max(0, 100 - (memoryUsed / 10)));
    elements.performanceScore.textContent = Math.round(score) + '%';
}

// ===== DOWNLOAD =====
function downloadAllCompressed() {
    if (state.compressedFiles.length === 0 || state.compressedFiles.every(f => f.error)) {
        showToast('warning', 'No Files', 'No compressed files available to download');
        return;
    }
    
    // For multiple files, create a ZIP
    if (state.compressedFiles.length > 1) {
        createAndDownloadZip();
    } else {
        // Single file download
        const result = state.compressedFiles[0];
        if (!result.error) {
            downloadFile(result.file, `compressed_${result.originalName}`);
        }
    }
}

function downloadFile(file, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

async function createAndDownloadZip() {
    try {
        elements.downloadAllBtn.disabled = true;
        elements.downloadAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating ZIP...';
        
        // Load JSZip dynamically if needed
        if (typeof JSZip === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        }
        
        const zip = new JSZip();
        
        state.compressedFiles.forEach((result, index) => {
            if (!result.error) {
                const extension = result.format === 'original' ? 
                    result.originalName.split('.').pop() : result.format;
                const filename = `compressed_${result.originalName.replace(/\.[^/.]+$/, "")}.${extension}`;
                zip.file(filename, result.file);
            }
        });
        
        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(content, 'compressed_images.zip');
        
        showToast('success', 'Download Complete', 'All compressed files downloaded as ZIP');
        
    } catch (error) {
        console.error('ZIP creation failed:', error);
        showToast('error', 'Download Failed', 'Failed to create ZIP file');
    } finally {
        elements.downloadAllBtn.disabled = false;
        elements.downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> Download All';
    }
}

async function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ===== INITIALIZATION =====
function initEventListeners() {
    // File input
    elements.fileInput.addEventListener('change', (e) => addFiles(e.target.files));
    
    // Drag and drop
    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('dragover');
    });
    
    elements.dropZone.addEventListener('dragleave', () => {
        elements.dropZone.classList.remove('dragover');
    });
    
    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('dragover');
        addFiles(e.dataTransfer.files);
    });
    
    // Click to browse
    elements.dropZone.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    // Settings sliders
    elements.qualitySlider.addEventListener('input', updateSliderValues);
    elements.maxWidthSlider.addEventListener('input', updateSliderValues);
    
    // Action buttons
    elements.clearAllBtn.addEventListener('click', () => {
        state.files = [];
        state.compressedFiles = [];
        updateFileList();
        updateResultsTable();
        updateComparisonViewer();
        updateMetrics();
        elements.downloadAllBtn.disabled = true;
        showToast('info', 'Cleared', 'All files and results cleared');
    });
    
    elements.compressBtn.addEventListener('click', processAllImages);
    elements.downloadAllBtn.addEventListener('click', downloadAllCompressed);
}

function initPerformanceMonitoring() {
    // Update memory usage periodically
    setInterval(() => {
        if (performance.memory) {
            const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            elements.memoryUsage.textContent = usedMB.toFixed(1) + ' MB';
        }
    }, 5000);
}

// ===== MAIN INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize settings
    updateSliderValues();
    initFormatButtons();
    initAdvancedToggle();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize performance monitoring
    initPerformanceMonitoring();
    
    // Initial metrics update
    updateMetrics();
    
    // Show welcome toast
    setTimeout(() => {
        showToast('info', 'Welcome to PixelPress', 
            'Drag & drop images to start compressing. All processing happens in your browser.', 
            8000);
    }, 1000);
});

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showToast('error', 'Application Error', 'An unexpected error occurred. Please refresh the page.');
});

// ===== PWA SUPPORT =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}

