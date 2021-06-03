# Async Zip Stream

[![Build Status](https://travis-ci.com/ladeiko/async-zip-stream.svg?branch=main)](https://travis-ci.com/ladeiko/async-zip-stream)

Helper code to create zip stream from source readable streams. Input streams can be created in lazy manner.
Main feature - streams are used sequentially.

## Installation

```console
npm i async-zip-stream
```

## Usage

```typescript
import {createZipStream} from 'async-zip-stream';

const zipSourceStream = createZipStream([
  {
    name: 'file.txt',
    async stream(): Promise<Readable> {
      return fs.createReadStream('somefile');
    },
  }
]);

const destination = fs.createWriteStream('/some/file.zip');

zipSourceStream.on('error', (error) => {
  //...
});

destination.on('error', (error) => {
  //...
});

destination.on('finish', () => {
  //...
});

zipSourceStream.pipe(destination);
```

## Contributing

Fork it, branch it, send me a pull request. We'll work out the rest together.

## Author

* Siarhei Ladzeika <sergey.ladeiko@gmail.com>

## LICENSE

See [LICENSE](LICENSE)
