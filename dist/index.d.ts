/// <reference types="node" />
import { Readable } from 'stream';
export interface AsyncEntry {
    readonly name: string;
    stream(): Promise<Readable>;
}
export declare function createZipStream(entries: AsyncEntry[]): Readable;
