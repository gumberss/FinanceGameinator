import { createApplication } from './app';

async function main() {
    const app = await createApplication();
    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port, '0.0.0.0');
    console.log(`FinanceGameinator server listening on http://localhost:${port}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });