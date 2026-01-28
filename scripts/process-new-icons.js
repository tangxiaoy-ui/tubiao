
import fs from 'fs';
import path from 'path';

const iconsDir = path.join(process.cwd(), 'icons');
const files = fs.readdirSync(iconsDir);

// Helper to convert camelCase to kebab-case
const toKebabCase = (str) => {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};

// Common translations for tags
const tagTranslations = {
  '指示类': 'indicator',
  '井号': 'pound', '话题': 'hashtag', '整数': 'integer', '标签': 'tag',
  '信息': 'info', 'information': 'information',
  '加载': 'loading', 'spinner': 'spinner',
  '叹号': 'exclamation', '警告': 'warning', '提示': 'alert', '风险管理': 'risk',
  '失败': 'fail', '关闭': 'close', '错误': 'error',
  '成功': 'success', '勾选': 'check', '完成': 'complete',
  '批注': 'annotate', '抄送': 'cc', '签字': 'sign',
  '方向': 'direction', '右上': 'top-right', '跳转': 'jump',
  '向上': 'up', '向下': 'down', '向右': 'right', '向左': 'left',
  '无': 'none', '空': 'empty', '禁用': 'disabled', '取消': 'cancel',
  '未勾选': 'unchecked',
  '箭头上': 'arrow-up', '箭头下': 'arrow-down', '箭头右': 'arrow-right', '双箭头': 'double-arrow',
  '问号': 'question', '问题': 'help'
};

// Category mapping based on keywords
const getCategories = (tags, name) => {
  const cats = new Set();
  
  if (tags.includes('arrow') || name.includes('arrow') || tags.includes('direction')) {
    cats.add('arrows');
  }
  
  if (tags.includes('warning') || tags.includes('error') || tags.includes('success') || tags.includes('info') || tags.includes('help')) {
    cats.add('ui');
    cats.add('security'); // often used for alerts
  }
  
  if (tags.includes('loading') || tags.includes('spinner')) {
    cats.add('ui');
    cats.add('actions'); // loading is an action state
  }
  
  if (tags.includes('check') || tags.includes('close') || tags.includes('add')) {
    cats.add('ui');
    cats.add('actions');
  }

  if (cats.size === 0) cats.add('ui'); // default
  
  // Clean up
  if (cats.has('arrows') && cats.has('ui')) {
     // keep both? yes.
  }

  return Array.from(cats);
};

files.forEach(file => {
  // Pattern: [Category-Tags]iconCommon_line_12_Name.svg
  // Example: [指示类-井号&话题&整数]iconCommon_line_12_pound.svg
  const match = file.match(/^\[(.*?)\]iconCommon_line_12_(.*)\.svg$/);
  
  if (match) {
    const rawMeta = match[1]; // "指示类-井号&话题&整数"
    const rawName = match[2]; // "pound"
    
    // 1. Rename SVG
    const newName = toKebabCase(rawName);
    const newFileName = `${newName}.svg`;
    
    // Check if target file exists to avoid overwrite (or maybe we want to overwrite?)
    // For now, let's assume we overwrite or it's a new file.
    fs.renameSync(path.join(iconsDir, file), path.join(iconsDir, newFileName));
    console.log(`Renamed: ${file} -> ${newFileName}`);
    
    // 2. Generate JSON
    // Parse Chinese tags
    // "指示类-井号&话题&整数" -> split by '-' then '&'
    const parts = rawMeta.split(/[-&]/);
    const translatedTags = parts.map(p => tagTranslations[p] || p).filter(p => !['指示类', 'indicator'].includes(p)); // filter out category name from tags if generic
    
    // Add name parts to tags
    const nameTags = newName.split('-');
    
    // Merge tags
    const allTags = new Set([...nameTags, ...translatedTags]);
    // Remove empty or undefined
    allTags.delete(undefined);
    allTags.delete('');
    
    const finalTags = Array.from(allTags);
    const finalCategories = getCategories(finalTags, newName);
    
    const jsonContent = {
      "$schema": "../icon.schema.json",
      "contributors": ["Tubiao Bot"],
      "tags": finalTags,
      "categories": finalCategories
    };
    
    fs.writeFileSync(path.join(iconsDir, `${newName}.json`), JSON.stringify(jsonContent, null, 2));
    console.log(`Created JSON: ${newName}.json`);
  }
});
