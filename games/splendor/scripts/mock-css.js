const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id.endsWith('.css')) return {};
  return originalRequire.apply(this, arguments);
};
