import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const orgId = client.handshake.query.organizationId as string;
    if (orgId) client.join(`org:${orgId}`);
  }

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { organizationId: string }, @ConnectedSocket() client: Socket) {
    client.join(`org:${data.organizationId}`);
  }

  emitToOrg(organizationId: string, event: string, data: unknown) {
    this.server.to(`org:${organizationId}`).emit(event, data);
  }
}
