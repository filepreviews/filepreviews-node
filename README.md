# FilePreviews.io

[![Build Status](https://travis-ci.org/GetBlimp/filepreviews-node.svg)](https://travis-ci.org/GetBlimp/filepreviews-node)

Node.js client library and CLI tool for the [FilePreviews.io](http://filepreviews.io) service. Generate image previews and metadata from almost any kind of file.

## Installation

```
npm install filepreviews
```

### Example code

```js
var FilePreviews = require('filepreviews');

var previews = new FilePreviews({
  debug: true,
  apiKey: 'API_KEY_HERE',
  apiSecret: 'API_SECRET_HERE'
});

previews.generate(url, function(err, result) {
  console.log(err);
  console.log(result.id);
  console.log(result.status);

  previews.retrieve(result.id, function(err, result) {
    console.log(result);
  });
});
```

#### Options
You can optionally send an options object.

```js
var FilePreviews = require('filepreviews');

var previews = new FilePreviews({
  debug: true,
  apiKey: 'API_KEY_HERE',
  apiSecret: 'API_SECRET_HERE'
});

var options = {
  size: {
    width: 250,
    height: 250,
  },
  metadata: ['exif', 'ocr', 'psd'],
  format: 'jpg',
  data: { foo: 'bar' }
}

previews.generate(url, options, function(err, result) {
  console.log(result.id);
  console.log(result.status);
});
```

## CLI
We made a very simple CLI tool that comes bundled with this module and allows you to very easily test the FilePreviews.io API.

#### Install globally

```
npm install -g filepreviews
```

#### CLI Usage

```
filepreviews [options] [url]
```

#### Example

```
filepreviews https://www.filepicker.io/api/file/mbsbe85FTIW6DzYlkav2
```
