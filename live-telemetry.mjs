export const LIVE_CHANNEL='pg_telemetry_hub_v1';
export const LIVE_TTL_MS=15000;
const validNumber=value=>value===null||(Number.isSafeInteger(value)&&value>=0&&value<=1_000_000_000);
export function parseLiveTick(raw,now=Date.now()){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.type!=='PG_STATE_TICK'||raw.version!==1)return null;
 if(!['arcade','estrategia'].includes(raw.project)||typeof raw.gameId!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(raw.gameId))return null;
 if(!Number.isSafeInteger(raw.timestamp)||!Number.isFinite(now)||raw.timestamp<now-LIVE_TTL_MS||raw.timestamp>now+2000)return null;
 if(!['playing','paused','victory','defeat'].includes(raw.phase)||!validNumber(raw.turn)||!validNumber(raw.score)||!validNumber(raw.resources))return null;
 return {type:'PG_STATE_TICK',version:1,project:raw.project,gameId:raw.gameId,timestamp:raw.timestamp,turn:raw.turn,score:raw.score,phase:raw.phase,resources:raw.resources};
}
export function isLiveForSelection(raw,game,now=Date.now()){
 const tick=parseLiveTick(raw,now);
 return !!tick&&!!game&&tick.project===game.environment&&tick.gameId===game.id;
}
export function liveSummary(tick){
 const phase={playing:'Em andamento',paused:'Pausada',victory:'Vitória',defeat:'Derrota'}[tick.phase]||'Desconhecida';
 const parts=[phase];
 if(tick.turn!==null)parts.push('Turno '+tick.turn);
 if(tick.score!==null)parts.push('Placar: '+tick.score);
 if(tick.resources!==null)parts.push('Suprimentos: '+tick.resources);
 return parts.join(' · ')+'.';
}
