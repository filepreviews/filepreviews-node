/* globals describe it before */
var assert = require('assert');
var FilePreviews = require('../lib');

describe('Suite', function() {
  describe('initialization', function() {
    it('should require apiKey', function() {
      assert.throws(function() {
        var fp = new FilePreviews({ apiSecret: 'secret' });
      });
    });

    it('should require apiSecret', function() {
      assert.throws(function() {
        var fp = new FilePreviews({ apiKey: 'key' });
      });
    });

    it('should not throw if given apiKey and apiSecret', function() {
      assert.doesNotThrow(function() {
        var fp = new FilePreviews({ apiKey: 'key', apiSecret: 'secret' });
      });
    });

    it('should set apiKey and apiSecret', function() {
      var fp = new FilePreviews({ apiKey: 'key', apiSecret: 'secret' });
      assert.equal(fp.apiKey, 'key');
      assert.equal(fp.apiSecret, 'secret');
    });
  });

  describe('#getAPIRequestData()', function() {
    var fp;
    before(function() {
      fp = new FilePreviews({ apiKey: 'key', apiSecret: 'secret' });
    });

    it('should work without options', function() {
      var url = 'http://example.com';
      var result = fp.getAPIRequestData(url);
      assert.equal(result.url, url);
    });

    it('should work with options', function() {
      var url = 'http://example.com';
      var options = {
        format: 'jpg'
      };

      var result = fp.getAPIRequestData(url, options);
      assert.equal(result.url, url);
      assert.equal(result.format, options.format);
    });

    it('should concantenate height and width', function() {
      var url = 'http://example.com';
      var options = {
        size: {
          width: 1,
          height: 2
        }
      };

      var result = fp.getAPIRequestData(url, options);
      assert.equal(result.sizes[0], '1x2');
    });

    it('should handle width only', function() {
      var url = 'http://example.com';
      var options = {
        size: {
          width: 1
        }
      };

      var result = fp.getAPIRequestData(url, options);
      assert.equal(result.sizes[0], '1');
    });

    it('should handle height only', function() {
      var url = 'http://example.com';
      var options = {
        size: {
          height: 2
        }
      };

      var result = fp.getAPIRequestData(url, options);
      assert.equal(result.sizes[0], 'x2');
    });
  });

  describe('#generate()', function() {
    var fp;
    before(function() {
      fp = new FilePreviews({ apiKey: 'key', apiSecret: 'secret' });
    });

    it('should format request correctly', function() {
      fp._request = function(request, callback) {
        var url = request.url.split('/');

        assert.equal(request.auth.username, 'key');
        assert.equal(request.auth.password, 'secret');

        assert.equal(request.method, 'POST');
        assert.equal(request.json, true);

        assert.equal(url[3], 'v2');
        assert.equal(url[4], 'previews');
      };
      fp.generate('my-preview-id');
    });

    it('should handle success', function() {
      fp._request = function(request, callback) {
        callback(null, { statusCode: 200 }, 'Yei!');
      };
      fp.retrieve('my-preview-id', function(err, result) {
        assert.equal(err, null);
        assert.equal(result, 'Yei!');
      });
    });

    it('should handle error', function() {
      fp._request = function(request, callback) {
        callback('error', { statusCode: 400 }, 'Some Error');
      };
      fp.retrieve('my-preview-id', function(err, result) {
        assert.equal(err, 'Some Error');
        assert.equal(result, null);
      });
    });
  });

  describe('#retrieve()', function() {
    var fp;
    before(function() {
      fp = new FilePreviews({ apiKey: 'key', apiSecret: 'secret' });
    });

    it('should format request correctly', function() {
      fp._request = function(request, callback) {
        var url = request.url.split('/');

        assert.equal(request.auth.username, 'key');
        assert.equal(request.auth.password, 'secret');

        assert.equal(request.method, 'GET');
        assert.equal(request.json, true);

        assert.equal(url[3], 'v2');
        assert.equal(url[4], 'previews');
        assert.equal(url[5], 'my-preview-id');
      };
      fp.retrieve('my-preview-id');
    });

    it('should handle success', function() {
      fp._request = function(request, callback) {
        callback(null, { statusCode: 200 }, 'Yei!');
      };
      fp.retrieve('my-preview-id', function(err, result) {
        assert.equal(err, null);
        assert.equal(result, 'Yei!');
      });
    });

    it('should handle error', function() {
      fp._request = function(request, callback) {
        callback('error', { statusCode: 400 }, 'Some Error');
      };
      fp.retrieve('my-preview-id', function(err, result) {
        assert.equal(err, 'Some Error');
        assert.equal(result, null);
      });
    });
  });
});
