export const OWNER = 'pabloguilherme1121';
export const PAGE_SIZE = 6;
export const QUESTIONS = [
  ['funcoes','O que este projeto faz?'],
  ['repositorio','Onde está o repositório?'],
  ['arquitetura','Qual é a arquitetura documentada?'],
  ['testes','Quais validações existem?'],
  ['integracao','Como integrar com segurança?'],
  ['documentacao','O que diz a documentação?'],
  ['prs','Quais são as PRs recentes?'],
  ['ci','Como estão os checks de CI?'],
  ['publicacao','Onde está a publicação?']
];

export function safeHttps(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function cleanRepo(repo) {
  if (!repo || repo.private !== false || repo.owner?.login !== OWNER || typeof repo.name !== 'string') return null;
  const name = repo.name.trim();
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(name)) return null;
  const htmlUrl = safeHttps(repo.html_url);
  if (!htmlUrl || new URL(htmlUrl).hostname !== 'github.com') return null;
  return {
    name, fullName: OWNER + '/' + name,
    description: String(repo.description || '').slice(0,500),
    url: htmlUrl, homepage: safeHttps(repo.homepage),
    updatedAt: repo.updated_at || null, pushedAt: repo.pushed_at || null,
    language: String(repo.language || ''), defaultBranch: String(repo.default_branch || 'main'),
    archived: Boolean(repo.archived)
  };
}

export function pageOf(records, page, size = PAGE_SIZE) {
  const total = records.length, pages = Math.max(1, Math.ceil(total / size));
  const current = Math.max(1, Math.min(Number(page) || 1, pages));
  return {items: records.slice((current - 1) * size, current * size), current, pages, total};
}

