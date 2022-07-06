import { fetchCalldataDecoder } from '../../util';
import { vi } from 'vitest';
import { setup as setupMockServiceWorker } from './__mocks__/setup';

describe('fetchCalldataDecoder', () => {
  // Mocks out responses from Etherscan and 4byte
  setupMockServiceWorker()

  beforeAll(() => {
    // Disable this mock to restore console logs when updating tests
    console.warn = vi.fn();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  test('decode calldata', async () => {
    const data =
      '0x38ed17390000000000000000000000000000000000000000000c1c173c5b782a5b154ab900000000000000000000000000000000000000000000000f380d77022fe8c32600000000000000000000000000000000000000000000000000000000000000a00000000000000000000000007ae7684581f0298241c3d6a6567a48d56b42b15c00000000000000000000000000000000000000000000000000000000622f8d27000000000000000000000000000000000000000000000000000000000000000300000000000000000000000095ad61b0a150d79219dcf64e1e6cc01f0b64c4ce000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000050522c769e01eb06c02bd299066509d8f97a69ae';
    const to = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
    const decoded = await fetchCalldataDecoder(data, to, '1');
    expect(decoded).toMatchSnapshot();
  });

  test('decode calldata as Buffer', async () => {
    const data = Buffer.from(
      '38ed17390000000000000000000000000000000000000000000c1c173c5b782a5b154ab900000000000000000000000000000000000000000000000f380d77022fe8c32600000000000000000000000000000000000000000000000000000000000000a00000000000000000000000007ae7684581f0298241c3d6a6567a48d56b42b15c00000000000000000000000000000000000000000000000000000000622f8d27000000000000000000000000000000000000000000000000000000000000000300000000000000000000000095ad61b0a150d79219dcf64e1e6cc01f0b64c4ce000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000050522c769e01eb06c02bd299066509d8f97a69ae',
      'hex',
    );
    const to = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
    const decoded = await fetchCalldataDecoder(data, to, '1');
    expect(decoded).toMatchSnapshot();
  });

  test('decode proxy calldata', async () => {
    const data =
      '0xa9059cbb0000000000000000000000004ffbf741b0a64e8bd1f9d89fc9b5584cc5227b700000000000000000000000000000000000000000000000000000003052aacdb8';
    const to = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const decoded = await fetchCalldataDecoder(data, to, '1');
    expect(decoded).toMatchSnapshot();
  });

  test('fallback to 4byte', async () => {
    const data =
      '0x38ed17390000000000000000000000000000000000000000000c1c173c5b782a5b154ab900000000000000000000000000000000000000000000000f380d77022fe8c32600000000000000000000000000000000000000000000000000000000000000a00000000000000000000000007ae7684581f0298241c3d6a6567a48d56b42b15c00000000000000000000000000000000000000000000000000000000622f8d27000000000000000000000000000000000000000000000000000000000000000300000000000000000000000095ad61b0a150d79219dcf64e1e6cc01f0b64c4ce000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000050522c769e01eb06c02bd299066509d8f97a69ae';
    const to = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
    const decoded = await fetchCalldataDecoder(data, to, -1);
    expect(decoded).toMatchSnapshot();
  });

  test('decode calldata from external chain', async () => {
    const data =
      '0x38ed17390000000000000000000000000000000000000000000c1c173c5b782a5b154ab900000000000000000000000000000000000000000000000f380d77022fe8c32600000000000000000000000000000000000000000000000000000000000000a00000000000000000000000007ae7684581f0298241c3d6a6567a48d56b42b15c00000000000000000000000000000000000000000000000000000000622f8d27000000000000000000000000000000000000000000000000000000000000000300000000000000000000000095ad61b0a150d79219dcf64e1e6cc01f0b64c4ce000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000050522c769e01eb06c02bd299066509d8f97a69ae';
    const to = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const decoded = await fetchCalldataDecoder(data, to, '1337');
    expect(decoded).toMatchSnapshot();
  });

  test('handle too short data', async () => {
    const data = '0x001';
    const to = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const decoded = await fetchCalldataDecoder(data, to, '1');
    expect(decoded).toMatchInlineSnapshot(`
      {
        "abi": null,
        "def": null,
      }
    `);
  });

  test('handle no data', async () => {
    const data = '';
    const to = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const decoded = await fetchCalldataDecoder(data, to, '1');
    expect(decoded).toMatchInlineSnapshot(`
      {
        "abi": null,
        "def": null,
      }
    `);
  });
});
