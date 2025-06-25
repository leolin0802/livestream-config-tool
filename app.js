let templates = {
    horizontal: [
        { width: 970, height: 250, liveStreamBox: { left: 301, top: 6, width: 368, height: 240 } },
        { width: 300, height: 250, liveStreamBox: { left: 10, top: 34, width: 280, height: 182 } },
        { width: 336, height: 280, liveStreamBox: { left: 8, top: 36, width: 320, height: 208 } },
        { width: 320, height: 480, liveStreamBox: { left: 20, top: 155, width: 280, height: 184 } },
        { width: 300, height: 600, liveStreamBox: { left: 10, top: 209, width: 280, height: 184 } }
    ],
    vertical: [
        { width: 970, height: 250, liveStreamBox: { left: 415, top: 0, width: 140, height: 250 } },
        { width: 300, height: 250, liveStreamBox: { left: 0, top: 0, width: 142, height: 250 } },
        { width: 336, height: 280, liveStreamBox: { left: 0, top: 0, width: 159, height: 280 } },
        { width: 320, height: 480, liveStreamBox: { left: 0, top: 0, width: 270, height: 480 } },
        { width: 300, height: 600, liveStreamBox: { left: 0, top: 0, width: 300, height: 534 } }
    ]
};

let currentImages = [];
let isMonitoring = false;
let originalFetch = null;
let activeStatusTemplates = [];
let isStatusEditMode = false;

function saveTemplatesToStorage() {
    localStorage.setItem('liveStreamTemplates', JSON.stringify(templates));
    localStorage.setItem('activeStatusTemplates', JSON.stringify(activeStatusTemplates));
}

function loadTemplatesFromStorage() {
    const savedTemplates = localStorage.getItem('liveStreamTemplates');
    const savedActiveStatus = localStorage.getItem('activeStatusTemplates');
    
    if (savedTemplates) {
        templates = JSON.parse(savedTemplates);
    }
    
    if (savedActiveStatus) {
        activeStatusTemplates = JSON.parse(savedActiveStatus);
    } else {
        activeStatusTemplates = [...getUniqueTemplates()];
    }
}

function getUniqueTemplates() {
    const allDimensions = [...templates.horizontal, ...templates.vertical];
    return allDimensions.filter((item, index, self) => 
        index === self.findIndex(t => t.width === item.width && t.height === item.height)
    );
}

function detectTypeFromFilenames(images) {
    let verticalCount = 0;
    let horizontalCount = 0;
    let unclearCount = 0;
    let verticalFiles = [];
    let horizontalFiles = [];
    
    images.forEach(img => {
        if (img.filename && img.filename.includes('直式')) {
            verticalCount++;
            verticalFiles.push(img.filename);
        } else if (img.filename && img.filename.includes('橫式')) {
            horizontalCount++;
            horizontalFiles.push(img.filename);
        } else {
            unclearCount++;
        }
    });
    
    const type = verticalCount > 0 && horizontalCount > 0 ? 'mixed' :
                 verticalCount > horizontalCount ? 'vertical' :
                 horizontalCount > verticalCount ? 'horizontal' : null;
    
    return {
        type: type,
        verticalFiles: verticalFiles,
        horizontalFiles: horizontalFiles,
        verticalCount: verticalCount,
        horizontalCount: horizontalCount,
        unclearCount: unclearCount
    };
}

function detectTypeFromName(name) {
    if (name.includes('直式')) return 'vertical';
    if (name.includes('橫式')) return 'horizontal';
    return null;
}

document.addEventListener('DOMContentLoaded', function() {
    loadTemplatesFromStorage();
    updateTemplatesDisplay();
    loadExampleData();
    updateStatus();
});

function loadExampleData() {
    document.getElementById('advertiserId').value = '205';
    document.getElementById('destinationUrl').value = 'https://www.facebook.com/Wstyle2016/videos/1037160801080675';
    document.getElementById('facebookVideoUrl').value = 'https://www.facebook.com/Wstyle2016/videos/1078151107551607';
}