export function excerptMarkdown(markdown, length = 650) {
  const lines = String(markdown || '').replace(/\r/g,'').split('\n')
    .filter(line => !/^\s*(!\[|\[!\[|<|\||---|<!--)/.test(line))
    .map(line => line.replace(/^#{1,6}\s*/,'').replace(/[\`*_]/g,'').trim())
    .filter(Boolean);
  return lines.join(' ').slice(0,length);
}

export function validateQueue(input) {
  if (!Array.isArray(input)) return [];
  return input.slice(0,100).filter(item => item && typeof item.id === 'string' &&
    /^[a-z0-9-]{1,80}$/i.test(item.id) && typeof item.project === 'string' &&
    /^[a-zA-Z0-9._-]{1,100}$/.test(item.project))
    .map(item => ({
      id:item.id, project:item.project,
      reason:String(item.reason || '').slice(0,1500),
      next:String(item.next || '').slice(0,1500),
      evidence:safeHttps(item.evidence) || '',
      reviewed:item.reviewed === true,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : null
    }));
}

export function suggestedAction(repo, context) {
  const failed = (context?.runs?.data || []).find(run => run.conclusion === 'failure');
  if (failed) return {
    project:repo.name, reason:'Uma execução pública de CI registra falha. Confirmar se corresponde à HEAD relevante.',
    next:'Inspecionar logs e reproduzir a primeira falha antes de propor uma correção mínima.',
    evidence:safeHttps(failed.html_url) || repo.url
  };
  const docs = context?.readme?.data;
  if (!docs) return {
    project:repo.name, reason:'Documentação pública indisponível na última consulta.',
    next:'Conferir o README e registrar as funcionalidades realmente documentadas.',
    evidence:repo.url
  };
  return {
    project:repo.name, reason:'Revisão preventiva baseada na documentação pública do projeto.',
    next:'Comparar documentação, testes e última PR antes de propor alterações. Não modificar o projeto automaticamente.',
    evidence:repo.url + '/blob/' + encodeURIComponent(repo.defaultBranch) + '/README.md'
  };
}

export function describeQuestion(topic, repo, context) {
  const readme = context?.readme?.data;
  const pulls = context?.pulls?.data;
  const runs = context?.runs?.data;
  const source = section => ({
    url:section === 'readme' ? repo.url + '/blob/' + encodeURIComponent(repo.defaultBranch) + '/README.md'
      : section === 'package' ? repo.url + '/blob/' + encodeURIComponent(repo.defaultBranch) + '/package.json'
      : section === 'workflows' ? repo.url + '/tree/' + encodeURIComponent(repo.defaultBranch) + '/.github/workflows'
      : section === 'pulls' ? repo.url + '/pulls'
      : section === 'runs' ? repo.url + '/actions'
      : repo.url,
    fetchedAt:section === 'repo' ? repo.catalogFetchedAt || null : context?.[section]?.fetchedAt || null,
    stale:section === 'repo' ? Boolean(repo.catalogStale) : context?.[section]?.stale ?? true
  });
  switch(topic) {
    case 'funcoes': {
      const body = readme ? excerptMarkdown(readme,470) : '';
      return {answer:body ? 'Trecho da documentação pública: ' + body : 'Não foi possível consultar as funções documentadas. A descrição do repositório não comprova recursos implementados.',...source('readme')};
    }
    case 'documentacao':
      return {answer:readme ? 'Trecho do README: ' + excerptMarkdown(readme,700) : 'README indisponível nesta consulta.',...source('readme')};
    case 'repositorio':
      return {answer:'Repositório público: ' + repo.fullName + '. Linguagem indicada pelo GitHub: ' + (repo.language || 'não informada') + '.',...source('repo')};
    case 'arquitetura': {
      const pkg=context?.package?.data;
      const libs=pkg?.dependencies || [];
      const tools=pkg?.devDependencies || [];
      const details=pkg ? 'package.json: '+(pkg.name||'sem nome')+'. Dependências declaradas: '+([ ...libs,...tools].slice(0,18).join(', ') || 'nenhuma') : '';
      return {answer:pkg ? details+'. Isso descreve dependências, não confirma toda a arquitetura.' : 'Sem package.json acessível. A arquitetura precisa de revisão da documentação e dos arquivos do repositório.',...source('package')};
    }
    case 'testes': {
      const pkg=context?.package?.data;
      const workflows=context?.workflows?.data;
      const scripts=pkg?.scripts||[];
      const parts=[];
      if(scripts.length)parts.push('Scripts declarados: '+scripts.join(', '));
      if(Array.isArray(workflows) && workflows.length)parts.push('Workflows encontrados: '+workflows.join(', '));
      const proof=context?.runs?.data;
      if(!parts.length)return {answer:'Scripts e workflows não encontrados ou indisponíveis. Não é possível confirmar testes.',...source('workflows')};
      return {answer:parts.join('; ')+'. A existência desses arquivos não comprova que os testes passaram. Consulte as execuções de CI para verificar SHA e conclusão.',...source(Array.isArray(workflows)&&workflows.length?'workflows':'package')};
    }
    case 'integracao':
      return {answer:'Não há integração automática confirmada. Verifique a documentação pública, identifique o ponto de montagem e escolha um adaptador isolado para este projeto. Preserve IDs, contratos e armazenamento. No Cuidador(a), mantenha somente ajuda documental pública.',...source('readme')};
    case 'prs': {
      const txt=Array.isArray(pulls) ? pulls.slice(0,5).map(p=>'#'+p.number+' '+p.title+' ('+(p.merged_at?'mesclada':p.state==='open'?'aberta':'fechada sem merge confirmado')+')').join('; ') : '';
      return {answer:txt || 'PRs públicas não disponíveis nesta consulta.',...source('pulls')};
    }
    case 'ci': {
      const txt=Array.isArray(runs) ? runs.slice(0,5).map(r=>'Execução '+r.id+': '+(r.conclusion || r.status || 'sem conclusão')+' no commit '+String(r.head_sha || '').slice(0,7)).join('; ') : '';
      return {answer:txt || 'Execuções públicas de CI indisponíveis. Não é possível declarar aprovação.',...source('runs')};
    }
    case 'publicacao':
      return {answer:repo.homepage ? 'O GitHub informa este endereço de apresentação/publicação. Ele ainda exige verificação independente da versão e navegação: '+repo.homepage : 'O repositório não informou uma URL de publicação verificada. Merge e CI não comprovam deploy.',...source('repo')};
    default: return {answer:'Selecione uma pergunta disponível.',...source('repo')};
  }
}
