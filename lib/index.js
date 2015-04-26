'use strict';

var request = require('request');
var crypto = require('crypto');

var API_URL = 'https://api.filepreviews.io/v1/',
    MAX_POLLING_ATTEMPTS = 15,
    MAX_POLLING_INTERVAL = 60000,
    DEBUG = false,
    S3_ACCESS_KEY,
    S3_SECRET_KEY,
    API_KEY,
    FilePreviews;


var setup = function(options) {
  options = options || {};

  DEBUG = options.debug || DEBUG;
  API_KEY = options.apiKey || API_KEY;
  S3_ACCESS_KEY = options.s3AccessKey || S3_ACCESS_KEY;
  S3_SECRET_KEY = options.s3SecretKey || S3_SECRET_KEY;
};


FilePreviews = function (options) {
  setup(options);
};


FilePreviews.prototype.generate = function (url, options, callback) {
  if (arguments.length === 2) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      callback = options;
    }
  }

  this.submitJobToAPI(url, options, function (err, result) {
    callback(err, result);
    _log('Processing done :)');
  }.bind(this));
};


FilePreviews.prototype.submitJobToAPI = function (url, options, callback) {
  if (arguments.length === 2) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      callback = options;
    }
  }

  var error = 'API request error: ';

  _log('API request to: ' + API_URL);

  var requestOptions = {
    url: API_URL,
    json: _getAPIRequestData(url, options)
  };

  if (API_KEY) {
    requestOptions.headers = {
      'X-API-Key': API_KEY
    };
  }

  request.post(requestOptions, function (err, result) {
    if (err) console.error(err);

    if (result.statusCode === 200 || result.statusCode === 403) {
      _log('Got response ' + result.statusCode);
      var data = result.body;

      this._pollForMetadata(data.metadata_url, options, function (err, metadata) {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            metadata: metadata,
            metadataURL: data.metadata_url,
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


FilePreviews.prototype._pollForMetadata = function (url, options, callback) {
  if (arguments.length === 2) {
    if (Object.prototype.toString.call(options) === '[object Function]') {
      callback = options;
    }
  }

  var tries = 1,
      pause = 1000;

  url = _getSignedRequestUrlForMetadata(url);
  var _getter = function () {
    _log('Polling for metadata, tries: ' + tries);
    _log('Polling url: ' + url);

    request.get(url, function (err, result) {
      if (result.statusCode === 200) {
        _log('Metadata found');
        var body = JSON.parse(result.body);
        if (body.error) {
          callback(body.error, body.error);
        } else {
          callback(null, body);
        }
      } else {
        pause = pause + (tries * 1000);
        pause = Math.min(pause, MAX_POLLING_INTERVAL);  //Never allow > 60 seconds between polling attempts.
        tries++;

        if (tries > MAX_POLLING_ATTEMPTS) {
          var e = "Polling limit [" + MAX_POLLING_ATTEMPTS + " attempts] reached, cancelling pollForMetadata";
          _log(e);
          return callback(e);
        }

        _log('Metadata not found next try in: ' + pause / 1000 + 's');
        setTimeout(_getter, pause);
      }
    }.bind(this));
  }.bind(this);

  return _getter();
};


/**
 * Logs a message only if DEBUG is set to true
 *
 * @param msg
 *
 * @private
 */
var _log = function(msg) {
  if (DEBUG) console.log(msg);
};

/**
 * When s3SecretKey and s3AccessKey are present, this creates a signed request to S3 to get the
 * metadata. Unless the bucket is publically available, the request will otherwise fail.
 *
 * @param url
 *
 * @returns {String}
 *
 * @private
 */
var _getSignedRequestUrlForMetadata = function(url) {
  if (S3_SECRET_KEY == null || S3_ACCESS_KEY == null) {
    return url;
  }

  var regex = /(.*:\/\/.*?)\/(.*)\/(.*\/.*)/;

  var matches = url.match(regex);
  var bucket = matches[2];
  var resource = matches[3];

  var expires = Math.round((new Date().getTime()) / 1000) + 3600; //1 hour

  var hmac = crypto.createHmac("sha1", S3_SECRET_KEY);

  var toBeHashed = "GET\n\n\n" + expires + "\n/" + bucket + "/" + resource;
  var hashedSignature = hmac.update(toBeHashed).digest('base64');
  var escapedSignature = encodeURIComponent(hashedSignature);

  url = url + "?AWSAccessKeyId=" + S3_ACCESS_KEY + "&Expires=" + expires + "&Signature=" + escapedSignature;
  return url;
};


/**
 * Manipulates options into format expected by FilePreviews API
 *
 * @param {String} url
 * @param {Object=} options
 *
 * @returns {*}
 *
 * @private
 */
var _getAPIRequestData = function (url, options) {
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

module.exports = function(options) {
  setup(options);
  return FilePreviews;
};