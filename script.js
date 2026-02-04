// ===== DOM Elements & State =====
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle?.querySelector('i');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const filesProcessed = document.getElementById('filesProcessed');
const dataSaved = document.getElementById('dataSaved');

// State
let imageFiles = [];
let zipFiles = [];
let compressedResults = [];
let currentZipBlob = null;

// ===== Theme Management =====
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ===== Mobile Menu Fix =====
function toggleMobileMenu() {
    navLinks.classList.toggle('show');
}

function closeMobileMenu() {
    navLinks.classList.remove('show');
}

// ===== Statistics Animation =====
function animateStatistics() {
    const options = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(filesProcessed, 12468, 123, 30);
                animateCounter(dataSaved, 874.2, 8.7, 30, true);
                observer.unobserve(entry.target);
            }
        });
    }, options);

    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        observer.observe(heroSection);
    }
}

function animateCounter(element, target, step, interval, isDecimal = false) {
    let count = 0;
    const counter = setInterval(() => {
        count += step;
        if (count >= target) {
            count = target;
            clearInterval(counter);
        }
        element.textContent = isDecimal ? count.toFixed(1) : Math.floor(count).toLocaleString();
    }, interval);
}

// ===== Tool Management =====
function openTool(toolType) {
    closeMobileMenu();
    
    // Hide main content
    document.querySelector('.navbar').classList.add('hidden');
    document.querySelector('.hero').classList.add('hidden');
    document.querySelector('.main-container').classList.add('hidden');
    document.querySelector('.footer').classList.add('hidden');

    // Show selected tool
    if (toolType === 'image') {
        showImageCompressor();
    } else if (toolType === 'zip') {
        showFileZipper();
    }
}

function closeTool() {
    // Hide all tool interfaces
    document.querySelectorAll('.tool-interface').forEach(tool => {
        tool.classList.add('hidden');
        tool.innerHTML = '';
    });

    // Show main content
    document.querySelector('.navbar').classList.remove('hidden');
    document.querySelector('.hero').classList.remove('hidden');
    document.querySelector('.main-container').classList.remove('hidden');
    document.querySelector('.footer').classList.remove('hidden');
}

