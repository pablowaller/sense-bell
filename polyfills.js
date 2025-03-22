if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = function(callback) {
    return setTimeout(callback, 0);
  };
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = function(id) {
    clearTimeout(id);
  };
} 