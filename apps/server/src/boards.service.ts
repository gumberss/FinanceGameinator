import { BadRequestException, Injectable } from '@nestjs/common';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BoardDefinition, validateBoard } from './game-engine';

export interface BoardSummary { id: string; name: string; description: string; currency: string; propertyCount: number; spaceCount: number }

@Injectable()
export class BoardsService {
    private readonly boards = new Map<string, BoardDefinition>();
    private readonly errors: string[] = [];

    constructor() {
        const boardDirectory = resolve(__dirname, '../boards');
        for (const file of readdirSync(boardDirectory).filter(name => name.toLowerCase().endsWith('.json'))) {
            try {
                const board = validateBoard(JSON.parse(readFileSync(resolve(boardDirectory, file), 'utf8')));
                if (this.boards.has(board.id)) throw new Error(`Duplicate board id: ${board.id}.`);
                this.boards.set(board.id, board);
            } catch (error) {
                this.errors.push(`${file}: ${error instanceof Error ? error.message : 'Invalid board.'}`);
            }
        }
        if (this.boards.size === 0) throw new Error(`No valid board configurations found. ${this.errors.join('; ')}`);
    }

    list(): BoardSummary[] {
        return [...this.boards.values()].map(board => ({ id: board.id, name: board.name, description: board.description, currency: board.currency, propertyCount: board.properties.length, spaceCount: board.spaces.length }));
    }

    all(): BoardDefinition[] { return [...this.boards.values()]; }

    get(id: unknown): BoardDefinition {
        if (typeof id !== 'string' || !this.boards.has(id)) throw new BadRequestException('Selecione um tabuleiro valido.');
        return this.boards.get(id)!;
    }

    getDiagnostics() { return [...this.errors]; }
}