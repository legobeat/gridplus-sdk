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

  test('decode nested calldata: multicall(bytes[])', async () => {
    const data =
      '0xac9650d8000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000a40c49ccbe000000000000000000000000000000000000000000000000000000000002d6da00000000000000000000000000000000000000000000000000000b100a58bd63000000000000000000000000000000000000000000000000000016ac77cb53fe00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000061ef0508000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084fc6f7865000000000000000000000000000000000000000000000000000000000002d6da0000000000000000000000004ce6aea89f059915ae5efbf34a2a8adc544ae09e00000000000000000000000000000000ffffffffffffffffffffffffffffffff00000000000000000000000000000000ffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000';
    const to = '0xc36442b4a4522e871399cd717abdd847ab11fe88';
    const { def } = await fetchCalldataDecoder(data, to, '1', true);
    expect({ def }).toMatchSnapshot();
  });

  test('decode nested calldata: execTransaction(address,uint256,(multicall(bytes[])),uint8,uint256,uint256,uint256,address,address,bytes)', async () => {
    const data =
      '0x6a761202000000000000000000000000c36442b4a4522e871399cd717abdd847ab11fe880000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000036e3f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003a00000000000000000000000000000000000000000000000000000000000000224ac9650d8000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000a40c49ccbe0000000000000000000000000000000000000000000000000000000000042677000000000000000000000000000000000000000000000000002223dbc72b15a70000000000000000000000000000000000000000000000000000014f8d4596e400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000062e90b1b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084fc6f7865000000000000000000000000000000000000000000000000000000000004267700000000000000000000000006412d7ebfbf66c25607e2ed24c1d207043be32700000000000000000000000000000000ffffffffffffffffffffffffffffffff00000000000000000000000000000000ffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c351d12bf187b0b2cb69bcf58076f8ce9197ebc4ff5fbb97ca5f36d296cfc55ffe4e62e761ab9d1a5d27577d76dc18f1e851e6ec87a239bedcbbef8bb52bd811501bc23b15b14d797a0cc444b9ab5e0a9340b8f1341210778446c948f5120b282b105ae55d0aef0bf62af4e614d42a9c99b2724272486433a191ed16ecaaab81dab61c0000000000000000000000009789d9d99409bf01699b8988da8886647418998e0000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000';
    const to = '0x06412d7ebfbf66c25607e2ed24c1d207043be327';
    const { def } = await fetchCalldataDecoder(data, to, '1', true);
    expect({ def }).toMatchSnapshot();
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

  test('decode Celo calldata', async () => {
    const data =
      '0xf2fde38b000000000000000000000000b538e8dcd297450bdef46222f3ceb33bb1e921b3';
    const to = '0x96d59127ccd1c0e3749e733ee04f0dfbd2f808c8';
    const decoded = await fetchCalldataDecoder(data, to, '42220');
    expect(decoded).toMatchSnapshot();
  });
});
