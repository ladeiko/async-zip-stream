const Packer = require('zip-stream');
import {Readable} from 'stream';

export interface AsyncEntry {
  readonly name: string;
  stream(): Promise<Readable>;
}

export function createZipStream(entries: AsyncEntry[]): Readable {
  const clonedEntries = entries.map((e) => e);
  const archive = new Packer();

  const step = async () => {
    if (clonedEntries.length === 0) {
      archive.finish();
      return;
    }

    const entry: AsyncEntry = clonedEntries.shift()!;
    try {
      const source = await entry.stream();
      archive.entry(source, {name: entry.name}, (err: Error, entry: any) => {
        if (err) {
          archive.emit('error', err);
          return;
        }
        step();
      });
    } catch (e) {
      archive.emit('error', e);
    }
  };

  step();

  return archive;
}
