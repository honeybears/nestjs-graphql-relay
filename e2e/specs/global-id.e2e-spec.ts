import { globalIdStrategy } from './setup';

describe('Global ID Strategy (e2e)', () => {
  it('should correctly encode and decode global IDs', () => {
    const typename = 'User';
    const id = '123';

    const encoded = globalIdStrategy.serialize(typename, id);
    const decoded = globalIdStrategy.parse(encoded);

    expect(decoded).toEqual({ typename, id });
  });

  it('should handle IDs with special characters', () => {
    const typename = 'User';
    const id = 'abc-123-xyz';

    const encoded = globalIdStrategy.serialize(typename, id);
    const decoded = globalIdStrategy.parse(encoded);

    expect(decoded).toEqual({ typename, id });
  });
});