function updateTemplatesDisplay() {
    const container = document.getElementById('templatesDisplay');
    container.innerHTML = '';
    
    ['horizontal', 'vertical'].forEach(type => {
        const typeDiv = document.createElement('div');
        typeDiv.className = 'template-type';
        typeDiv.innerHTML = `
            <div class="template-type-title">${type === 'horizontal' ? '橫式版型' : '直式版型'}</div>
            ${templates[type].map(t => `
                <div class="template-item">
                    <div class="template-name">${t.width}×${t.height}</div>
                    <div class="dimensions">StreamBox: ${t.liveStreamBox.left},${t.liveStreamBox.top},${t.liveStreamBox.width},${t.liveStreamBox.height}</div>
                </div>
            `).join('')}
        `;
        container.appendChild(typeDiv);
    });
}

function updateStatus() {
    const container = document.getElementById('statusGrid');
    
    container.innerHTML = activeStatusTemplates.map(dim => {
        const hasImage = currentImages.some(img => img.width === dim.width && img.height === dim.height);
        return `
            <div class="status-item ${hasImage ? 'status-filled' : 'status-missing'}">
                ${dim.width}×${dim.height}<br>
                ${hasImage ? '已匹配' : '未匹配'}
            </div>
        `;
    }).join('');
}

function addNewTemplate() {
    document.getElementById('addTemplateModal').style.display = 'block';
    document.getElementById('newTemplateWidth').value = '';
    document.getElementById('newTemplateHeight').value = '';
    document.getElementById('newTemplateLeft').value = '0';
    document.getElementById('newTemplateTop').value = '0';
    document.getElementById('newTemplateStreamWidth').value = '';
    document.getElementById('newTemplateStreamHeight').value = '';
}

function closeAddTemplateModal() {
    document.getElementById('addTemplateModal').style.display = 'none';
}

function saveNewTemplate() {
    const type = document.getElementById('newTemplateType').value;
    const width = parseInt(document.getElementById('newTemplateWidth').value);
    const height = parseInt(document.getElementById('newTemplateHeight').value);
    const left = parseInt(document.getElementById('newTemplateLeft').value) || 0;
    const top = parseInt(document.getElementById('newTemplateTop').value) || 0;
    const streamWidth = parseInt(document.getElementById('newTemplateStreamWidth').value);
    const streamHeight = parseInt(document.getElementById('newTemplateStreamHeight').value);
    
    if (!width || !height || !streamWidth || !streamHeight) {
        alert('請填寫所有必填欄位！');
        return;
    }
    
    const exists = templates[type].some(t => t.width === width && t.height === height);
    if (exists) {
        alert('該尺寸已存在於此版型中！');
        return;
    }
    
    const newTemplate = {
        width: width,
        height: height,
        liveStreamBox: {
            left: left,
            top: top,
            width: streamWidth,
            height: streamHeight
        }
    };
    
    templates[type].push(newTemplate);
    activeStatusTemplates = [...getUniqueTemplates()];
    
    saveTemplatesToStorage();
    updateTemplatesDisplay();
    updateStatus();
    closeAddTemplateModal();
    alert('新版型已新增！');
}

function toggleStatusEditMode() {
    isStatusEditMode = !isStatusEditMode;
    const editBtn = document.getElementById('statusEditBtn');
    const editPanel = document.getElementById('statusEditPanel');
    
    if (isStatusEditMode) {
        editBtn.textContent = '取消編輯';
        editBtn.className = 'btn btn-danger';
        editPanel.style.display = 'block';
        document.body.classList.add('status-edit-mode');
        updateStatusCheckboxes();
    } else {
        editBtn.textContent = '編輯';
        editBtn.className = 'btn btn-secondary';
        editPanel.style.display = 'none';
        document.body.classList.remove('status-edit-mode');
    }
}

function updateStatusCheckboxes() {
    const container = document.getElementById('statusCheckboxes');
    const allTemplates = getUniqueTemplates();
    
    container.innerHTML = allTemplates.map(template => {
        const isActive = activeStatusTemplates.some(t => t.width === template.width && t.height === template.height);
        return `
            <div class="checkbox-item">
                <input type="checkbox" id="template_${template.width}_${template.height}" 
                       ${isActive ? 'checked' : ''}>
                <label for="template_${template.width}_${template.height}">${template.width}×${template.height}</label>
            </div>
        `;
    }).join('');
}

