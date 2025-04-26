const builder = require('electron-builder');
const path = require('path');

// Yapılandırma
builder.build({
    config: {
        appId: 'com.phosimurg.gitprofilemanager',
        productName: 'Git Profile Manager',
        directories: {
            output: path.resolve(__dirname, '../dist'),
            app: path.resolve(__dirname, '..'),
        },
        files: [
            'build/**/*',
            'electron/**/*',
            'node_modules/**/*',
            'package.json'
        ],
        mac: {
            category: 'public.app-category.developer-tools',
            target: ['dmg'],
            icon: 'assets/icon.icns',
            hardenedRuntime: false,
        },
        extraMetadata: {
            main: 'electron/main.js',
        },
        // Ek seçenekler
        asar: true,
        asarUnpack: ['**/*.node'],
        extends: null,
    },
}).catch((error) => {
    console.error('Error during build:', error);
    process.exit(1);
});
