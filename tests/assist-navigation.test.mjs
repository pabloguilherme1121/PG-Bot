import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestGame} from '../app.mjs';
const a={id:'snake'},b={id:'2048'},c={id:'puzzle'};
test('sugestão oferece alternativa quando há pelo menos dois jogos',()=>{
 assert.deepEqual(suggestGame([a,b],()=>0,'snake'),b);
 assert.deepEqual(suggestGame([a,b,c],()=>0,'snake'),b);
 assert.deepEqual(suggestGame([a,b,c],()=>0.999,'puzzle'),a);
});
test('filtro com um só jogo não inventa alternativas',()=>{
 assert.deepEqual(suggestGame([a],()=>0,'snake'),a);
 assert.equal(suggestGame([],()=>0,'snake'),null);
});
