import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditCatalog} from '../scripts/audit-catalog.mjs';

const snapshot=JSON.parse(readFileSync(new URL('../data/games.json',import.meta.url),'utf8'));
const copy=()=>structuredClone(snapshot);

test('o snapshot oficial respeita IDs, contagens, tipos e destinos reais',()=>{
 assert.deepEqual(auditCatalog(snapshot),[]);
});
test('bloqueia host externo, caminho falsificado e hash de outro jogo',()=>{
 const broken=copy();
 broken.games[0].url='https://evil.example/PG-Arcade/#/jogar/lanternas';
 assert.match(auditCatalog(broken).join(' '),/destino|URL/i);
 broken.games[0].url='https://pabloguilherme1121.github.io/PG-Arcade/#/jogar/unknown';
 assert.match(auditCatalog(broken).join(' '),/destino|URL/i);
});
test('detecta IDs duplicados, contagens divergentes e entradas ausentes',()=>{
 const broken=copy();
 broken.games[1].id=broken.games[0].id;
 broken.counts.arcade+=1;
 assert.match(auditCatalog(broken).join(' '),/duplicado/i);
 assert.match(auditCatalog(broken).join(' '),/contagem/i);
});
test('compara Arcade, missões, clássicos e independentes com IDs das fontes',()=>{
 const ids={
  arcade:snapshot.games.filter(g=>g.environment==='arcade').map(g=>g.id),
  missions:snapshot.games.filter(g=>g.kind==='mission').map(g=>g.id),
  classic:snapshot.games.filter(g=>g.environment==='estrategia'&&g.url.includes('independentes/#')).map(g=>g.id),
  independent:snapshot.games.filter(g=>g.environment==='estrategia'&&g.url.includes('/independentes/')&&!g.url.includes('independentes/#')).map(g=>g.id)
 };
 assert.deepEqual(auditCatalog(snapshot,ids),[]);
 ids.independent[0]='nome-novo';
 const issues=auditCatalog(snapshot,ids).join(' ');
 assert.match(issues,/faltando|sobrando/);
 assert.match(issues,/nome-novo/);
});
