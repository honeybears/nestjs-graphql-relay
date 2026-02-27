import { ConnectionArgs, ConnectionType } from 'src/interfaces/edge.interface';

export abstract class ConnectionService {
  abstract execute<T>(args: ConnectionArgs): Promise<ConnectionType<T>>;
}
