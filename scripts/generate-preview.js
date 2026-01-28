const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../icons');
const outputFile = path.join(__dirname, '../preview.html');

try {
    const files = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg'));
    files.sort();

    const icons = [];
    const allCategories = new Set();

    files.forEach(file => {
        const name = path.basename(file, '.svg');
        let content = fs.readFileSync(path.join(iconsDir, file), 'utf-8');
        
        // Process content: replace hardcoded colors with currentColor
        // This regex replaces hex codes like #123456 or #123 with currentColor
        // Also removes width/height to let CSS control it
        content = content.replace(/fill="#[a-fA-F0-9]{6}"/g, 'fill="currentColor"')
                         .replace(/stroke="#[a-fA-F0-9]{6}"/g, 'stroke="currentColor"')
                         .replace(/fill="#[a-fA-F0-9]{3}"/g, 'fill="currentColor"')
                         .replace(/stroke="#[a-fA-F0-9]{3}"/g, 'stroke="currentColor"');

        let categories = [];
        let tags = [];
        const jsonPath = path.join(iconsDir, `${name}.json`);
        if (fs.existsSync(jsonPath)) {
            try {
                const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                if (json.categories) {
                    categories = json.categories;
                    categories.forEach(c => allCategories.add(c));
                }
                if (json.tags) {
                    tags = json.tags;
                }
            } catch (e) {
                console.warn(`Failed to parse JSON for ${name}`);
            }
        }
        
        icons.push({ name, content, categories, tags });
    });

    const sortedCategories = Array.from(allCategories).sort();

    // Generate HTML parts
    const categoriesHtml = sortedCategories.map(cat => 
        `<li class="category-item" data-category="${cat}">
            <span>${cat}</span>
            <span class="count">${icons.filter(i => i.categories.includes(cat)).length}</span>
         </li>`
    ).join('');

    const iconsHtml = icons.map(icon => `
        <div class="icon-card" data-name="${icon.name}" data-categories="${icon.categories.join(' ')}">
            <div class="icon-wrapper">
                ${icon.content}
            </div>
            <span class="icon-name">${icon.name}</span>
            <div class="icon-desc">
                ${icon.categories.length > 0 ? `<div class="desc-item"><strong>Category:</strong> ${icon.categories.join(', ')}</div>` : ''}
                ${icon.tags.length > 0 ? `<div class="desc-item"><strong>Tags:</strong> ${icon.tags.join(', ')}</div>` : ''}
            </div>
        </div>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tubiao Icons</title>
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #0f172a;
            --border-color: #e2e8f0;
            --hover-bg: #f8fafc;
            --primary-color: #f56565;
            --sidebar-width: 300px;
            --icon-default-color: #666666;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            display: flex;
            min-height: 100vh;
        }

        /* Sidebar */
        .sidebar {
            width: var(--sidebar-width);
            border-right: 1px solid var(--border-color);
            padding: 24px;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
            background: #fff;
            z-index: 10;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .logo {
            font-size: 24px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo svg { color: var(--primary-color); }

        /* Customizer */
        .customizer {
            background: #f8fafc;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
        }
        .customizer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .customizer-title { font-weight: 600; font-size: 14px; }
        .reset-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: #64748b;
            padding: 4px;
            border-radius: 4px;
        }
        .reset-btn:hover { background: #e2e8f0; color: var(--text-color); }

        .control-group { margin-bottom: 16px; }
        .control-group:last-child { margin-bottom: 0; }
        .control-label {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 8px;
        }
        .control-value { font-family: monospace; }
        
        input[type="range"] {
            width: 100%;
            accent-color: var(--primary-color);
        }
        input[type="color"] {
            width: 100%;
            height: 36px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 2px;
            cursor: pointer;
        }

        .toggle-group {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 16px;
        }
        .toggle-label {
            font-size: 12px;
            color: #64748b;
        }
        .switch {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 20px;
        }
        .switch input { 
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 20px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .slider {
            background-color: var(--primary-color);
        }
        input:checked + .slider:before {
            transform: translateX(16px);
        }

        /* Categories */
        .categories-section {
            flex: 1;
            overflow-y: auto;
        }
        .categories-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 12px;
        }
        .category-list { list-style: none; }
        .category-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            color: #64748b;
            transition: all 0.2s;
        }
        .category-item:hover { background: var(--hover-bg); color: var(--text-color); }
        .category-item.active { background: #fee2e2; color: var(--primary-color); }
        .category-item .count { font-size: 12px; opacity: 0.7; }

        /* Main Content */
        .main-content {
            flex: 1;
            margin-left: var(--sidebar-width);
            padding: 40px;
        }
        .search-wrapper { margin-bottom: 32px; position: relative; }
        .search-input {
            width: 100%;
            padding: 16px 20px 16px 48px;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            font-size: 16px;
            outline: none;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .search-input:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 4px rgba(245, 101, 101, 0.1);
        }
        .search-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
        }

        /* Grid */
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 16px;
        }
        .icon-card {
            background: white;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .icon-card:hover {
            border-color: var(--primary-color);
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }
        .icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px; 
            height: 48px;
            color: var(--icon-default-color);
        }
        .icon-wrapper svg {
            transition: all 0.2s;
        }
        .icon-name {
            font-size: 12px;
            color: #64748b;
            text-align: center;
            word-break: break-all;
        }
        
        .icon-desc {
            display: none;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
            width: 100%;
            border-top: 1px solid var(--border-color);
            padding-top: 8px;
        }
        .desc-item {
            margin-bottom: 4px;
        }
        .desc-item:last-child {
            margin-bottom: 0;
        }
        
        /* Show Description State */
        body.show-description .icon-desc {
            display: block;
        }
        body.show-description .icon-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        }

        .toast {
            position: fixed;
            bottom: 32px;
            right: 32px;
            background: #0f172a;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s;
            z-index: 100;
        }
        .toast.show { opacity: 1; transform: translateY(0); }
        .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 64px;
            color: #64748b;
            display: none;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            Tubiao
        </div>
        
        <div class="customizer">
            <div class="customizer-header">
                <span class="customizer-title">自定义</span>
                <button class="reset-btn" id="reset-btn" title="恢复默认">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/><path d="M3 3v9h9"/></svg>
                </button>
            </div>
            
            <div class="control-group">
                <div class="control-label">
                    <span>颜色</span>
                    <span id="color-value" class="control-value">#666666</span>
                </div>
                <input type="color" id="color-input" value="#666666">
            </div>

            <div class="control-group">
                <div class="control-label">
                    <span>描边粗细</span>
                    <span id="stroke-value" class="control-value">2px</span>
                </div>
                <input type="range" id="stroke-input" min="0.5" max="3" step="0.25" value="2">
            </div>

            <div class="control-group">
                <div class="control-label">
                    <span>大小</span>
                    <span id="size-value" class="control-value">24px</span>
                </div>
                <input type="range" id="size-input" min="16" max="48" step="4" value="24">
            </div>
            
            <div class="toggle-group">
                <span class="toggle-label">显示描述</span>
                <label class="switch">
                    <input type="checkbox" id="desc-toggle">
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <div class="categories-section">
            <div class="categories-title">分类</div>
            <ul class="category-list" id="category-list">
                <li class="category-item active" data-category="all">
                    <span>所有图标</span>
                    <span class="count">${icons.length}</span>
                </li>
                ${categoriesHtml}
            </ul>
        </div>
        
        <div style="margin-top: auto; font-size: 12px; color: #94a3b8;">
            <p>v0.0.1 • ${icons.length} 个图标</p>
        </div>
    </div>

    <div class="main-content">
        <div class="search-wrapper">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" class="search-input" id="search-input" placeholder="搜索 ${icons.length} 个图标...">
        </div>

        <div class="icon-grid" id="icon-grid">
            ${iconsHtml}
        </div>
        
        <div class="empty-state" id="empty-state">
            <p>未找到图标。</p>
        </div>
    </div>

    <div class="toast" id="toast">已复制到剪贴板！</div>

    <script>
        const state = {
            search: '',
            category: 'all',
            color: '#666666',
            strokeWidth: 2,
            size: 24,
            showDesc: false
        };

        const elements = {
            searchInput: document.getElementById('search-input'),
            iconGrid: document.getElementById('icon-grid'),
            cards: document.querySelectorAll('.icon-card'),
            emptyState: document.getElementById('empty-state'),
            toast: document.getElementById('toast'),
            
            // Controls
            colorInput: document.getElementById('color-input'),
            strokeInput: document.getElementById('stroke-input'),
            sizeInput: document.getElementById('size-input'),
            resetBtn: document.getElementById('reset-btn'),
            descToggle: document.getElementById('desc-toggle'),
            
            // Value displays
            colorValue: document.getElementById('color-value'),
            strokeValue: document.getElementById('stroke-value'),
            sizeValue: document.getElementById('size-value'),
            
            // Categories
            categoryItems: document.querySelectorAll('.category-item')
        };

        // Filter Logic
        function filterIcons() {
            let visibleCount = 0;
            const searchTerm = state.search.toLowerCase();
            
            elements.cards.forEach(card => {
                const name = card.dataset.name;
                const categories = card.dataset.categories.split(' ');
                
                const matchesSearch = name.includes(searchTerm);
                const matchesCategory = state.category === 'all' || categories.includes(state.category);
                
                if (matchesSearch && matchesCategory) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            elements.emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        // Appearance Logic
        function updateAppearance() {
            document.documentElement.style.setProperty('--icon-default-color', state.color);
            
            elements.cards.forEach(card => {
                const svg = card.querySelector('svg');
                if (svg) {
                    // Update stroke width
                    svg.setAttribute('stroke-width', state.strokeWidth);
                    
                    // Update size
                    svg.setAttribute('width', state.size);
                    svg.setAttribute('height', state.size);
                    
                    // Update color
                    svg.style.color = state.color;
                }
            });

            // Update displays
            elements.strokeValue.textContent = state.strokeWidth + 'px';
            elements.sizeValue.textContent = state.size + 'px';
            elements.colorValue.textContent = state.color;
        }

        // Event Listeners
        elements.searchInput.addEventListener('input', (e) => {
            state.search = e.target.value;
            filterIcons();
        });

        elements.categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                elements.categoryItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                state.category = item.dataset.category;
                filterIcons();
            });
        });

        elements.colorInput.addEventListener('input', (e) => {
            state.color = e.target.value;
            updateAppearance();
        });

        elements.strokeInput.addEventListener('input', (e) => {
            state.strokeWidth = e.target.value;
            updateAppearance();
        });

        elements.sizeInput.addEventListener('input', (e) => {
            state.size = e.target.value;
            updateAppearance();
        });
        
        elements.descToggle.addEventListener('change', (e) => {
            state.showDesc = e.target.checked;
            if (state.showDesc) {
                document.body.classList.add('show-description');
            } else {
                document.body.classList.remove('show-description');
            }
        });

        elements.resetBtn.addEventListener('click', () => {
            state.color = '#666666';
            state.strokeWidth = 2;
            state.size = 24;
            state.showDesc = false;
            
            elements.colorInput.value = '#666666';
            elements.strokeInput.value = 2;
            elements.sizeInput.value = 24;
            elements.descToggle.checked = false;
            
            document.body.classList.remove('show-description');
            updateAppearance();
        });

        // Copy to clipboard
        elements.cards.forEach(card => {
            card.addEventListener('click', () => {
                const name = card.dataset.name;
                navigator.clipboard.writeText(name).then(() => {
                    elements.toast.textContent = \`已复制 "\${name}"\`;
                    elements.toast.classList.add('show');
                    setTimeout(() => elements.toast.classList.remove('show'), 2000);
                });
            });
        });

        // Init
        updateAppearance();
    </script>
</body>
</html>`;

    fs.writeFileSync(outputFile, htmlContent);
    console.log(`Successfully generated preview.html with ${files.length} icons.`);

} catch (error) {
    console.error('Error generating preview:', error);
    process.exit(1);
}
