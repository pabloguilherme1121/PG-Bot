import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGameManifest} from '../scripts/sync-catalog.mjs';
const manifest={
 id:'dominio-territorial',title:'Domínio Territorial',category:'estrategia',engine:'hex-conquest',
 objective:'Capture o bastião central e a base rival antes do vigésimo turno.',
 controls:{touch:'Toque em setor aliado e ataque um hexágono adjacente.',keyboard:'Use Tab, setas, Enter e Espaço.'},
 strategyPlan:['Conquiste os flancos para obter suprimentos.','Reúna tropas para o ataque ao centro fortificado.','Avance até a base inimiga sem perder sua reserva.'],
 version:'1.0.0'
};
test('metadados versionados geram orientação e plano verificáveis para PG Bot',()=>{
 const r=parseGameManifest(manifest,'dominio-territorial');
 assert.equal(r.name,'Domínio Territorial');
 assert.equal(r.description,manifest.objective);
 assert.ok(r.help.includes(manifest.controls.touch));
 assert.ok(r.help.includes(manifest.controls.keyboard));
 for(const step of manifest.strategyPlan)assert.ok(r.help.includes(step));
});
test('manifesto com ID cruzado, HTML, controles ausentes ou plano incompleto é bloqueado',()=>{
 for(const broken of [
  {...manifest,id:'outro-jogo'},
  {...manifest,title:'<script>alert(1)</script>'},
  {...manifest,objective:''},
  {...manifest,engine:'weird code()'},
  {...manifest,controls:{touch:''}},
  {...manifest,strategyPlan:['só uma dica']},
  {...manifest,version:'latest'}
 ])assert.throws(()=>parseGameManifest(broken,'dominio-territorial'));
});
