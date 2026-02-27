import {
  DefaultGlobalIdStrategy,
  InvalidGlobalIdException,
} from './global-id.strategy';

describe('DefaultGlobalIdStrategy', () => {
  let strategy: DefaultGlobalIdStrategy;

  beforeEach(() => {
    strategy = new DefaultGlobalIdStrategy();
  });

  describe('serialize', () => {
    it('should encode typename and id to base64', () => {
      const result = strategy.serialize('User', '123');
      const decoded = Buffer.from(result, 'base64').toString('utf-8');
      expect(decoded).toBe('User:123');
    });

    it('should handle numeric ids', () => {
      const result = strategy.serialize('Post', 456);
      const decoded = Buffer.from(result, 'base64').toString('utf-8');
      expect(decoded).toBe('Post:456');
    });

    it('should handle special characters in id', () => {
      const result = strategy.serialize('Comment', 'abc-123-xyz');
      const decoded = Buffer.from(result, 'base64').toString('utf-8');
      expect(decoded).toBe('Comment:abc-123-xyz');
    });
  });

  describe('parse', () => {
    it('should decode valid global id', () => {
      const encoded = Buffer.from('User:123').toString('base64');
      const result = strategy.parse(encoded);
      expect(result).toEqual({
        typename: 'User',
        id: '123',
      });
    });

    it('should throw InvalidGlobalIdException for invalid format (no colon)', () => {
      const encoded = Buffer.from('User123').toString('base64');
      expect(() => strategy.parse(encoded)).toThrow(InvalidGlobalIdException);
      expect(() => strategy.parse(encoded)).toThrow('Invalid global ID format');
    });

    it('should throw InvalidGlobalIdException for empty typename', () => {
      const encoded = Buffer.from(':123').toString('base64');
      expect(() => strategy.parse(encoded)).toThrow(InvalidGlobalIdException);
      expect(() => strategy.parse(encoded)).toThrow('Invalid global ID');
    });

    it('should throw InvalidGlobalIdException for empty id', () => {
      const encoded = Buffer.from('User:').toString('base64');
      expect(() => strategy.parse(encoded)).toThrow(InvalidGlobalIdException);
      expect(() => strategy.parse(encoded)).toThrow('Invalid global ID');
    });

    it('should handle ids with colons', () => {
      const encoded = Buffer.from('User:id:with:colons').toString('base64');
      const result = strategy.parse(encoded);
      expect(result).toEqual({
        typename: 'User',
        id: 'id:with:colons',
      });
    });

    it('should roundtrip correctly', () => {
      const typename = 'Product';
      const id = 'abc-123';
      const encoded = strategy.serialize(typename, id);
      const decoded = strategy.parse(encoded);
      expect(decoded).toEqual({ typename, id });
    });
  });
});

describe('InvalidGlobalIdException', () => {
  it('should create GraphQLError with correct code', () => {
    const error = new InvalidGlobalIdException('Test message');
    expect(error.message).toBe('Test message');
    expect(error.extensions).toEqual({ code: 'INVALID_GLOBAL_ID' });
  });
});
