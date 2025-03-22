// Add this function to get registered routes

import express from 'express';
export function getRegisteredRoutes(app: express.Application): string[] {
  const routes: string[] = [];
  
  function processStack(stack: any[], basePath: string = '') {
    if (!stack) return;
    
    stack.forEach((layer) => {
      if (layer.route) {
        // This is a route directly on the router
        const path = basePath + (layer.route.path || '');
        const methods = Object.keys(layer.route.methods)
          .filter((method) => layer.route.methods[method])
          .map((method) => method.toUpperCase());
          
        methods.forEach((method) => {
          routes.push(`${method.padEnd(6)} ${path}`);
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        // This is a mounted router
        let routerPath = '';
        
        if (layer.regexp) {
          // Extract the route from the regexp
          const match = layer.regexp.toString().match(/^\/\^\\\/([^\\]+)/);
          if (match) {
            routerPath = '/' + match[1];
          }
        }
        
        // Process the mounted router's stack
        processStack(layer.handle.stack, basePath + routerPath);
      } else if (layer.name === 'bound dispatch' && layer.route) {
        // Special middleware with route information
        const path = basePath + (layer.route.path || '');
        if (layer.route.methods) {
          Object.keys(layer.route.methods)
            .filter(method => layer.route.methods[method])
            .forEach(method => {
              routes.push(`${method.toUpperCase().padEnd(6)} ${path}`);
            });
        }
      }
    });
  }
  
  // Start processing the main application stack
  if (app._router && app._router.stack) {
    processStack(app._router.stack);
  }
  
  return routes;
}