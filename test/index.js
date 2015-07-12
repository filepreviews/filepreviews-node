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

  describe('#request()', function() {
    var fp;
    before(function() {
      fp = new FilePreviews({ apiKey: 'key', apiSecret: 'secret' });
    });

    it('should send auth information', function() {
      fp._request = function(request, callback) {
        assert.equal(request.auth.username, 'key');
        assert.equal(request.auth.password, 'secret');
      };

      fp.request('http://example.com/');
    });

    it('should set GET as default method', function() {
      fp._request = function(request, callback) {
        assert.equal(request.method, 'GET');
      };

      fp.request('http://example.com/');
    });

    it('should accept method type in options', function() {
      fp._request = function(request, callback) {
        assert.equal(request.method, 'POST');
      };

      fp.request('http://example.com/', { method: 'POST' });
    });

    it('should accept data String in options', function() {
      fp._request = function(request, callback) {
        assert.equal(request.body, 'my-data');
      };

      fp.request('http://example.com//', { data: 'my-data' });
    });

    it('should accept data Object in options', function() {
      fp._request = function(request, callback) {
        assert.equal(request.body.foo, 'bar');
      };

      fp.request('http://example.com/', { data: { foo: 'bar' } });
    });

    it('should format request correctly', function() {
      var url = 'http://example.com/one/two/three';

      fp._request = function(request, callback) {
        assert.equal(request.auth.username, 'key');
        assert.equal(request.auth.password, 'secret');

        assert.equal(request.method, 'POST');
        assert.equal(request.json, true);

        assert.equal(request.url, url);
        assert.equal(request.body.foo, 'bar');
      };
      fp.request(url, {
        method: 'POST',
        data: { foo: 'bar'}
      });
    });

    it('should handle success', function() {
      fp._request = function(request, callback) {
        var body = {
          foo: 'bar'
        };

        callback(null, { statusCode: 200 }, body);
      };

      fp.request('http://example.com/', {}, function(err, response) {
        assert.equal(err, null);
        assert.equal(response.foo, 'bar');
      });
    });

    it('should handle error', function() {
      fp._request = function(request, callback) {
        callback(null, { statusCode: 500 }, 'Server Error');
      };

      fp.request('http://example.com/', {}, function(err, response) {
        assert.equal(err, 'Server Error');
        assert.equal(response, null);
      });
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

        assert.equal(request.body.url, 'http://example.com/my-file.doc');
      };
      fp.generate('http://example.com/my-file.doc');
    });

    it('should handle success', function() {
      var url = 'http://example.com/my-file.doc';
      fp._request = function(request, callback) {
        var response = { statusCode: 200 };
        var body = {
          id: '1',
          status: 'pending',
          preview: null,
          thumbnails: null,
          original_file: null,
          user_data: null,
          url: url
        };

        callback(null, response, body);
      };
      fp.generate(url, function(err, result) {
        assert.equal(err, null);
        assert.equal(result.id, '1');
        assert.equal(result.status, 'pending');
        assert.equal(result.url, url);
      });
    });

    it('should handle error', function() {
      fp._request = function(request, callback) {
        callback('error', { statusCode: 500 }, 'Server Error');
      };
      fp.generate('my-preview-id', function(err, result) {
        assert.equal(err, 'Server Error');
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
        var request = { statusCode: 200 };
        var body = {
          status: 'success',
          thumbnails: [{
            url: 'http://example.com/user_manual_original_1.png',
            requested_size: 'original',
            resized: false,
            original_size: {
              width: '612',
              height: '792'
            },
            page: 1,
            size: {
              width: '612',
              height: '792'
            }
          }],
          url: 'http://example.com/v2/previews/123/',
          id: '123',
          preview: {
            url: 'http://example.com/user_manual_original_1.png',
            requested_size: 'original',
            resized: false,
            original_size: {
              width: '612',
              height: '792'
            },
            page: 1,
            size: {
              width: '612',
              height: '792'
            }
          },
          user_data: null,
          original_file: {
            mimetype: 'application/pdf',
            name: 'user_manual',
            extension: 'pdf',
            encoding: 'binary',
            total_pages: 1,
            metadata: {},
            type: 'application',
            size: 416905
          }
        };

        callback(null, { statusCode: 200 }, body);
      };
      fp.retrieve('my-preview-id', function(err, result) {
        assert.equal(err, null);
        assert.equal(result.status, 'success');
        assert.equal(result.url, 'http://example.com/v2/previews/123/');
      });
    });

    it('should handle error', function() {
      fp._request = function(request, callback) {
        callback('error', { statusCode: 500 }, 'Server Error');
      };
      fp.retrieve('my-preview-id', function(err, result) {
        assert.equal(err, 'Server Error');
        assert.equal(result, null);
      });
    });
  });
});
