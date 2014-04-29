'use strict';

var crypto = require('crypto'),
    request = require('request');

var API_URL = 'https://blimp-previews.herokuapp.com/?url=',
    RESULTS_URL = 'https://s3.amazonaws.com/demo.filepreviews.io/',
    FilePreviews;

FilePreviews = function(options) {
  options = options || {};

  this.debug = options.debug || false;
  this.resultsUrl = options.resultsUrl || RESULTS_URL;
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
  this._log('API request to: ' + this.getAPIRequestURL(url, options));

  request.get(this.getAPIRequestURL(url, options), function(err, result) {
    if (err) console.error(err);

    if (result.statusCode === 200 || result.statusCode === 403) {
      this._log('Got response ' + result.statusCode);
      this._pollForMetadata(url, options, function(err, metadata) {
        if (err) {
          callback(err, metadata);
        } else {
          callback(null, {
            metadata: metadata,
            previewURL: this.getPreviewURL(url, options)
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
    this._log('Polling url: ' + this.getMetadataURL(url));

    request.get(this.getMetadataURL(url, options), function(err, result) {
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

        this._log('Metadata not found next try in: ' + pause);
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

FilePreviews.prototype.hash = function(string) {
  return crypto.createHash('sha256').update(string).digest('hex').toString();
};

FilePreviews.prototype.getAPIRequestURL = function(url, options) {
  if (arguments.length === 1) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      options = false;
    }
  }

  var extraParams = '';

  if (options) {
    if (options.metadata) {
      extraParams = '&metadata=' + options.metadata.join(',');
    }

    if (options.size) {
      var size = '';

      if (options.size.width) {
        size = options.size.width;
      }

      if (options.size.height) {
        size = size + 'x' + options.size.height;
      }

      extraParams = extraParams + '&size=' + size;
    }
  }

  return API_URL + url + extraParams;
};

FilePreviews.prototype.getMetadataURL = function(url, options) {
  var hash = this.hash(this.getAPIRequestURL(url, options));
  return this.resultsUrl + hash + '/metadata.json';
};

FilePreviews.prototype.getPreviewURL = function(url, options) {
  var hash = this.hash(this.getAPIRequestURL(url, options));

  return this.resultsUrl + hash + '/' +
    this.getPreviewFilename(this.getFilename(url)) + '_original_1.png';
};

FilePreviews.prototype.getFilename = function(url) {
  return url.split('/').pop();
};

FilePreviews.prototype.getPreviewFilename = function(filename) {
  return filename.substr(0, filename.lastIndexOf('.')) || filename;
};

module.exports = FilePreviews;