function applyStatusSelection() {
    const allTemplates = getUniqueTemplates();
    activeStatusTemplates = allTemplates.filter(template => {
        const checkbox = document.getElementById(`template_${template.width}_${template.height}`);
        return checkbox && checkbox.checked;
    });
    
    saveTemplatesToStorage();
    updateStatus();
    toggleStatusEditMode();
    alert('狀態檢查設定已更新！');
}

function cancelStatusEdit() {
    toggleStatusEditMode();
}

function resetToDefaultTemplates() {
    if (confirm('確定要重置匹配狀態為預設的5種版型檢查嗎？（不會刪除您新增的版型）')) {
        const defaultTemplates = [
            { width: 970, height: 250 },
            { width: 300, height: 250 },
            { width: 336, height: 280 },
            { width: 320, height: 480 },
            { width: 300, height: 600 }
        ];
        
        activeStatusTemplates = defaultTemplates;
        saveTemplatesToStorage();
        updateStatus();
        alert('已重置狀態檢查為預設5種版型！');
    }
}

function resetAllTemplates() {
    if (confirm('⚠️ 警告：這將刪除所有自訂版型，重置為原始狀態！\n確定要繼續嗎？')) {
        templates = {
            horizontal: [
                { width: 970, height: 250, liveStreamBox: { left: 301, top: 6, width: 368, height: 240 } },
                { width: 300, height: 250, liveStreamBox: { left: 10, top: 34, width: 280, height: 182 } },
                { width: 336, height: 280, liveStreamBox: { left: 8, top: 36, width: 320, height: 208 } },
                { width: 320, height: 480, liveStreamBox: { left: 20, top: 155, width: 280, height: 184 } },
                { width: 300, height: 600, liveStreamBox: { left: 10, top: 209, width: 280, height: 184 } }
            ],
            vertical: [
                { width: 970, height: 250, liveStreamBox: { left: 415, top: 0, width: 140, height: 250 } },
                { width: 300, height: 250, liveStreamBox: { left: 0, top: 0, width: 142, height: 250 } },
                { width: 336, height: 280, liveStreamBox: { left: 0, top: 0, width: 159, height: 280 } },
                { width: 320, height: 480, liveStreamBox: { left: 0, top: 0, width: 270, height: 480 } },
                { width: 300, height: 600, liveStreamBox: { left: 0, top: 0, width: 300, height: 534 } }
            ]
        };
        
        activeStatusTemplates = [...getUniqueTemplates()];
        saveTemplatesToStorage();
        updateTemplatesDisplay();
        updateStatus();
        alert('已完全重置為預設版型！');
    }
}

