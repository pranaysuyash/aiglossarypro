import { TextDecoder, TextEncoder } from 'node:util';
import '@testing-library/jest-dom';

Object.assign(global, { TextDecoder, TextEncoder });
