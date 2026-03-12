import { Injectable, PipeTransform } from '@nestjs/common';
import { GlobalIdStrategyRegistry } from 'src/services/global-id.registry';

@Injectable()
export class ParseGlobalIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const globalIdStrategy = GlobalIdStrategyRegistry.get();
    const globalId = globalIdStrategy.parse(value);
    return globalId.id;
  }
}
