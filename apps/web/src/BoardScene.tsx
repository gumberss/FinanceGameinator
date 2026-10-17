import { useEffect, useRef } from 'react';

export function BoardScene({ label = 'Tabuleiro FinanceGameinator com propriedades, dados e pecas' }: { label?: string }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current!;
        const context = canvas.getContext('2d')!;
        canvas.width = 1440;
        canvas.height = 1040;
        context.scale(2, 2);
        const colors = ['#f29882', '#edca6e', '#6eaea0', '#bdd47e'];
        const tile = (left: number, top: number, index: number, angle: number) => {
            context.save();
            context.translate(left, top);
            context.rotate(angle);
            context.fillStyle = '#fcfcf5';
            context.fillRect(-19, -31, 38, 62);
            context.strokeStyle = '#b7c7bc';
            context.lineWidth = 1;
            context.strokeRect(-19, -31, 38, 62);
            context.fillStyle = colors[Math.floor(index / 2) % colors.length];
            context.fillRect(-18, -30, 36, 13);
            context.fillStyle = '#557166';
            context.fillRect(-9, -9, 18, 2);
            context.fillRect(-6, -3, 12, 2);
            context.font = 'bold 9px sans-serif';
            context.textAlign = 'center';
            context.fillText(index % 3 === 0 ? '?' : '$', 0, 18);
            context.restore();
        };
        context.save();
        context.translate(350, 260);
        context.rotate(-Math.PI / 9);
        context.shadowColor = '#224b342b';
        context.shadowBlur = 35;
        context.shadowOffsetY = 22;
        context.fillStyle = '#c4d2c1';
        context.fillRect(-206, -206, 412, 420);
        context.shadowColor = 'transparent';
        context.fillStyle = '#fdfdf7';
        context.fillRect(-206, -206, 412, 412);
        context.fillStyle = '#d9e8d3';
        context.fillRect(-140, -140, 280, 280);
        context.strokeStyle = '#a7bfab';
        context.strokeRect(-133, -133, 266, 266);
        for (let index = 0; index < 8; index++) {
            const offset = -133 + index * 38;
            tile(offset, -173, index, 0);
            tile(173, offset, index + 8, Math.PI / 2);
            tile(-offset, 173, index + 16, Math.PI);
            tile(-173, -offset, index + 24, -Math.PI / 2);
        }
        for (const [left, top, label] of [[-173, -173, 'INICIO'], [173, -173, '$'], [173, 173, 'SORTE'], [-173, 173, '$']] as const) {
            context.fillStyle = '#f4f2de';
            context.fillRect(left - 31, top - 31, 62, 62);
            context.strokeStyle = '#b7c7bc';
            context.strokeRect(left - 31, top - 31, 62, 62);
            context.fillStyle = '#315d47';
            context.textAlign = 'center';
            context.font = 'bold 12px sans-serif';
            context.fillText(label, left, top + 5);
        }
        context.textAlign = 'center';
        context.fillStyle = '#315d47';
        context.font = 'bold 56px Georgia';
        context.fillText('FG', 0, -4);
        context.font = 'bold 10px sans-serif';
        context.fillText('FINANCE GAMEINATOR', 0, 20);
        context.fillStyle = '#a7c9aa';
        context.fillRect(-47, 39, 94, 2);
        context.restore();
        const die = (left: number, top: number, angle: number, dots: number[][]) => {
            context.save();
            context.translate(left, top);
            context.rotate(angle);
            context.shadowColor = '#233b3329';
            context.shadowBlur = 12;
            context.shadowOffsetY = 7;
            context.fillStyle = '#fffdf7';
            context.beginPath();
            context.roundRect(-29, -29, 58, 58, 9);
            context.fill();
            context.shadowColor = 'transparent';
            context.fillStyle = '#2a4b3b';
            for (const [horizontal, vertical] of dots) {
                context.beginPath(); context.arc(horizontal, vertical, 4, 0, Math.PI * 2); context.fill();
            }
            context.restore();
        };
        die(530, 371, 0.16, [[-13, -13], [13, -13], [0, 0], [-13, 13], [13, 13]]);
        die(591, 413, -0.24, [[-13, -13], [13, 13], [0, 0]]);
        for (const [left, top, color] of [[176, 340, '#ec8065'], [475, 134, '#3d8d75']] as const) {
            context.save();
            context.translate(left, top);
            context.shadowColor = '#233b3330'; context.shadowBlur = 9; context.shadowOffsetY = 5;
            context.fillStyle = color;
            context.beginPath(); context.ellipse(0, 18, 17, 9, 0, 0, Math.PI * 2); context.fill();
            context.beginPath(); context.moveTo(-12, 17); context.lineTo(-7, -5); context.lineTo(7, -5); context.lineTo(12, 17); context.closePath(); context.fill();
            context.beginPath(); context.arc(0, -11, 10, 0, Math.PI * 2); context.fill();
            context.restore();
        }
    }, []);
    return <canvas ref={ref} className="board-scene" role="img" aria-label={label} />;
}