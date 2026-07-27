/* -------------------------------------------------------------------------
   ARMAZENAMENTO, VERSIONAMENTO E FORMATO DE BACKUP
   ------------------------------------------------------------------------- */
const DB_NAME = 'meutreino', STORE = 'kv';
let dbPromise = null, dbBroken = false;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if(!('indexedDB' in window)) return reject(new Error('sem indexedDB'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch(err => { dbBroken = true; throw err; });
  return dbPromise;
}

const Store = {
  async get(key){
    try{
      if(dbBroken) throw new Error('fallback');
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const r = tx.objectStore(STORE).get(key);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    }catch(e){
      try{ const raw = localStorage.getItem('mt_' + key); return raw ? JSON.parse(raw) : undefined; }
      catch(e2){ return undefined; }
    }
  },
  async set(key, value){
    let ok = false;
    try{
      if(dbBroken) throw new Error('fallback');
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      ok = true;
    }catch(e){ /* cai para o localStorage */ }
    try{ localStorage.setItem('mt_' + key, JSON.stringify(value)); ok = true; }catch(e2){ /* cota cheia */ }
    return ok;
  },
  async del(key){
    try{
      if(!dbBroken){
        const db = await openDB();
        await new Promise(resolve => {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).delete(key);
          tx.oncomplete = resolve; tx.onerror = resolve;
        });
      }
    }catch(e){ /* ignora */ }
    try{ localStorage.removeItem('mt_' + key); }catch(e2){ /* ignora */ }
  }
};

/* -------------------------------------------------------------------------
   VERSIONAMENTO DOS DADOS
   schemaVersion fica gravado no Store. Cada salto de versao tem uma funcao
   em MIGRACOES que recebe o objeto com todas as chaves de dados e devolve
   o objeto migrado. Se uma migracao falhar, os dados originais nao sao
   tocados: uma copia bruta vai para a chave de resgate antes de qualquer
   escrita, e a pessoa e avisada que existe uma copia recuperavel.
   ------------------------------------------------------------------------- */
const SCHEMA_VERSION = 1;
const CHAVES_DADOS = ['history', 'profile', 'corpo', 'overrides', 'custom_ex', 'program', 'favoritos', 'settings', 'avatar'];

const MIGRACOES = {
  // de "sem versao" (quem instalou antes deste recurso existir) para 1:
  // so passa a registrar a versao, o formato dos dados em si nao muda
  1: async dados => dados
};

async function lerDadosBrutos(){
  const entradas = await Promise.all(CHAVES_DADOS.map(k => Store.get(k)));
  const dados = {};
  CHAVES_DADOS.forEach((k, i) => { dados[k] = entradas[i]; });
  return dados;
}

async function migrarDados(alvoVersao){
  alvoVersao = alvoVersao || SCHEMA_VERSION;
  let versaoAtual = await Store.get('schemaVersion');
  if(typeof versaoAtual !== 'number') versaoAtual = 0;
  if(versaoAtual >= alvoVersao) return {ok: true, versao: versaoAtual};

  const bruto = await lerDadosBrutos();
  await Store.set('resgate_dados', {versaoOrigem: versaoAtual, quando: new Date().toISOString(), dados: bruto});

  try{
    let dados = bruto;
    for(let v = versaoAtual + 1; v <= alvoVersao; v++){
      const passo = MIGRACOES[v];
      if(passo) dados = await passo(dados);
    }
    await Promise.all(CHAVES_DADOS.map(k => dados[k] !== undefined ? Store.set(k, dados[k]) : Promise.resolve()));
    await Store.set('schemaVersion', alvoVersao);
    await Store.del('resgate_dados');
    return {ok: true, versao: alvoVersao};
  }catch(e){
    return {ok: false, erro: e, versaoOrigem: versaoAtual};
  }
}

/* -------------------------------------------------------------------------
   FORMATO DE BACKUP
   Só a forma do payload e a leitura do arquivo. Aplicar os dados restaurados
   de volta no app (reatribuir as variáveis de estado, re-renderizar) é
   responsabilidade de quem chama, porque isso depende do estado vivo do app.
   ------------------------------------------------------------------------- */
function construirPayloadBackup(estado){
  return {
    app: 'meu-treino', version: 4, exportedAt: new Date().toISOString(),
    history: estado.history, overrides: estado.overrides, customEx: estado.customEx,
    profile: estado.profile, corpo: estado.corpo, program: estado.program, favoritos: estado.favoritos,
    avatar: estado.avatar
  };
}

function baixarJSON(payload, nomeArquivo){
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function lerArquivoBackup(file){
  let data;
  try{ data = JSON.parse(await file.text()); }
  catch(e){ return {ok: false, motivo: 'invalido'}; }
  if(!data || !Array.isArray(data.history)) return {ok: false, motivo: 'sem_historico'};
  return {ok: true, data: data};
}

export { Store, dbBroken, SCHEMA_VERSION, MIGRACOES, migrarDados, lerDadosBrutos, construirPayloadBackup, baixarJSON, lerArquivoBackup };
