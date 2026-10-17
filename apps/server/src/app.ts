import 'reflect-metadata';
import { BadRequestException, Body, Controller, Get, Inject, Module, Param, Post, Req } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { BoardsService } from './boards.service';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { calculateBankInterestRate, calculateFixedIncomeTerms, calculateLoanTerms } from './game-engine';

@Controller('api')
class RoomsController {
    constructor(@Inject(RoomsService) private readonly rooms: RoomsService, @Inject(RoomsGateway) private readonly gateway: RoomsGateway, @Inject(BoardsService) private readonly boards: BoardsService) { }

    @Get('health') health() { return { status: 'ok' }; }
    @Get('boards') listBoards() { return this.boards.list(); }
    @Get('boards/:id') getBoard(@Param('id') id: string) { return this.boards.get(id); }

    @Post('loan-terms') loanTerms(@Body() input: unknown) {
        if (!input || typeof input !== 'object') throw new BadRequestException('Informe os termos do emprestimo.');
        const values = input as Record<string, unknown>;
        const board = this.boards.get(values.boardId);
        try {
            const installments = values.installments as number;
            const rate = typeof values.interestRate === 'number' ? values.interestRate : calculateBankInterestRate(board, installments);
            return calculateLoanTerms(values.principal as number, rate, installments);
        }
        catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'Termos invalidos.'); }
    }

    @Post('investment-terms') investmentTerms(@Body() input: unknown) {
        if (!input || typeof input !== 'object') throw new BadRequestException('Informe os termos do investimento.');
        const values = input as Record<string, unknown>;
        const board = this.boards.get(values.boardId);
        const product = board.financialEducation.fixedIncomeProducts.find(candidate => candidate.id === values.productId);
        if (!product) throw new BadRequestException('Selecione um produto de renda fixa valido.');
        try { return calculateFixedIncomeTerms(product, values.principal as number, values.termCycles as number); }
        catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'Termos invalidos.'); }
    }

    @Post('rooms') create(@Body() body: unknown, @Req() request: { ip: string }) {
        this.rooms.limit(`http:${request.ip}`);
        return this.rooms.create(body);
    }

    @Post('rooms/join') join(@Body() body: unknown, @Req() request: { ip: string }) {
        this.rooms.limit(`http:${request.ip}`);
        const session = this.rooms.join(body);
        this.gateway.publish(session.room);
        return session;
    }
}

export async function createApplication(databasePath = process.env.DATABASE_PATH ?? 'data/finance-gameinator.sqlite') {
    @Module({
        controllers: [RoomsController],
        providers: [RoomsService, RoomsGateway, BoardsService, { provide: 'DATABASE_PATH', useValue: databasePath }],
    })
    class AppModule { }

    const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn'] });
    app.enableShutdownHooks();
    const webRoot = resolve(__dirname, '../../web/dist');
    if (existsSync(resolve(webRoot, 'index.html'))) {
        app.useStaticAssets(webRoot);
        app.use((request: { method: string; path: string }, response: { sendFile: (path: string) => void }, next: () => void) => {
            if (request.method === 'GET' && !request.path.startsWith('/api') && !request.path.startsWith('/socket.io')) response.sendFile(resolve(webRoot, 'index.html'));
            else next();
        });
    }
    return app;
}