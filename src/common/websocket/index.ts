import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({
  cors: {
    origin: ['http://223.4.248.176:8080', 'http://localhost:8080', 'http://localhost:3000', 'http://zwg.autos'], // 允许 Next.js 前端连接
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.server.emit('message', { type: 'system', content: `New user connected (${client.id})` });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.server.emit('message', { type: 'system', content: `User disconnected (${client.id})` });
  }

  // 处理来自客户端的消息
  @SubscribeMessage('clientMessage')
  handleMessage(client: Socket, payload: any): void {
    console.log('Received message from client:', payload);
    // 广播给所有客户端
    this.server.emit('message', {
      type: 'user',
      content: payload.content,
      sender: client.id,
      timestamp: new Date().toISOString()
    });
  }
}