function validateAndGenerate() {
    const apiResponseText = document.getElementById('apiResponse').value.trim();
    const campaignName = document.getElementById('campaignName').value.trim();
    const advertiserId = document.getElementById('advertiserId').value.trim();
    const destinationUrl = document.getElementById('destinationUrl').value.trim();
    const facebookVideoUrl = document.getElementById('facebookVideoUrl').value.trim();
    
    if (!apiResponseText || !campaignName || !advertiserId || !destinationUrl || !facebookVideoUrl) {
        alert('請填寫所有必填欄位！');
        return;
    }
    
    try {
        const apiResponse = JSON.parse(apiResponseText);
        currentImages = apiResponse.data || [];
        
        if (!currentImages.length) {
            alert('API Response 中沒有找到圖片資料！');
            return;
        }
        
        const unknownSizes = checkForUnknownSizes(currentImages);
        if (unknownSizes.length > 0) {
            alert(`發現未知尺寸: ${unknownSizes.map(s => `${s.width}×${s.height}`).join(', ')}\n請先編輯版型加入這些尺寸！`);
            openTemplateEditor();
            return;
        }
        
        const imageTypeResult = detectTypeFromFilenames(currentImages);
        const nameType = detectTypeFromName(campaignName);
        
        if (imageTypeResult.type === 'mixed') {
            let mixedMessage = `⚠️ 檢測到圖片中同時包含直式和橫式檔名！\n\n`;
            mixedMessage += `直式檔案 (${imageTypeResult.verticalCount}個):\n`;
            mixedMessage += imageTypeResult.verticalFiles.map(f => `• ${f}`).join('\n') + '\n\n';
            mixedMessage += `橫式檔案 (${imageTypeResult.horizontalCount}個):\n`;
            mixedMessage += imageTypeResult.horizontalFiles.map(f => `• ${f}`).join('\n') + '\n\n';
            mixedMessage += `請檢查檔案命名是否正確，確保所有檔案使用相同的類型標示。`;
            
            alert(mixedMessage);
            return;
        }
        
        const imageType = imageTypeResult.type;
        
        if (imageType && nameType && imageType !== nameType) {
            const imageTypeName = imageType === 'vertical' ? '直式' : '橫式';
            const nameTypeName = nameType === 'vertical' ? '直式' : '橫式';
            
            const totalFiles = imageTypeResult.verticalCount + imageTypeResult.horizontalCount;
            if (!confirm(`檢測到類型不一致:\n圖片檔名顯示: ${imageTypeName} (${totalFiles}個檔案)\nCampaign Name 顯示: ${nameTypeName}\n\n點擊確定使用圖片檔名的類型 (${imageTypeName})，點擊取消重新檢查。`)) {
                return;
            }
        }
        
        const missingImages = checkMissingImages(currentImages);
        if (missingImages.length > 0) {
            if (!confirm(`缺少以下尺寸的圖片:\n${missingImages.map(s => `${s.width}×${s.height}`).join('\n')}\n\n請確認是否要繼續生成（缺少的尺寸將被跳過）？`)) {
                return;
            }
        }
        
        showFinalConfirmation();
        
    } catch (error) {
        console.error('JSON 解析錯誤:', error);
        alert('API Response JSON 格式錯誤！請檢查 JSON 格式是否正確。');
    }
}

function checkForUnknownSizes(images) {
    const knownSizes = [...templates.horizontal, ...templates.vertical];
    return images.filter(img => 
        !knownSizes.some(t => t.width === img.width && t.height === img.height)
    );
}

function checkMissingImages(images) {
    const campaignName = document.getElementById('campaignName').value;
    const imageTypeResult = detectTypeFromFilenames(images);
    const imageType = imageTypeResult.type || detectTypeFromName(campaignName) || 'vertical';
    const requiredSizes = templates[imageType];
    
    return requiredSizes.filter(size => 
        !images.some(img => img.width === size.width && img.height === size.height)
    );
}

function showFinalConfirmation() {
    const campaignName = document.getElementById('campaignName').value;
    const imageTypeResult = detectTypeFromFilenames(currentImages);
    const imageType = imageTypeResult.type || detectTypeFromName(campaignName) || 'vertical';
    const typeName = imageType === 'vertical' ? '直式' : '橫式';
    
    const templateData = templates[imageType];
    const actualMatches = templateData.filter(template => 
        currentImages.some(img => img.width === template.width && img.height === template.height)
    );
    
    const matchedCount = actualMatches.length;
    const totalCount = templateData.length;
    
    const matchedList = actualMatches.map(t => `${t.width}×${t.height}`).join(', ');
    
    let fileAnalysis = '';
    if (imageTypeResult.type) {
        const totalFiles = imageTypeResult.verticalCount + imageTypeResult.horizontalCount;
        fileAnalysis = `<br>檔案分析: ${totalFiles}個${typeName}檔案`;
        if (imageTypeResult.unclearCount > 0) {
            fileAnalysis += `，${imageTypeResult.unclearCount}個未標示類型`;
        }
    }
    
    document.getElementById('confirmContent').innerHTML = `
        <div class="success">
            <strong>配置摘要：</strong><br>
            Campaign: ${campaignName}<br>
            類型: ${typeName}${fileAnalysis}<br>
            匹配狀態: ${matchedCount}/${totalCount}<br>
            VideoOrientation: ${imageType === 'vertical' ? 'PORTRAIT' : 'LANDSCAPE'}<br><br>
            <strong>實際會生成的版型：</strong><br>
            ${matchedList || '無'}
        </div>
        <p>⚠️ 注意：只會生成有匹配圖片的版型，未匹配的版型將被跳過。</p>
        <p>確認以上資料無誤後，點擊確認生成最終配置檔案。</p>
    `;
    
    document.getElementById('confirmModal').style.display = 'block';
}