// ===== Image Compression Tool =====
function showImageCompressor() {
    const toolHTML = `
        <div class="tool-container">
            <div class="tool-header">
                <button onclick="closeTool()" class="back-btn">
                    <i class="fas fa-arrow-left"></i>
                    Back to Home
                </button>
                <h2><i class="fas fa-compress-arrows-alt"></i> Image Compressor</h2>
                <p class="tool-subtitle">Upload images to compress them. All processing happens in your browser.</p>
            </div>
            
            <div class="tool-content">
                <div class="upload-section">
                    <div class="upload-zone" id="imageUploadZone" onclick="document.getElementById('imageInput').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <h3>Drop Images Here</h3>
                        <p>or click to browse (JPEG, PNG, WebP, GIF)</p>
                        <p class="file-limit">Max 20 images, 10MB each</p>
                        <input type="file" id="imageInput" multiple accept="image/*">
                    </div>
                    <div class="file-list" id="imageFileList">
                        <div class="empty-state">
                            <i class="fas fa-images"></i>
                            <p>No images selected</p>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Compression Settings</h3>
                    <div class="settings-grid">
                        <div class="setting">
                            <label for="quality">Quality: <span id="qualityValue">80</span>%</label>
                            <div class="slider-container">
                                <input type="range" id="quality" min="10" max="100" value="80" class="slider">
                                <div class="slider-ticks">
                                    <span>Low</span>
                                    <span>Medium</span>
                                    <span>High</span>
                                </div>
                            </div>
                        </div>
                        <div class="setting">
                            <label for="maxWidth">Max Width (px):</label>
                            <input type="number" id="maxWidth" min="100" max="5000" value="1920" class="number-input">
                        </div>
                        <div class="setting">
                            <label for="outputFormat">Output Format:</label>
                            <select id="outputFormat" class="select-input">
                                <option value="original">Keep Original</option>
                                <option value="jpeg">JPEG</option>
                                <option value="png">PNG</option>
                                <option value="webp">WebP</option>
                            </select>
                        </div>
                        <div class="setting checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="removeMetadata" checked>
                                <span class="checkbox-custom"></span>
                                Remove EXIF Metadata
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="preserveTransparency" checked>
                                <span class="checkbox-custom"></span>
                                Preserve Transparency
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="actions-section">
                    <button id="compressBtn" class="primary-btn" disabled>
                        <i class="fas fa-compress-arrows-alt"></i>
                        Compress Images (<span id="fileCount">0</span>)
                    </button>
                    <button id="clearBtn" class="secondary-btn">
                        <i class="fas fa-trash"></i>
                        Clear All
                    </button>
                </div>
                
                <div class="results-section" id="resultsSection">
                    <div class="section-header">
                        <h3>Compression Results</h3>
                        <div class="summary-stats">
                            <span id="totalSavings">0 KB saved</span>
                            <span id="compressionRatio">0%</span>
                        </div>
                    </div>
                    <div id="resultsList" class="results-list"></div>
                    <div class="download-actions">
                        <button id="downloadAllBtn" class="primary-btn" disabled>
                            <i class="fas fa-download"></i>
                            Download All (<span id="resultCount">0</span>)
                        </button>
                        <button id="newBatchBtn" class="secondary-btn">
                            <i class="fas fa-plus"></i>
                            New Batch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const container = document.getElementById('imageCompressor');
    container.innerHTML = toolHTML;
    container.classList.remove('hidden');
    setupImageCompressor();
}

function setupImageCompressor() {
    imageFiles = [];
    compressedResults = [];
    
    const imageInput = document.getElementById('imageInput');
    const imageUploadZone = document.getElementById('imageUploadZone');
    const imageFileList = document.getElementById('imageFileList');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const compressBtn = document.getElementById('compressBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultsSection = document.getElementById('resultsSection');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const newBatchBtn = document.getElementById('newBatchBtn');
    
    // File upload handling
    imageInput.addEventListener('change', handleImageFiles);
    
    // Drag and drop
    imageUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadZone.classList.add('dragover');
    });
    
    imageUploadZone.addEventListener('dragleave', () => {
        imageUploadZone.classList.remove('dragover');
    });
    
    imageUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        handleImageFiles({ target: { files } });
    });
    
    // Quality slider
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });
    
    // Compress button
    compressBtn.addEventListener('click', compressImages);
    
    // Clear button
    clearBtn.addEventListener('click', () => {
        imageFiles = [];
        compressedResults = [];
        updateImageFileList();
        compressBtn.disabled = true;
        resultsSection.style.display = 'none';
        updateFileCount();
    });
    
    // Download all button
    downloadAllBtn.addEventListener('click', downloadAllCompressed);
    
    // New batch button
    newBatchBtn.addEventListener('click', () => {
        compressedResults = [];
        resultsSection.style.display = 'none';
        updateFileCount();
    });
    
    function handleImageFiles(e) {
        const newFiles = Array.from(e.target.files);
        
        // Filter valid image files
        const validFiles = newFiles.filter(file => {
            if (!file.type.startsWith('image/')) {
                showToast('Only image files are allowed', 'error');
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                showToast(`${file.name} exceeds 10MB limit`, 'error');
                return false;
            }
            return true;
        });
        
        if (validFiles.length === 0) return;
        
        // Add to imageFiles
        validFiles.forEach(file => {
            file.id = Date.now() + Math.random();
            imageFiles.push(file);
        });
        
        // Update UI
        updateImageFileList();
        compressBtn.disabled = imageFiles.length === 0;
        updateFileCount();
        
        // Reset input
        imageInput.value = '';
    }
    
    function updateImageFileList() {
        const emptyState = imageFileList.querySelector('.empty-state');
        
        if (imageFiles.length === 0) {
            imageFileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <p>No images selected</p>
                </div>
            `;
            return;
        }
        
        if (emptyState) emptyState.remove();
        
        imageFileList.innerHTML = imageFiles.map(file => `
            <div class="file-item" data-id="${file.id}">
                <div class="file-info">
                    <i class="fas fa-file-image"></i>
                    <div class="file-details">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                    </div>
                </div>
                <button class="file-remove" onclick="removeImageFile('${file.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    function updateFileCount() {
        const countElement = document.getElementById('fileCount');
        const resultCountElement = document.getElementById('resultCount');
        if (countElement) countElement.textContent = imageFiles.length;
        if (resultCountElement) resultCountElement.textContent = compressedResults.length;
    }
    
    async function compressImages() {
        if (imageFiles.length === 0) return;
        
        compressBtn.disabled = true;
        compressBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        const quality = parseInt(qualitySlider.value) / 100;
        const maxWidth = parseInt(document.getElementById('maxWidth').value);
        const outputFormat = document.getElementById('outputFormat').value;
        const preserveTransparency = document.getElementById('preserveTransparency').checked;
        
        compressedResults = [];
        
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            try {
                const result = await compressImage(file, quality, maxWidth, outputFormat, preserveTransparency);
                compressedResults.push(result);
                
                // Update progress
                const progress = Math.round((i + 1) / imageFiles.length * 100);
                compressBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing... ${progress}%`;
            } catch (error) {
                console.error('Error compressing image:', error);
                showToast(`Failed to compress ${file.name}`, 'error');
            }
        }
        
        // Update UI with results
        updateResults();
        resultsSection.style.display = 'block';
        downloadAllBtn.disabled = compressedResults.length === 0;
        
        // Reset button
        compressBtn.disabled = false;
        compressBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> Compress Images';
    }
    
    async function compressImage(file, quality, maxWidth, outputFormat, preserveTransparency) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = (e) => {
                img.src = e.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Preserve transparency for PNG
                    if (preserveTransparency && (file.type === 'image/png' || outputFormat === 'png')) {
                        ctx.clearRect(0, 0, width, height);
                    }
                    
                    // Draw image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Determine output format
                    let mimeType = file.type;
                    if (outputFormat !== 'original') {
                        mimeType = `image/${outputFormat}`;
                    }
                    
                    // Convert to blob
                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], 
                            `${file.name.replace(/\.[^/.]+$/, "")}_compressed.${outputFormat === 'original' ? file.name.split('.').pop() : outputFormat}`,
                            { type: mimeType }
                        );
                        
                        const originalSize = file.size;
                        const compressedSize = blob.size;
                        const savings = originalSize - compressedSize;
                        const ratio = Math.round((savings / originalSize) * 100);
                        
                        resolve({
                            original: file,
                            compressed: compressedFile,
                            originalSize,
                            compressedSize,
                            savings,
                            ratio
                        });
                    }, mimeType, quality);
                };
                
                img.onerror = reject;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function updateResults() {
        const resultsList = document.getElementById('resultsList');
        const totalSavings = document.getElementById('totalSavings');
        const compressionRatio = document.getElementById('compressionRatio');
        
        if (compressedResults.length === 0) {
            resultsList.innerHTML = '<div class="empty-state"><p>No results yet</p></div>';
            return;
        }
        
        // Calculate totals
        const totalOriginal = compressedResults.reduce((sum, r) => sum + r.originalSize, 0);
        const totalCompressed = compressedResults.reduce((sum, r) => sum + r.compressedSize, 0);
        const totalSavingsBytes = totalOriginal - totalCompressed;
        const avgRatio = Math.round((totalSavingsBytes / totalOriginal) * 100);
        
        // Update summary
        totalSavings.textContent = `${formatFileSize(totalSavingsBytes)} saved`;
        compressionRatio.textContent = `${avgRatio}% reduction`;
        
        // Update results list
        resultsList.innerHTML = compressedResults.map(result => `
            <div class="result-item">
                <div class="result-info">
                    <div class="result-name">
                        <i class="fas fa-file-image"></i>
                        <span>${result.compressed.name}</span>
                    </div>
                    <div class="result-stats">
                        <span class="original-size">${formatFileSize(result.originalSize)}</span>
                        <i class="fas fa-arrow-right"></i>
                        <span class="compressed-size">${formatFileSize(result.compressedSize)}</span>
                        <span class="savings ${result.ratio > 0 ? 'positive' : 'negative'}">
                            ${result.ratio > 0 ? '-' : '+'}${Math.abs(result.ratio)}%
                        </span>
                    </div>
                </div>
                <button class="download-btn" onclick="downloadCompressedFile('${result.compressed.name}', '${result.compressed.type}',
                    '${btoa(String.fromCharCode(...new Uint8Array(result.compressed.slice().arrayBuffer())))}')">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `).join('');
        
        updateFileCount();
    }
}

