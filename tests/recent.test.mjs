import test from 'node:test';
import assert from 'node:assert/strict';
import {RECENT_KEY, RECENT_LIMIT, addRecent, loadRecent, saveRecent, recentGames} from '../recent.mjs';

const games=[
 {environment:'arcade',id:'snake',name:'Snake'},
 {environment:'arcade',id:'2048',name:'2048'},
 {environment:'estrategia',id:'est-001',name:'Conquista territorial Aurora'},
 {environment:'estrategia',id:'snake',name:'Snake estratégico'}
];
const storage=(initial=null)=>({
 value:initial,
 getItem(key){assert.equal(key,RECENT_KEY);return this.value},
 setItem(key,value){assert.equal(key,RECENT_KEY);this.value=value}
});

test('histórico distingue projetos e mantém a seleção mais recente primeiro',()=>{
 const first=addRecent([],games[0]);
 const second=addRecent(first,games[2]);
 assert.deepEqual(second,['estrategia:est-001','arcade:snake']);
 assert.deepEqual(addRecent(second,games[0]),['arcade:snake','estrategia:est-001']);
 assert.deepEqual(addRecent(second,games[3]),['estrategia:snake','estrategia:est-001','arcade:snake']);
});

test('apenas IDs válidos e no máximo seis consultas são armazenados',()=>{
 const nine=Array.from({length:9},(_,i)=>({environment:'arcade',id:'game-'+i,name:'Game '+i}));
 let history=[];
 for(const game of nine)history=addRecent(history,game);
 assert.equal(RECENT_LIMIT,6);
 assert.deepEqual(history,['arcade:game-8','arcade:game-7','arcade:game-6','arcade:game-5','arcade:game-4','arcade:game-3']);
 assert.deepEqual(addRecent(history,{environment:'invalid',id:'sensitive'}),history);
 assert.deepEqual(addRecent(history,{environment:'arcade',id:'../bad'}),history);
});

test('leitura elimina contextos removidos, duplicados e entradas corrompidas',()=>{
 const s=storage(JSON.stringify(['arcade:snake','estrategia:est-001','arcade:snake','arcade:removed',{},'__proto__']));
 assert.deepEqual(loadRecent(s,games),['arcade:snake','estrategia:est-001']);
 assert.deepEqual(loadRecent(storage('invalid json'),games),[]);
 assert.deepEqual(loadRecent(storage('{"not":"array"}'),games),[]);
});

test('salvamento persiste somente IDs sem perguntas ou dados da partida',()=>{
 const s=storage();
 assert.equal(saveRecent(s,['arcade:snake','estrategia:est-001']),true);
 assert.deepEqual(JSON.parse(s.value),['arcade:snake','estrategia:est-001']);
 assert.equal(s.value.includes('pergunta'),false);
 assert.deepEqual(recentGames(games,loadRecent(s,games)).map(g=>g.name),['Snake','Conquista territorial Aurora']);
});

test('armazenamento bloqueado não interrompe a aplicação',()=>{
 const blocked={getItem(){throw Error('storage blocked')},setItem(){throw Error('storage blocked')}};
 assert.deepEqual(loadRecent(blocked,games),[]);
 assert.equal(saveRecent(blocked,['arcade:snake']),false);
 assert.deepEqual(recentGames([],['arcade:snake']),[]);
});
