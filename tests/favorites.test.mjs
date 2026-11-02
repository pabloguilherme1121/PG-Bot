import test from 'node:test';
import assert from 'node:assert/strict';
import {FAVORITES_KEY,favoriteKey,loadFavoriteKeys,saveFavoriteKeys,toggleFavoriteKey,favoriteGames} from '../favorites.mjs';

const games=[
 {environment:'arcade',id:'snake',name:'Snake'},
 {environment:'arcade',id:'2048',name:'2048'},
 {environment:'estrategia',id:'est-001',name:'Missão 1'}
];

function memoryStorage(initial=null){
 let value=initial;
 return {
  getItem(key){assert.equal(key,FAVORITES_KEY);return value;},
  setItem(key,next){assert.equal(key,FAVORITES_KEY);value=next;},
  get snapshot(){return value;}
 };
}

test('identificador de favorito é isolado por projeto e rejeita dados inválidos',()=>{
 assert.equal(favoriteKey(games[0]),'arcade:snake');
 assert.equal(favoriteKey(games[2]),'estrategia:est-001');
 assert.equal(favoriteKey({environment:'outro',id:'snake'}),null);
 assert.equal(favoriteKey({environment:'arcade',id:'../../arquivo'}),null);
 assert.equal(favoriteKey(null),null);
});

test('carregamento ignora IDs antigos, duplicados, inválidos e JSON corrompido',()=>{
 const storage=memoryStorage(JSON.stringify(['arcade:snake','arcade:snake','estrategia:est-001','arcade:inexistente',{},'__proto__']));
 assert.deepEqual([...loadFavoriteKeys(storage,games)],['arcade:snake','estrategia:est-001']);
 assert.deepEqual([...loadFavoriteKeys(memoryStorage('{erro'),games)],[]);
 assert.deepEqual([...loadFavoriteKeys(memoryStorage('{"item":1}'),games)],[]);
});

test('alternar favorito é imutável e filtro mantém apenas jogos salvos',()=>{
 const empty=new Set();
 const added=toggleFavoriteKey(empty,games[0]);
 assert.deepEqual([...empty],[]);
 assert.deepEqual([...added],['arcade:snake']);
 assert.deepEqual(favoriteGames(games,added).map(x=>x.id),['snake']);
 assert.deepEqual([...toggleFavoriteKey(added,games[0])],[]);
 assert.deepEqual([...toggleFavoriteKey(added,{environment:'arcade',id:'../x'})],['arcade:snake']);
});

test('salvamento guarda somente IDs e falhas de armazenamento não interrompem o bot',()=>{
 const storage=memoryStorage();
 assert.equal(saveFavoriteKeys(storage,new Set(['arcade:snake'])),true);
 assert.deepEqual(JSON.parse(storage.snapshot),['arcade:snake']);
 const blocked={getItem(){throw Error('Acesso bloqueado')},setItem(){throw Error('Acesso bloqueado')}};
 assert.deepEqual([...loadFavoriteKeys(blocked,games)],[]);
 assert.equal(saveFavoriteKeys(blocked,new Set(['arcade:snake'])),false);
});
