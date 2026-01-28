const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../icons');
const iconJsonTemplate = {
  "$schema": "../icon.schema.json",
  "contributors": ["Tubiao Bot"],
  "tags": ["tubiao-custom"],
  "categories": ["custom"]
};

try {
    const files = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg'));
    
    files.forEach(file => {
        const iconName = path.basename(file, '.svg');
        const jsonPath = path.join(iconsDir, `${iconName}.json`);
        
        if (!fs.existsSync(jsonPath)) {
            fs.writeFileSync(jsonPath, JSON.stringify(iconJsonTemplate, null, 2));
            console.log(`Generated JSON for: ${iconName}`);
        }
    });
    console.log('Icon JSON generation complete.');
} catch (error) {
    console.error('Error generating icon JSONs:', error);
}
