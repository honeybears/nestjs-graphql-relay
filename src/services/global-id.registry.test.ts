import { GlobalIdStrategyRegistry } from './global-id.registry';
import { DefaultGlobalIdStrategy } from './global-id.strategy';

describe('GlobalIdStrategyRegistry', () => {
  describe('with default strategy', () => {
    it('should use DefaultGlobalIdStrategy when no custom strategy provided', () => {
      const registry = new GlobalIdStrategyRegistry({});

      const strategy = registry.get();
      expect(strategy).toBeInstanceOf(DefaultGlobalIdStrategy);
    });
  });

  describe('with custom strategy', () => {
    it('should use custom strategy when provided', () => {
      const customStrategy = {
        parse: jest.fn(),
        serialize: jest.fn(),
      };

      const registry = new GlobalIdStrategyRegistry({
        globalIdStrategy: customStrategy,
      });

      const strategy = registry.get();
      expect(strategy).toBe(customStrategy);
    });
  });

  describe('set', () => {
    it('should update strategy', () => {
      const registry = new GlobalIdStrategyRegistry({});

      const newStrategy = {
        parse: jest.fn(),
        serialize: jest.fn(),
      };

      registry.set(newStrategy);
      expect(registry.get()).toBe(newStrategy);
    });
  });
});
