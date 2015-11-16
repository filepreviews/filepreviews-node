var request = require('request');
var exec = require('child_process').exec;

var API_URL = 'https://api.filepreviews.io/v2';
var FilePreviews;

FilePreviews = function(options) {
  options = options || {};

  this.debug = options.debug || false;
  this.apiKey = options.apiKey;
  this.apiSecret = options.apiSecret;
  this._request = request;

  if (!this.apiKey) {
    throw new Error('Missing required apiKey.');
  }

  if (!this.apiSecret) {
    throw new Error('Missing required apiSecret.');
  }
};

FilePreviews.VERSION = require('../package.json').version;
FilePreviews.CLIENT_UA_SERIALIZED = null;
FilePreviews.CLIENT_UA = {
  lang: 'node',
  publisher: 'filepreviews',
  bindings_version: FilePreviews.VERSION,
  lang_version: process.version,
  platform: process.platform,
  uname: null
};

FilePreviews.prototype.log = function(msg) {
  if (this.debug) {
    console.log(msg);
  }

  return this;
};

FilePreviews.prototype.generate = function(url, options, callback) {
  if (arguments.length === 2) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      callback = options;
    }
  } else if (arguments.length === 1) {
    options = {};
  }

  this.request(API_URL + '/previews/', {
    method: 'POST',
    data: this.getAPIRequestData(url, options)
  },
  function(err, result) {
    if (callback) {
      callback(err, result);
    }
  });
};

FilePreviews.prototype.retrieve = function(previewId, callback) {
  this.request(API_URL + '/previews/' + previewId + '/', {
    method: 'GET'
  },
  function(err, result) {
    if (callback) {
      callback(err, result);
    }
  });
};

FilePreviews.prototype.request = function(url, options, callback) {
  var data;
  var _options = options || {};

  var onSuccess = function(error, response, body) {
    if (!error && response.statusCode >= 200 && response.statusCode <= 299) {
      this.log('API request success: ' + response.statusCode);
      this.log('API request response:', body);

      callback(null, body);
    } else {
      onError(error, response, body);
    }
  }.bind(this);

  var onError = function(error, response, body) {
    this.log('API request error: ' + error);
    this.log('API request response:', body);
    this.log('API request error: ' + response.statusCode);

    callback(body);
  }.bind(this);

  var getClientUserAgent = function(cb) {
    if (FilePreviews.CLIENT_UA_SERIALIZED) {
      return cb(FilePreviews.CLIENT_UA_SERIALIZED);
    }

    exec('uname -a', function(err, uname) {
      FilePreviews.CLIENT_UA.uname = uname || 'UNKNOWN';
      FilePreviews.CLIENT_UA_SERIALIZED = JSON.stringify(FilePreviews.CLIENT_UA);
      cb(FilePreviews.CLIENT_UA_SERIALIZED);
    });
  };

  var requestOptions = {
    url: url,
    method: _options.method || 'GET',
    json: true,
    auth: {
      username: this.apiKey,
      password: this.apiSecret
    },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'FilePreviews/v2 NodeBindings/' + FilePreviews.VERSION
    }
  };

  if (_options.data) {
    requestOptions.body = _options.data;
  }

  this.log('API request to: ' + url);

  getClientUserAgent(function(clientUA) {
    requestOptions.headers['X-FilePreviews-Client-User-Agent'] = clientUA;

    this._request(requestOptions, function(error, response, body) {
      if (error) {
        onError(error, response, body);
      } else {
        onSuccess(error, response, body);
      }
    });
  }.bind(this));
};

FilePreviews.prototype.getAPIRequestData = function(url, options) {
  var size;

  if (arguments.length === 2) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      options = {};
    }
  } else if (arguments.length === 1) {
    options = {};
  }

  if (options) {
    options.url = url;

    if (options.size) {
      size = '';

      if (options.size.width) {
        size = options.size.width;
      }

      if (options.size.height) {
        size = size + 'x' + options.size.height;
      }

      delete options.size;
      options.sizes = [size];
    }
  }

  return options;
};

module.exports = FilePreviews;
