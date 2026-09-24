// =========================================================
// GUARDA DE ACESSO DA ÁREA DO COMERCIANTE
// =========================================================
// Compartilhado por TODAS as páginas da área do comerciante
// (inicio_comerciante.html, chat_comerciante.html, marketing_comerciante.html,
// perfil_comerciante.html, cadastro-loja.html e produto-novo.html).
//
// Cada uma dessas páginas carrega este arquivo ANTES do seu
// próprio script (<script src="js/comerciante-guard.js"> vem primeiro
// no HTML). Ele decide, antes de mais nada, se quem está acessando
// pode ver a página:
//
//   1. Ninguém logado               -> volta para o login.
//   2. Logado, mas conta "cliente"  -> volta para a home (a área
//                                       do comerciante é restrita a
//                                       contas de comerciante).
//   3. Logado como "comerciante"    -> pode continuar; a sessão
//                                       fica disponível em
//                                       window.comercianteSession para
//                                       o script da própria página
//                                       usar, sem precisar ler o
//                                       localStorage de novo.
//
// Observação: como não existe backend, isso é só uma checagem no
// próprio navegador — não é uma segurança real (dá para editar o
// localStorage manualmente e "burlar" essa checagem). Serve para
// a navegação normal do protótipo, não para proteger dados.
// =========================================================

// =========================================================
// FUNÇÃO GLOBAL SEGURA DE PRESENÇA (TOPO! NUNCA MAIS undefined!)
// =========================================================
// Ela é definida AQUI NO TOPO, ANTES de qualquer uso! Com o padrão
// "if (!exist) define", cada arquivo JS que roda depois garante a
// existência dela, SEMPRE — independente da ordem de carregamento
// dos scripts. Elimina o "TypeError: window.safePresenceFetch is
// not a function" de vez!
//
// Tem:
//   • URL absoluta (evita problemas de porta diferente)
//   • Timeout de 5s via AbortController → aborta ANTES do Chrome
//     disparar "net::ERR_ABORTED" na aba Network
//   • Catch 100% seguro → nunca joga erro para cima
// =========================================================
if (typeof window.safePresenceFetch !== "function") {
    window.safePresenceFetch = async function safePresenceFetch(postBody = null) {
        try {
            if (window.location.protocol === "file:") return null;
            const base = window.location.origin || "http://localhost:3000";
            const url = `${base}/api/presence`;
            const ctrl = new AbortController();
            const tempoMax = setTimeout(() => ctrl.abort(), 5000);
            const options = { cache: "no-store", signal: ctrl.signal };
            if (postBody) {
                options.method = "POST";
                options.headers = { "Content-Type": "application/json" };
                options.body = JSON.stringify(postBody);
            } else {
                options.method = "GET";
            }
            const res = await fetch(url, options);
            clearTimeout(tempoMax);
            if (!res.ok) return null;
            return await res.json();
        } catch (_) {
            return null;
        }
    };
}

window.comercianteSession = JSON.parse(
    localStorage.getItem("modaCenterSession") || "null"
);

if (!window.comercianteSession) {

    // Ninguém logado: manda para a home e já abre o formulário de login.
    window.location.href = "index.html?login=1";

} else if (window.comercianteSession.profile !== "comerciante") {

    // Logado, mas com conta de cliente: sem acesso à área do comerciante.
    window.location.href = "index.html?area=comerciante";

} else if (window.location.protocol !== "file:") {
    const updateMerchantPresence = (status = "online") => window.safePresenceFetch({
        userId: window.comercianteSession.id,
        status
    });
    updateMerchantPresence();
    window.setInterval(() => updateMerchantPresence(), 15000);
    window.addEventListener("pagehide", () => updateMerchantPresence("offline"));
}
