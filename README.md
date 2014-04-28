# FilePreviews.io
This is a client library for the **Demo API** of [FilePreviews.io](http://filepreviews.io) service. A lot more to come very soon.

[Sign up to beta](http://eepurl.com/To0U1)

## Installation
```
npm install filepreviews
```

#### Example code
```js

var FilePreviews = require('filepreviews'),
    previews = new FilePreviews({debug: true});

previews.generate(url, function(err, result) {
  if (err) console.error(err);

  console.log(result.previewURL);
  console.log(result.metadata);
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
filepreviews [url]
```

#### Example
```
filepreviews https://www.filepicker.io/api/file/mbsbe85FTIW6DzYlkav2
```
