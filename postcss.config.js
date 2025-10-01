/** @type {import('postcss-load-config').Config} */
module.exports = {
    // PostCSS plugins required for Tailwind CSS in a Next.js environment.
    plugins: {
      // 1. Tailwind CSS plugin: Must be the first plugin.
      tailwindcss: {},
      
      // 2. Autoprefixer: Adds vendor prefixes for broader browser support.
      autoprefixer: {},
      
      // Note: The error "Cannot find module '@tailwindcss/postcss'" 
      // was caused because Next.js or your project was likely looking 
      // for this configuration file or its contents were malformed 
      // (e.g., trying to load a non-existent plugin name). 
      // The correct plugin name for Tailwind is simply 'tailwindcss'.
    },
  };
  