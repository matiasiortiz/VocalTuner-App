const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function buildStandalone() {
  const stubPayloadPlugin = {
    name: 'stub-standalone-payload',
    setup(build) {
      build.onResolve({ filter: /standalonePayload$/ }, args => ({
        path: args.path,
        namespace: 'stub-payload'
      }));
      build.onLoad({ filter: /.*/, namespace: 'stub-payload' }, () => ({
        contents: 'export const STANDALONE_HTML = "";',
        loader: 'ts'
      }));
    }
  };

  const result = await esbuild.build({
    entryPoints: ['index.tsx'],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    write: false,
    plugins: [stubPayloadPlugin],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  // Escape any accidental </script> sequence inside minified bundle
  const bundledJs = result.outputFiles[0].text.replace(/<\/script>/gi, '<\\/script>');

  const html = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" name="viewport"/>
    <title>VocalTuner - Standalone</title>
    <meta name="description" content="Una aplicación avanzada de vocalización y coro con entrenamiento de escalas interactivas, piano acústico en tiempo real, metrónomo profesional y recursos de salud vocal."/>
    
    <!-- Standalone flag, storage fallback for file://, and extension error filter -->
    <script>
      window.__VOCALTUNER_STANDALONE__ = true;
      (function() {
        // Fallback en memoria si el navegador bloquea localStorage en archivos locales file://
        try {
          var testKey = '__vt_test__';
          window.localStorage.setItem(testKey, '1');
          window.localStorage.removeItem(testKey);
        } catch (storageErr) {
          var memStore = {};
          try {
            Object.defineProperty(window, 'localStorage', {
              configurable: true,
              value: {
                getItem: function(k) { return Object.prototype.hasOwnProperty.call(memStore, k) ? memStore[k] : null; },
                setItem: function(k, v) { memStore[k] = String(v); },
                removeItem: function(k) { delete memStore[k]; },
                clear: function() { memStore = {}; }
              }
            });
          } catch (e2) {}
        }

        try {
          var desc = Object.getOwnPropertyDescriptor(window, 'fetch') || Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
          if (desc && desc.get && !desc.set && desc.configurable !== false) {
            var val = desc.get.call(window);
            Object.defineProperty(window, 'fetch', {
              configurable: true,
              enumerable: desc.enumerable !== false,
              get: function() { return val; },
              set: function(next) { if (typeof next === 'function') val = next; }
            });
          }
        } catch (err) {}

        window.addEventListener('error', function(e) {
          var src = (e && e.filename) ? String(e.filename) : '';
          var msg = (e && e.message) ? String(e.message) : '';
          if (
            src.indexOf('chrome-extension://') === 0 ||
            src.indexOf('moz-extension://') === 0 ||
            src.indexOf('safari-extension://') === 0 ||
            msg.indexOf('Cannot set property fetch of #<Window>') !== -1
          ) {
            e.stopImmediatePropagation();
            e.preventDefault();
            return;
          }
          var errBox = document.getElementById('init-error-box');
          var errMsg = document.getElementById('init-error-msg');
          if (errBox && errMsg) {
            errBox.style.display = 'block';
            errMsg.textContent = msg || 'Error desconocido';
          }
        }, true);
      })();
    </script>

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com" rel="preconnect"/>
    <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

    <script>
        if (typeof tailwind !== 'undefined') {
            tailwind.config = {
                darkMode: "class",
                theme: {
                    extend: {
                        colors: {
                            "primary": "#135bec",
                            "background-light": "#f6f6f8",
                            "background-dark": "#101622",
                            "surface-light": "#ffffff",
                            "surface-dark": "#1c2333",
                            "surface-border": "#2e3440",
                        },
                        fontFamily: {
                            "display": ["Inter", "sans-serif"]
                        },
                        boxShadow: {
                            "glow": "0 0 20px rgba(19, 91, 236, 0.4)",
                        }
                    },
                },
            };
        }
    </script>
    <style>
        body {
            background-color: #101622;
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow-x: hidden;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            margin: 0;
            padding: 0;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3b4354; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #135bec; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; background: transparent; touch-action: pan-y; user-select: auto; -webkit-user-select: auto; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: #ffffff; border: 2px solid #135bec; cursor: pointer; margin-top: -10px; box-shadow: 0 0 10px rgba(0,0,0,0.3); }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: #3b4354; border-radius: 2px; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body class="font-display antialiased text-slate-900 dark:text-white bg-background-light dark:bg-background-dark min-h-screen">
    <div id="root">
        <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #101622; color: #ffffff; padding: 24px; text-align: center;">
            <div style="width: 48px; height: 48px; border: 4px solid #135bec; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.02em;">VocalTuner</h1>
            <p style="font-size: 14px; color: #94a3b8; margin: 0 0 16px 0;">Cargando afinador vocal y sintetizador de piano...</p>
            <div id="init-error-box" style="display: none; max-width: 380px; width: 100%; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 12px; padding: 14px; text-align: left;">
                <div style="color: #fca5a5; font-size: 12px; font-weight: bold; margin-bottom: 4px;">Error al iniciar:</div>
                <div id="init-error-msg" style="color: #ffffff; font-size: 11px; font-family: monospace; word-break: break-all;"></div>
            </div>
        </div>
    </div>

    <!-- Pre-compiled Standalone Bundle (Zero Babel, Instant Execution) -->
    <script>
    ${bundledJs}
    </script>
</body>
</html>`;

  fs.writeFileSync(path.resolve('standalone.html'), html);
  fs.mkdirSync(path.resolve('public'), { recursive: true });
  fs.writeFileSync(path.resolve('public/standalone.html'), html);
  fs.writeFileSync(
    path.resolve('standalonePayload.ts'),
    `// Auto-generated by scripts/build-standalone.cjs - DO NOT EDIT MANUALLY\nexport const STANDALONE_HTML: string = ${JSON.stringify(html)};\n`
  );
  if (fs.existsSync(path.resolve('dist'))) {
    fs.writeFileSync(path.resolve('dist/standalone.html'), html);
  }
  console.log('standalone.html & standalonePayload.ts generated! Size:', (html.length / 1024).toFixed(1), 'KB');
}

buildStandalone().catch(err => {
  console.error(err);
  process.exit(1);
});
