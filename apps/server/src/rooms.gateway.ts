import { Inject } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Identity, RoomsService, RoomView } from './rooms.service';

@WebSocketGateway({ maxHttpBufferSize: 4096 })
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server!: Server;
    constructor(@Inject(RoomsService) private readonly rooms: RoomsService) { }

    async handleConnection(socket: Socket) {
        try {
            this.rooms.limit(`socket:${socket.handshake.address}`);
            const identity = this.rooms.authenticate(socket.handshake.auth.code, socket.handshake.auth.token);
            socket.data.identity = identity;
            await socket.join(identity.code);
            if (!socket.connected) return;
            this.rooms.connect(identity, socket.id);
            this.publish(this.rooms.view(identity.code));
        } catch (error) {
            socket.emit('session:error', this.message(error));
            socket.disconnect(true);
        }
    }

    handleDisconnect(socket: Socket) {
        const identity = socket.data.identity as Identity | undefined;
        if (identity) {
            const room = this.rooms.disconnect(identity, socket.id);
            if (room) this.publish(room);
        }
    }

    publish(room: RoomView) { this.server.to(room.code).emit('room:update', room); }
    revokePlayer(playerId: string) {
        for (const socket of this.server.sockets.sockets.values()) {
            if (socket.data.identity?.playerId !== playerId) continue;
            socket.emit('session:error', 'Sua sessao foi recuperada em outro dispositivo.');
            socket.disconnect(true);
        }
    }
    private message(error: unknown) { return error instanceof Error ? error.message : 'Nao foi possivel concluir a acao.'; }

    @SubscribeMessage('room:sync')
    sync(@ConnectedSocket() socket: Socket) {
        return this.action(socket, identity => this.rooms.view(identity.code));
    }

    @SubscribeMessage('room:start')
    start(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) {
        return this.action(socket, identity => this.rooms.start(identity, (input as Record<string, unknown>)?.boardId));
    }

    @SubscribeMessage('room:color')
    selectColor(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) {
        return this.action(socket, identity => this.rooms.selectColor(identity, (input as Record<string, unknown>)?.color));
    }

    @SubscribeMessage('game:roll')
    roll(@ConnectedSocket() socket: Socket) { return this.gameAction(socket, 'game:roll'); }

    @SubscribeMessage('game:buy')
    buy(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:buy', input); }

    @SubscribeMessage('game:pay')
    pay(@ConnectedSocket() socket: Socket) { return this.gameAction(socket, 'game:pay'); }

    @SubscribeMessage('game:bail')
    bail(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:bail', input); }

    @SubscribeMessage('game:bank-loan')
    bankLoan(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:bank-loan', input); }

    @SubscribeMessage('game:emergency-fund-deposit')
    emergencyFundDeposit(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:emergency-fund-deposit', input); }

    @SubscribeMessage('game:emergency-fund-withdraw')
    emergencyFundWithdraw(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:emergency-fund-withdraw', input); }

    @SubscribeMessage('game:investment-create')
    createInvestment(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:investment-create', input); }

    @SubscribeMessage('game:investment-claim')
    claimInvestment(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:investment-claim', input); }

    @SubscribeMessage('game:investment-early-withdraw')
    withdrawInvestmentEarly(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:investment-early-withdraw', input); }

    @SubscribeMessage('game:finish-turn')
    finishTurn(@ConnectedSocket() socket: Socket) { return this.gameAction(socket, 'game:finish-turn'); }

    @SubscribeMessage('game:build')
    build(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:build', input); }

    @SubscribeMessage('game:sell-property')
    sellProperty(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:sell-property', input); }

    @SubscribeMessage('game:sell-building')
    sellBuilding(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:sell-building', input); }

    @SubscribeMessage('game:repay-loan')
    repayLoan(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:repay-loan', input); }

    @SubscribeMessage('game:declare-bankruptcy')
    declareBankruptcy(@ConnectedSocket() socket: Socket) { return this.gameAction(socket, 'game:declare-bankruptcy'); }

    @SubscribeMessage('game:request-player-loan')
    requestPlayerLoan(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:request-player-loan', input); }

    @SubscribeMessage('game:cancel-player-loan')
    cancelPlayerLoan(@ConnectedSocket() socket: Socket) { return this.gameAction(socket, 'game:cancel-player-loan'); }

    @SubscribeMessage('game:respond-player-loan')
    respondPlayerLoan(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:respond-player-loan', input); }

    @SubscribeMessage('game:offer-property')
    offerProperty(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:offer-property', input); }

    @SubscribeMessage('game:respond-property-offer')
    respondPropertyOffer(@ConnectedSocket() socket: Socket, @MessageBody() input: unknown) { return this.gameAction(socket, 'game:respond-property-offer', input); }

    private gameAction(socket: Socket, event: string, input: unknown = {}) {
        return this.action(socket, identity => this.rooms.gameAction(identity, event, input));
    }

    @SubscribeMessage('room:leave')
    leave(@ConnectedSocket() socket: Socket) {
        const result = this.action(socket, identity => this.rooms.leave(identity));
        if (result.ok) {
            const identity = socket.data.identity as Identity;
            if (!result.room) {
                this.server.to(identity.code).emit('room:closed');
                this.server.in(identity.code).disconnectSockets(true);
            } else {
                for (const client of this.server.sockets.sockets.values()) {
                    if (client.data.identity?.playerId === identity.playerId) {
                        client.emit('session:left');
                        client.disconnect(true);
                    }
                }
            }
        }
        return result;
    }

    private action(socket: Socket, perform: (identity: Identity) => RoomView | null) {
        try {
            const identity = this.rooms.authenticate(socket.data.identity?.code, socket.handshake.auth.token);
            this.rooms.limit(`action:${identity.playerId}`);
            const room = perform(identity);
            if (room) this.publish(room);
            return { ok: true as const, room };
        } catch (error) { return { ok: false as const, error: this.message(error) }; }
    }
}