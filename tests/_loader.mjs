/* Loader de teste: propaga o cache-busting (?boot=N) do ponto de entrada pra
   toda a árvore de import()/import estático dentro de js/, sem precisar de
   nenhum código especial nos módulos de produção. Sem isso, um módulo
   importado estaticamente (não o ponto de entrada) fica em cache do Node
   entre diferentes boot()s no mesmo processo de teste, vazando estado (ex:
   um "session" de uma janela de teste aparecendo em outra). */
export async function resolve(specifier, context, nextResolve){
  const resultado = await nextResolve(specifier, context);
  if(!resultado.url.includes('/js/') || resultado.url.includes('?boot=')) return resultado;
  const pai = context.parentURL || '';
  const m = pai.match(/[?&]boot=(\d+)/);
  if(!m) return resultado;
  const sep = resultado.url.includes('?') ? '&' : '?';
  return Object.assign({}, resultado, {url: resultado.url + sep + 'boot=' + m[1]});
}
