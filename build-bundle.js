const fs = require('fs');

const files = [
  'js/core/math.js',
  'js/core/webgl.js',
  'js/core/scene.js',
  'js/core/mesh.js',
  'js/core/material.js',
  'js/core/physics.js',
  'js/core/animation.js',
  'js/core/particles.js',
  'js/core/input.js',
  'js/core/audio.js',
  'js/systems/renderer.js',
  'js/systems/lighting.js',
  'js/systems/postprocess.js',
  'js/systems/scripting.js',
  'js/systems/storage.js',
  'js/systems/github.js',
  'js/systems/exporter.js',
  'js/editor/hierarchy.js',
  'js/editor/inspector.js',
  'js/editor/project.js',
  'js/editor/timeline.js',
  'js/editor/animator-editor.js',
  'js/editor/shader-graph.js',
  'js/editor/modeler.js',
  'js/editor/gizmos.js',
  'js/ui/menus.js',
  'js/ui/resize.js',
  'js/ui/mobile.js',
  'js/main.js',
];

let bundle = `/* WebGL Engine Bundle - ${new Date().toISOString()} */
/* Arquivo único para evitar problemas de ordem de carregamento */
'use strict';

`;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  bundle += `\n/* ===== ${file} ===== */\n`;
  bundle += content;
  bundle += '\n';
}

fs.writeFileSync('engine-bundle.js', bundle);
console.log(`Bundle gerado: ${(bundle.length/1024).toFixed(0)}KB, ${bundle.split('\n').length} linhas`);
