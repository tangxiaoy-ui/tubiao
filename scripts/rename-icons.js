const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../icons');

try {
    const files = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg'));
    
    files.forEach(file => {
        // 1. 移除方括号及其内容 [xxx]
        let newName = file.replace(/\[.*?\]/g, '');
        
        // 2. 移除 "iconCommon_line_12_" 前缀
        newName = newName.replace('iconCommon_line_12_', '');
        
        // 3. 将驼峰命名 (camelCase) 转换为短横线命名 (kebab-case)
        newName = newName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        
        // 4. 清理可能产生的双重短横线或首尾短横线
        newName = newName.replace(/^-+|-+$/g, '').replace(/-+/g, '-');
        
        // 5. 确保仍以 .svg 结尾
        if (!newName.endsWith('.svg')) {
            newName += '.svg';
        }

        if (file !== newName) {
            const oldPath = path.join(iconsDir, file);
            const newPath = path.join(iconsDir, newName);
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed: ${file} -> ${newName}`);
        }
    });
    console.log('Icon renaming complete.');
} catch (error) {
    console.error('Error renaming icons:', error);
}
