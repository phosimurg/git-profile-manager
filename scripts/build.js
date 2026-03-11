const builder = require('electron-builder');
const path = require('path');

// Yapılandırma
builder.build({
    publish: "never",
    config: {
        appId: 'com.phosimurg.gitprofilemanager',
        productName: 'Git Profile Manager',
        directories: {
            output: path.resolve(__dirname, '../dist'),
            app: path.resolve(__dirname, '..'),
            buildResources: path.resolve(__dirname, '../build-resources'),
        },
        files: [
            'build/**/*',
            'electron/**/*',
            'node_modules/**/*',
            'package.json'
        ],
        // Notarization ayarlarını yeni notarytool ile güncelledik
        afterSign: async (context) => {
            const { electronPlatformName, appOutDir } = context;
            if (electronPlatformName !== 'darwin') {
                return;
            }

            console.log('\n✅ Kod imzalama tamamlandı');
            console.log('🔄 Notarization süreci başlıyor (notarytool ile)...');
            console.log('⏱️  Bu işlem 2-10 dakika sürebilir');

            const appName = context.packager.appInfo.productFilename;
            const appPath = `${appOutDir}/${appName}.app`;

            // New notarytool system
            const { execSync } = require('child_process');

            try {
                // Create a zip file for notarization
                const zipPath = `${appOutDir}/${appName}.zip`;
                execSync(`ditto -c -k --keepParent "${appPath}" "${zipPath}"`);

                console.log('📦 Zip oluşturuldu, Apple\'a gönderiliyor...');

                // Submit to Apple for notarization using notarytool
                const submitCommand = `xcrun notarytool submit "${zipPath}" --apple-id "${process.env.APPLE_ID}" --password "${process.env.APPLE_APP_SPECIFIC_PASSWORD}" --team-id "${process.env.APPLE_TEAM_ID}" --wait`;

                console.log('🚀 Apple\'a gönderiliyor ve sonuç bekleniyor...');

                const result = execSync(submitCommand, { encoding: 'utf8', timeout: 900000 }); // 15 minute timeout
                console.log('📋 Notarization sonucu:');
                console.log(result);

                if (result.includes('status: Accepted')) {
                    console.log('✅ Notarization başarılı!');

                    // Staple the notarization
                    execSync(`xcrun stapler staple "${appPath}"`);
                    console.log('📎 Notarization stapled - uygulama tamamen hazır!');
                } else {
                    console.log('⚠️ Notarization tamamlanamadı, ancak uygulama kod imzalı');
                }

                // Clean up zip file
                execSync(`rm "${zipPath}"`);

            } catch (error) {
                console.error('⚠️ Notarization hatası:', error.message);
                console.log('📋 Uygulama kod imzalı fakat notarize edilmemiş');
                console.log('💡 Kullanıcılar System Preferences\'tan manuel onay verebilir');
            }
        },
        mac: {
            category: 'public.app-category.developer-tools',
            target: [
                {
                    target: 'dmg',
                    arch: ['x64', 'arm64']
                }
            ],
            icon: 'assets/icon.icns',
            hardenedRuntime: true,
            gatekeeperAssess: false,
            identity: process.env.MAC_SIGNING_IDENTITY || "AHMET YILDIZ (C58CBKZPU4)",
            type: 'distribution',
            entitlements: 'build-resources/entitlements.mac.plist',
            entitlementsInherit: 'build-resources/entitlements.mac.plist'
        },
        dmg: {
            sign: false,
            contents: [
                {
                    x: 110,
                    y: 150
                },
                {
                    x: 240,
                    y: 150,
                    type: 'link',
                    path: '/Applications'
                }
            ],
            backgroundColor: '#ffffff',
            window: {
                width: 540,
                height: 380
            }
        },
        extraMetadata: {
            main: 'electron/main.js',
        },
        asar: true,
        asarUnpack: ['**/*.node'],
        extends: null,
    },
}).catch((error) => {
    console.error('Error during build:', error);
    process.exit(1);
});