function countMatchedImages() {
    const campaignName = document.getElementById('campaignName').value;
    const imageTypeResult = detectTypeFromFilenames(currentImages);
    const imageType = imageTypeResult.type || detectTypeFromName(campaignName) || 'vertical';
    const requiredSizes = templates[imageType];
    
    return requiredSizes.filter(size => 
        currentImages.some(img => img.width === size.width && img.height === size.height)
    ).length;
}

function finalGenerate() {
    const campaignName = document.getElementById('campaignName').value;
    const advertiserId = parseInt(document.getElementById('advertiserId').value);
    const destinationUrl = document.getElementById('destinationUrl').value;
    const facebookVideoUrl = document.getElementById('facebookVideoUrl').value;
    
    const imageTypeResult = detectTypeFromFilenames(currentImages);
    const imageType = imageTypeResult.type || detectTypeFromName(campaignName) || 'vertical';
    const templateData = templates[imageType];
    
    const backgroundImages = templateData
        .map(template => {
            const matchingImage = currentImages.find(img => 
                img.width === template.width && img.height === template.height
            );
            
            if (matchingImage) {
                return {
                    imageId: matchingImage.id,
                    destinationUrl: destinationUrl,
                    displayedDimensions: { width: template.width, height: template.height },
                    liveStreamBox: template.liveStreamBox,
                    impressionTrackingTags: []
                };
            }
            return null;
        })
        .filter(item => item !== null);
    
    if (backgroundImages.length === 0) {
        alert('沒有任何版型匹配到圖片！請檢查圖片尺寸或版型設定。');
        closeConfirmModal();
        return;
    }
    
    const result = {
        input: {
            advertiserId: advertiserId,
            name: campaignName,
            backgroundImages: backgroundImages,
            facebookVideoUrl: facebookVideoUrl,
            clickThroughUrls: [destinationUrl],
            renderType: "SDK",
            autoplay: true,
            showText: false,
            allowFullScreen: true,
            clickBehavior: "REDIRECT_TO_PAGE",
            videoOrientation: imageType === 'vertical' ? 'PORTRAIT' : 'LANDSCAPE'
        }
    };
    
    showOutput(result);
    closeConfirmModal();
}

function showOutput(result) {
    document.getElementById('outputSection').innerHTML = `
        <div class="output-section">
            <div class="output-header">
                <span>✅ 生成完成</span>
                <button class="btn" onclick="copyOutput()">📋 複製</button>
            </div>
            <div class="output-content" id="outputContent">${JSON.stringify(result, null, 2)}</div>
        </div>
    `;
}

function copyOutput() {
    const content = document.getElementById('outputContent').textContent;
    navigator.clipboard.writeText(content).then(() => {
        alert('配置已複製到剪貼簿！');
    });
}

function openTemplateEditor() {
    const content = document.getElementById('templateEditorContent');
    content.innerHTML = '';
    
    ['horizontal', 'vertical'].forEach(type => {
        const typeDiv = document.createElement('div');
        typeDiv.innerHTML = `
            <h4 style="margin: 16px 0 12px 0; color: #374151;">${type === 'horizontal' ? '橫式版型' : '直式版型'}</h4>
            ${templates[type].map((template, index) => `
                <div class="template-editor">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div class="template-editor-title">${template.width}×${template.height}</div>
                        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" 
                                onclick="deleteTemplate('${type}', ${index})">🗑️ 刪除</button>
                    </div>
                    <div class="editor-row">
                        <input class="editor-input" placeholder="Width" value="${template.width}" 
                               onchange="updateTemplate('${type}', ${index}, 'width', this.value)">
                        <input class="editor-input" placeholder="Height" value="${template.height}"
                               onchange="updateTemplate('${type}', ${index}, 'height', this.value)">
                    </div>
                    <div class="editor-row">
                        <input class="editor-input" placeholder="Left" value="${template.liveStreamBox.left}"
                               onchange="updateTemplate('${type}', ${index}, 'left', this.value)">
                        <input class="editor-input" placeholder="Top" value="${template.liveStreamBox.top}"
                               onchange="updateTemplate('${type}', ${index}, 'top', this.value)">
                    </div>
                    <div class="editor-row">
                        <input class="editor-input" placeholder="StreamWidth" value="${template.liveStreamBox.width}"
                               onchange="updateTemplate('${type}', ${index}, 'streamWidth', this.value)">
                        <input class="editor-input" placeholder="StreamHeight" value="${template.liveStreamBox.height}"
                               onchange="updateTemplate('${type}', ${index}, 'streamHeight', this.value)">
                    </div>
                </div>
            `).join('')}
        `;
        content.appendChild(typeDiv);
    });
    
    document.getElementById('templateModal').style.display = 'block';
}

