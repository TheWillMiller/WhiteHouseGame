import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
// The game is fully client-side. Static export needs no Worker runtime.
export default defineConfig({css:{postcss:{plugins:[tailwindcss()]}},plugins:[vinext()]});
