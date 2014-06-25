'use strict';

var request = require('request');

var API_URL = 'https://api.filepreviews.io/v1/',
    FilePreviews;

FilePreviews = function(options) {
  options = options || {};

  this.debug = options.debug || false;
  this.apiKey = options.apiKey;
};

FilePreviews.prototype.generate = function(url, options, callback) {
  if (arguments.length === 2) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      callback = options;
    }
  }

  this.submitJobToAPI(url, options, function(err, result) {
    callback(err, result);
    this._log('Processing done :)');
  }.bind(this));
};

FilePreviews.prototype.submitJobToAPI = function(url, options, callback) {
  if (arguments.length === 2) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      callback = options;
    }
  }

  var error = 'API request error: ';

  this._log('API request to: ' + API_URL);

  var requestOptions = {
    url: API_URL,
    json: this.getAPIRequestData(url, options)
  };

  if (this.apiKey) {
    requestOptions.headers = {
      'X-API-Key': this.apiKey
    };
  }

  request.post(requestOptions, function(err, result) {
    if (err) console.error(err);

    if (result.statusCode === 200 || result.statusCode === 403) {
      this._log('Got response ' + result.statusCode);
      var data = result.body;
      this._pollForMetadata(data.metadata_url, options, function(err, metadata) {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            metadata: metadata,
            previewURL: data.preview_url
          });
        }
      }.bind(this));

    } else if (result.statusCode === 429) {
      error = new Error(error + 'Throttling error, try later');
      console.error(error);
      callback(error);

    } else {
      error = new Error(error + result.statusCode);
      console.error(error);
      callback(error);
    }
  }.bind(this));
};

FilePreviews.prototype._pollForMetadata = function(url, options, callback) {
  if (arguments.length === 2) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      callback = options;
    }
  }

  var tries = 1,
      pause = 1000;

  var _getter = function() {
    this._log('Polling for metadata, tries: ' + tries);
    this._log('Polling url: ' + url);

    request.get(url, function(err, result) {
      if (result.statusCode === 200) {
        this._log('Metadata found');
        var body = JSON.parse(result.body);
        if (body.error) {
          callback(body.error, body.error);
        } else {
          callback(null, body);
        }
      } else {
        pause = pause + (tries * 1000);
        tries++;

        this._log('Metadata not found next try in: ' + pause / 1000 + 's');
        setTimeout(_getter, pause);
      }
    }.bind(this));
  }.bind(this);

  return _getter();
};

FilePreviews.prototype._log = function(msg) {
  if (this.debug) console.log(msg);
  return this;
};

FilePreviews.prototype.getAPIRequestData = function(url, options) {
  if (arguments.length === 1) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      options = false;
    }
  }

  if (options) {

    options.url = url;

    if (options.size) {
      var size = '';

      if (options.size.width) {
        size = options.size.width;
      }

      if (options.size.height) {
        size = size + 'x' + options.size.height;
      }

      options.sizes = [size];
    }
  }

  return options;
};

module.exports = FilePreviews;