function updateTemplate(type, index, field, value) {
    if (field === 'width' || field === 'height') {
        templates[type][index][field] = parseInt(value) || 0;
    } else if (field === 'left' || field === 'top') {
        templates[type][index].liveStreamBox[field] = parseInt(value) || 0;
    } else if (field === 'streamWidth') {
        templates[type][index].liveStreamBox.width = parseInt(value) || 0;
    } else if (field === 'streamHeight') {
        templates[type][index].liveStreamBox.height = parseInt(value) || 0;
    }
}

function deleteTemplate(type, index) {
    if (confirm('確定要刪除這個版型嗎？')) {
        templates[type].splice(index, 1);
        activeStatusTemplates = [...getUniqueTemplates()];
        saveTemplatesToStorage();
        openTemplateEditor();
        updateTemplatesDisplay();
        updateStatus();
    }
}

function saveTemplates() {
    updateTemplatesDisplay();
    updateStatus();
    saveTemplatesToStorage();
    closeTemplateEditor();
    alert('版型已儲存！');
}

function closeTemplateEditor() {
    document.getElementById('templateModal').style.display = 'none';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

function startAutoCapture() {
    if (isMonitoring) return;
    
    isMonitoring = true;
    document.getElementById('captureStatus').textContent = '🔄 監聽中...';
    document.getElementById('captureStatus').style.color = '#3b82f6';
    
    if (!originalFetch) {
        originalFetch = window.fetch;
    }
    
    window.fetch = function(...args) {
        const result = originalFetch.apply(this, args);
        
        result.then(response => {
            const url = args[0];
            if (typeof url === 'string' && (
                url.includes('/upload') || 
                url.includes('/image') || 
                url.includes('scupio.com')
            )) {
                const clonedResponse = response.clone();
                clonedResponse.json().then(data => {
                    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
                        const hasImageData = data.data.some(item => 
                            item.id && item.width && item.height && item.filename
                        );
                        
                        if (hasImageData) {
                            document.getElementById('apiResponse').value = JSON.stringify(data, null, 2);
                            document.getElementById('captureStatus').textContent = '✅ 已自動抓取';
                            document.getElementById('captureStatus').style.color = '#059669';
                            
                            currentImages = data.data;
                            updateStatus();
                            
                            setTimeout(() => {
                                if (document.getElementById('captureStatus')) {
                                    document.getElementById('captureStatus').style.color = '#6b7280';
                                }
                            }, 3000);
                        }
                    }
                }).catch(() => {});
            }
        }).catch(() => {});
        
        return result;
    };
}

function stopAutoCapture() {
    if (!isMonitoring) return;
    
    isMonitoring = false;
    document.getElementById('captureStatus').textContent = '';
    
    if (originalFetch) {
        window.fetch = originalFetch;
    }
}

document.getElementById('apiResponse').addEventListener('input', function() {
    try {
        const data = JSON.parse(this.value);
        if (data && data.data && Array.isArray(data.data)) {
            currentImages = data.data;
            updateStatus();
        }
    } catch (error) {
        // 忽略 JSON 解析錯誤
    }
});

document.getElementById('campaignName').addEventListener('input', function() {
    updateStatus();
});

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});