function removeImageFile(id) {
    imageFiles = imageFiles.filter(file => file.id !== id);
    setupImageCompressor?.();
}

function downloadCompressedFile(filename, type, base64Data) {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function downloadAllCompressed() {
    if (compressedResults.length === 0) return;
    
    // For multiple files, we'll create a ZIP
    const JSZip = window.JSZip;
    if (!JSZip) {
        showToast('JSZip library required for batch download', 'error');
        return;
    }
    
    const zip = new JSZip();
    
    compressedResults.forEach(result => {
        zip.file(result.compressed.name, result.compressed);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compressed_images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== File Zipping Tool =====
function showFileZipper() {
    const toolHTML = `
        <div class="tool-container">
            <div class="tool-header">
                <button onclick="closeTool()" class="back-btn">
                    <i class="fas fa-arrow-left"></i>
                    Back to Home
                </button>
                <h2><i class="fas fa-file-archive"></i> File Zipper</h2>
                <p class="tool-subtitle">Upload files to create a ZIP archive. All processing happens in your browser.</p>
            </div>
            
            <div class="tool-content">
                <div class="upload-section">
                    <div class="upload-zone" id="fileUploadZone" onclick="document.getElementById('fileInput').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <h3>Drop Files Here</h3>
                        <p>or click to browse (Any file type)</p>
                        <p class="file-limit">Max 50 files, 100MB total</p>
                        <input type="file" id="fileInput" multiple>
                    </div>
                    <div class="file-list" id="zipFileList">
                        <div class="empty-state">
                            <i class="fas fa-folder-open"></i>
                            <p>No files selected</p>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>ZIP Settings</h3>
                    <div class="settings-grid">
                        <div class="setting">
                            <label for="compressionLevel">Compression Level:</label>
                            <select id="compressionLevel" class="select-input">
                                <option value="0">No Compression (Fastest)</option>
                                <option value="1">Fast</option>
                                <option value="6" selected>Balanced</option>
                                <option value="9">Maximum (Slowest)</option>
                            </select>
                        </div>
                        <div class="setting">
                            <label for="zipName">Archive Name:</label>
                            <input type="text" id="zipName" value="archive" placeholder="Enter archive name" class="text-input">
                        </div>
                        <div class="setting checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="passwordProtect">
                                <span class="checkbox-custom"></span>
                                Password Protect
                            </label>
                            <div class="password-input-container" id="passwordContainer" style="display: none;">
                                <input type="password" id="password" placeholder="Enter password" class="password-input">
                                <button type="button" id="togglePassword" class="toggle-password">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div class="setting">
                            <label class="checkbox-label">
                                <input type="checkbox" id="keepStructure" checked>
                                <span class="checkbox-custom"></span>
                                Preserve folder structure
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="actions-section">
                    <button id="createZipBtn" class="primary-btn" disabled>
                        <i class="fas fa-file-archive"></i>
                        Create ZIP Archive (<span id="zipFileCount">0</span> files)
                    </button>
                    <button id="clearFilesBtn" class="secondary-btn">
                        <i class="fas fa-trash"></i>
                        Clear All
                    </button>
                </div>
                
                <div class="results-section" id="zipResults">
                    <div class="section-header">
                        <h3>Archive Created</h3>
                        <div class="summary-stats">
                            <span id="totalSize">0 KB total</span>
                            <span id="compressedSize">0 KB compressed</span>
                        </div>
                    </div>
                    <div class="archive-info">
                        <div class="info-item">
                            <i class="fas fa-file"></i>
                            <span>Files: <strong id="archiveFileCount">0</strong></span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-hdd"></i>
                            <span>Original: <strong id="originalTotalSize">0 KB</strong></span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-compress-arrows-alt"></i>
                            <span>Compressed: <strong id="archiveCompressedSize">0 KB</strong></span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-percentage"></i>
                            <span>Reduction: <strong id="archiveReduction">0%</strong></span>
                        </div>
                    </div>
                    <div class="download-actions">
                        <button id="downloadZipBtn" class="primary-btn" disabled>
                            <i class="fas fa-download"></i>
                            Download ZIP Archive
                        </button>
                        <button id="newZipBtn" class="secondary-btn">
                            <i class="fas fa-plus"></i>
                            Create New Archive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const container = document.getElementById('fileZipper');
    container.innerHTML = toolHTML;
    container.classList.remove('hidden');
    setupFileZipper();
}

function setupFileZipper() {
    zipFiles = [];
    currentZipBlob = null;
    
    const fileInput = document.getElementById('fileInput');
    const fileUploadZone = document.getElementById('fileUploadZone');
    const zipFileList = document.getElementById('zipFileList');
    const createZipBtn = document.getElementById('createZipBtn');
    const clearFilesBtn = document.getElementById('clearFilesBtn');
    const passwordProtect = document.getElementById('passwordProtect');
    const passwordContainer = document.getElementById('passwordContainer');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const zipResults = document.getElementById('zipResults');
    const downloadZipBtn = document.getElementById('downloadZipBtn');
    const newZipBtn = document.getElementById('newZipBtn');
    
    // File upload handling
    fileInput.addEventListener('change', handleZipFiles);
    
    // Drag and drop
    fileUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadZone.classList.add('dragover');
    });
    
    fileUploadZone.addEventListener('dragleave', () => {
        fileUploadZone.classList.remove('dragover');
    });
    
    fileUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadZone.classList.remove('dragover');
        handleZipFiles({ target: { files: e.dataTransfer.files } });
    });
    
    // Password protection toggle
    passwordProtect.addEventListener('change', () => {
        passwordContainer.style.display = passwordProtect.checked ? 'block' : 'none';
        if (!passwordProtect.checked) {
            passwordInput.value = '';
        }
    });
    
    // Toggle password visibility
    togglePassword?.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
    
    // Create ZIP button
    createZipBtn.addEventListener('click', createZipArchive);
    
    // Clear button
    clearFilesBtn.addEventListener('click', () => {
        zipFiles = [];
        currentZipBlob = null;
        updateZipFileList();
        createZipBtn.disabled = true;
        zipResults.style.display = 'none';
        updateZipFileCount();
    });
    
    // Download button
    downloadZipBtn.addEventListener('click', downloadZipArchive);
    
    // New archive button
    newZipBtn.addEventListener('click', () => {
        currentZipBlob = null;
        zipResults.style.display = 'none';
        updateZipFileCount();
    });
    
    function handleZipFiles(e) {
        const newFiles = Array.from(e.target.files);
        
        // Check total size
        const totalSize = [...zipFiles, ...newFiles].reduce((sum, file) => sum + file.size, 0);
        if (totalSize > 100 * 1024 * 1024) {
            showToast('Total file size exceeds 100MB limit', 'error');
            return;
        }
        
        // Check file count
        if (zipFiles.length + newFiles.length > 50) {
            showToast('Maximum 50 files allowed', 'error');
            return;
        }
        
        // Add to zipFiles
        newFiles.forEach(file => {
            file.id = Date.now() + Math.random();
            zipFiles.push(file);
        });
        
        // Update UI
        updateZipFileList();
        createZipBtn.disabled = zipFiles.length === 0;
        updateZipFileCount();
        
        // Reset input
        fileInput.value = '';
    }
    
    function updateZipFileList() {
        const emptyState = zipFileList.querySelector('.empty-state');
        
        if (zipFiles.length === 0) {
            zipFileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No files selected</p>
                </div>
            `;
            return;
        }
        
        if (emptyState) emptyState.remove();
        
        // Group files by folder (if they have paths)
        const filesByFolder = {};
        const rootFiles = [];
        
        zipFiles.forEach(file => {
            const path = file.webkitRelativePath || '';
            if (path.includes('/')) {
                const folder = path.split('/')[0];
                if (!filesByFolder[folder]) {
                    filesByFolder[folder] = [];
                }
                filesByFolder[folder].push(file);
            } else {
                rootFiles.push(file);
            }
        });
        
        let html = '';
        
        // Add root files
        rootFiles.forEach(file => {
            html += createFileItemHTML(file);
        });
        
        // Add folders
        Object.entries(filesByFolder).forEach(([folder, files]) => {
            html += `
                <div class="folder-item">
                    <div class="folder-header">
                        <i class="fas fa-folder"></i>
                        <span class="folder-name">${folder}</span>
                        <span class="file-count">${files.length} files</span>
                    </div>
                    <div class="folder-contents">
                        ${files.map(file => createFileItemHTML(file)).join('')}
                    </div>
                </div>
            `;
        });
        
        zipFileList.innerHTML = html;
    }
    
    function createFileItemHTML(file) {
        const icon = getFileIcon(file.name);
        return `
            <div class="file-item" data-id="${file.id}">
                <div class="file-info">
                    <i class="fas ${icon}"></i>
                    <div class="file-details">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                    </div>
                </div>
                <button class="file-remove" onclick="removeZipFile('${file.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    function updateZipFileCount() {
        const countElement = document.getElementById('zipFileCount');
        if (countElement) countElement.textContent = zipFiles.length;
    }
    
    async function createZipArchive() {
        if (zipFiles.length === 0) return;
        
        createZipBtn.disabled = true;
        createZipBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Archive...';
        
        const JSZip = window.JSZip;
        if (!JSZip) {
            showToast('JSZip library not loaded', 'error');
            createZipBtn.disabled = false;
            createZipBtn.innerHTML = '<i class="fas fa-file-archive"></i> Create ZIP Archive';
            return;
        }
        
        try {
            const zip = new JSZip();
            const compressionLevel = parseInt(document.getElementById('compressionLevel').value);
            const keepStructure = document.getElementById('keepStructure').checked;
            const password = passwordProtect.checked ? passwordInput.value : null;
            
            // Add files to zip
            for (const file of zipFiles) {
                const path = keepStructure ? (file.webkitRelativePath || file.name) : file.name;
                zip.file(path, file);
            }
            
            // Generate zip
            const options = {
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: compressionLevel
                }
            };
            
            if (password) {
                options.encryption = 'AES-256';
                options.password = password;
            }
            
            currentZipBlob = await zip.generateAsync(options);
            
            // Update results
            updateZipResults();
            zipResults.style.display = 'block';
            downloadZipBtn.disabled = false;
            
            showToast('ZIP archive created successfully!', 'success');
        } catch (error) {
            console.error('Error creating ZIP:', error);
            showToast('Failed to create ZIP archive', 'error');
        } finally {
            createZipBtn.disabled = false;
            createZipBtn.innerHTML = '<i class="fas fa-file-archive"></i> Create ZIP Archive';
        }
    }
    
    function updateZipResults() {
        if (!currentZipBlob) return;
        
        const totalSize = zipFiles.reduce((sum, file) => sum + file.size, 0);
        const compressedSize = currentZipBlob.size;
        const reduction = Math.round((1 - compressedSize / totalSize) * 100);
        
        // Update UI elements
        document.getElementById('totalSize').textContent = `${formatFileSize(totalSize)} total`;
        document.getElementById('compressedSize').textContent = `${formatFileSize(compressedSize)} compressed`;
        document.getElementById('archiveFileCount').textContent = zipFiles.length;
        document.getElementById('originalTotalSize').textContent = formatFileSize(totalSize);
        document.getElementById('archiveCompressedSize').textContent = formatFileSize(compressedSize);
        document.getElementById('archiveReduction').textContent = `${reduction}%`;
    }
}

function removeZipFile(id) {
    zipFiles = zipFiles.filter(file => file.id !== id);
    setupFileZipper?.();
}

function downloadZipArchive() {
    if (!currentZipBlob) return;
    
    const zipName = document.getElementById('zipName').value || 'archive';
    const fileName = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;
    
    const url = URL.createObjectURL(currentZipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== Utility Functions =====
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        // Images
        jpg: 'fa-file-image',
        jpeg: 'fa-file-image',
        png: 'fa-file-image',
        gif: 'fa-file-image',
        webp: 'fa-file-image',
        bmp: 'fa-file-image',
        svg: 'fa-file-image',
        
        // Documents
        pdf: 'fa-file-pdf',
        doc: 'fa-file-word',
        docx: 'fa-file-word',
        txt: 'fa-file-alt',
        rtf: 'fa-file-alt',
        
        // Spreadsheets
        xls: 'fa-file-excel',
        xlsx: 'fa-file-excel',
        csv: 'fa-file-csv',
        
        // Archives
        zip: 'fa-file-archive',
        rar: 'fa-file-archive',
        '7z': 'fa-file-archive',
        tar: 'fa-file-archive',
        gz: 'fa-file-archive',
        
        // Code
        js: 'fa-file-code',
        html: 'fa-file-code',
        css: 'fa-file-code',
        json: 'fa-file-code',
        xml: 'fa-file-code',
        
        // Default
        default: 'fa-file'
    };
    
    return icons[ext] || icons.default;
}

function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Initialize Everything =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initializeTheme();
    
    // Add event listeners
    themeToggle?.addEventListener('click', toggleTheme);
    mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenuBtn && navLinks && 
            !navLinks.contains(e.target) && 
            !mobileMenuBtn.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Initialize statistics animation
    animateStatistics();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                closeMobileMenu();
            }
        });
    });
    
    // Update active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink?.classList.add('active');
            } else {
                navLink?.classList.remove('active');
            }
        });
    });
});

// ===== Global Functions for HTML onclick =====
window.openTool = openTool;
window.closeTool = closeTool;
window.removeImageFile = removeImageFile;
window.removeZipFile = removeZipFile;
window.downloadCompressedFile = downloadCompressedFile;