import { GlobalIdStrategyRegistry } from './global-id.registry';
import { DefaultGlobalIdStrategy } from './global-id.strategy';

describe('GlobalIdStrategyRegistry', () => {
  describe('with default strategy', () => {
    it('should use DefaultGlobalIdStrategy when no custom strategy provided', () => {
      new GlobalIdStrategyRegistry({});

      const strategy = GlobalIdStrategyRegistry.get();
      expect(strategy).toBeInstanceOf(DefaultGlobalIdStrategy);
    });
  });

  describe('with custom strategy', () => {
    it('should use custom strategy when provided', () => {
      const customStrategy = {
        parse: jest.fn(),
        serialize: jest.fn(),
      };

      new GlobalIdStrategyRegistry({
        globalIdStrategy: customStrategy,
      });

      const strategy = GlobalIdStrategyRegistry.get();
      expect(strategy).toBe(customStrategy);
    });
  });
});
