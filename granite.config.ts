import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'nyang2048',
  version: '1.0.0',
  brand: {
    displayName: '냥2048',
    primaryColor: '#FF6B35',
    icon: 'https://static.toss.im/appsintoss/9715/cb026e1e-2af8-4414-a01f-8b37b13b595e.png',
  },
  permissions: [],
  webViewProps: {
    type: 'partner',
    mediaPlaybackRequiresUserAction: false,
    allowsInlineMediaPlayback: true,
  },
  web: {
    host: '0.0.0.0',
    port: 4009,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
});
