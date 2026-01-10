// XHR Interceptor - Intercepts Google Maps search requests
// This script runs in page context to capture XHR responses
(function(xhr) {
  var originalOpen = xhr.open;
  var originalSend = xhr.send;
  
  xhr.open = function(method, url) {
    this._method = method;
    this._url = url;
    return originalOpen.apply(this, arguments);
  };
  
  xhr.send = function(body) {
    var events = "loadstart load loadend progress error abort timeout readystatechange".split(" ");
    var self = this;
    
    events.forEach(function(eventName) {
      self.addEventListener(eventName, function() {
        // Check if this is a search request and fully loaded
        if (self._url && self._url.startsWith("/search") && self.readyState === 4) {
          try {
            window.postMessage({
              type: "search",
              data: self.response
            }, "*");
          } catch (err) {
            // Silent error handling
          }
        }
      });
    });
    
    return originalSend.apply(this, arguments);
  };
})(XMLHttpRequest.prototype);
