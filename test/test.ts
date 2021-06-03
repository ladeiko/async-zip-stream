import {mkdtemp, rmdir} from 'fs/promises';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import {createZipStream} from '../lib';
import {exec} from 'child_process';
import {Readable} from 'stream';

describe('test', () => {
  it('should succeeded', async () => {
    const tmpdir = await mkdtemp(path.join(os.tmpdir(), 'foo-'));
    try {
      const destinationPath = path.join(tmpdir, 'result.zip');
      const filesize = 1024 * 1024;
      const files = [];
      const filesCount = 5;

      for (let i = 0; i < filesCount; i += 1) {
        const filename = path.join(tmpdir, `file_1GB_${i}`);
        exec(`dd if=/dev/urandom bs=1024 count=${Math.floor(filesize / 1024)} of=${filename} conv=notrunc`);
        files.push(filename);
      }

      interface CheckPoint {
        readonly filename: string;
        readonly event: string;
      }
      const checkpoints: CheckPoint[] = [];

      const source = createZipStream(files.map((filename) => ({
        name: path.basename(filename),
        async stream(): Promise<Readable> {

          checkpoints.push({
            filename: path.basename(filename),
            event: 'create',
          });

          const source = fs.createReadStream(filename);
          source.on('end', () => {
            checkpoints.push({
              filename: path.basename(filename),
              event: 'end',
            });
          });

          return source;
        },
      })));

      const destination = fs.createWriteStream(destinationPath);

      const promise = new Promise<void>((resolve, reject) => {
        destination.on('error', (error) => {
          reject(error);
        });
        destination.on('finish', () => {
          resolve();
        });
      });

      source.pipe(destination);

      await expect(promise).resolves.toBeUndefined();
      expect(checkpoints).toEqual(Array.from({length: filesCount}, (x, i) => i).map((i) => ([{
        filename: `file_1GB_${i}`,
        event: 'create',
      },{
        filename: `file_1GB_${i}`,
        event: 'end',
      }])).flat());
    } finally {
      await rmdir(tmpdir, {recursive: true});
    }
  });

  it('should fail', async () => {
    const tmpdir = await mkdtemp(path.join(os.tmpdir(), 'foo-'));
    try {
      const destinationPath = path.join(tmpdir, 'result.zip');
      const someError = new Error('Some error');

      const source = createZipStream([{
        name: 'fake',
        async stream(): Promise<Readable> {
          throw someError;
        },
      }]);

      const destination = fs.createWriteStream(destinationPath);

      const promise = new Promise<void>((resolve, reject) => {
        source.on('error', (error) => {
          reject(error);
        });
        destination.on('error', (error) => {
          reject(error);
        });
        destination.on('finish', () => {
          resolve();
        });
      });

      source.pipe(destination);

      await expect(promise).rejects.toThrow(someError);
    } finally {
      await rmdir(tmpdir, {recursive: true});
    }
  });
});
