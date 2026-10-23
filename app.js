(() => {
  const numeroWhatsApp = "5546991402714";
  const carrinho = [];
  const produtos = window.produtosIniciais;

  const elementos = {
    busca: document.getElementById("campoBusca"),
    botaoBuscar: document.getElementById("botaoBuscar"),
    produtos: document.getElementById("produtos"),
    detalhes: document.getElementById("detalheProduto"),
    listaCarrinho: document.getElementById("listaCarrinho"),
    totalCarrinho: document.getElementById("totalCarrinho"),
    quantidadeCarrinho: document.getElementById("carrinhoQtd"),
    popupCarrinho: document.getElementById("popupCarrinho")
  };

  function escaparHtml(valor) {
    return String(valor).replace(/[&<>"']/g, (caractere) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caractere]);
  }

  function urlDeImagemPermitida(valor) {
    try {
      const url = new URL(valor, window.location.href);
      return ["http:", "https:", "file:"].includes(url.protocol);
    } catch {
      return false;
    }
  }

  function formatarPreco(preco) {
    return preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function encontrarProduto(id) {
    return produtos.find((produto) => produto.id === id);
  }

  function criarCardProduto(produto, incluirCompra = true) {
    const card = document.createElement("article");
    card.className = "produto";
    const imagem = produto.imagens.find(urlDeImagemPermitida);

    card.innerHTML = `
      <button class="produto-link" type="button" aria-label="Ver detalhes de ${escaparHtml(produto.nome)}">
        <img src="${imagem ? escaparHtml(imagem) : ""}" alt="${escaparHtml(produto.nome)}">
        <h3>${escaparHtml(produto.nome)}</h3>
      </button>
      <p>${formatarPreco(produto.preco)}</p>
      ${produto.precoEstimado ? '<small class="aviso-preco">Preço estimado</small>' : ""}
      <button class="btn-detalhes" type="button">Ver detalhes</button>
      ${incluirCompra ? '<button class="btn-comprar" type="button">Adicionar ao carrinho</button>' : ""}
    `;

    card.querySelector(".produto-link").addEventListener("click", () => abrirProduto(produto.id));
    card.querySelector(".btn-detalhes").addEventListener("click", () => abrirProduto(produto.id));
    if (incluirCompra) {
      card.querySelector(".btn-comprar").addEventListener("click", () => {
        adicionarAoCarrinho(produto.nome, produto.preco);
      });
    }
    return card;
  }

  function carregarProdutos(lista = produtos) {
    elementos.produtos.replaceChildren(...lista.map((produto) => criarCardProduto(produto)));
  }

  function abrirProduto(id, atualizarEndereco = true) {
    const produto = encontrarProduto(id);
    if (!produto) {
      mostrarCatalogo();
      return;
    }

    const imagens = produto.imagens.filter(urlDeImagemPermitida);
    const relacionados = (produto.relacionados || [])
      .map(encontrarProduto)
      .filter(Boolean);

    elementos.detalhes.innerHTML = `
      <button class="btn-voltar" type="button">← Voltar aos produtos</button>
      <div class="detalhe-conteudo">
        <div class="galeria-produto">
          <img class="foto-principal" src="${imagens.length ? escaparHtml(imagens[0]) : ""}" alt="${escaparHtml(produto.nome)}">
          <div class="miniaturas" aria-label="Outras fotos de ${escaparHtml(produto.nome)}">
            ${imagens.map((imagem, indice) => `
              <button class="miniatura${indice === 0 ? " selecionada" : ""}" type="button" data-imagem="${indice}" aria-label="Ver foto ${indice + 1} de ${escaparHtml(produto.nome)}">
                <img src="${escaparHtml(imagem)}" alt="">
              </button>
            `).join("")}
          </div>
        </div>
        <div class="informacoes-produto">
          <p class="etiqueta-produto">ACESSÓRIO PARA SUA MESA</p>
          <h1>${escaparHtml(produto.nome)}</h1>
          <p class="preco-detalhe">${formatarPreco(produto.preco)}</p>
          ${produto.precoEstimado ? '<p class="aviso-preco">Preço estimado; confirme antes da compra.</p>' : ""}
          <p class="descricao-produto">${escaparHtml(produto.descricao)}</p>
          ${produto.cores ? `
            <div class="selecao-cor" role="radiogroup" aria-label="Escolha a cor">
              <span class="rotulo-cor">Cor desejada</span>
              <div class="opcoes-cores">
                ${produto.cores.map((cor) => `
                  <button class="opcao-cor" type="button" role="radio" aria-checked="false" data-cor="${escaparHtml(cor)}" aria-label="${escaparHtml(cor)}" title="${escaparHtml(cor)}">
                    <span class="amostra-cor cor-${escaparHtml(cor.toLowerCase())}" aria-hidden="true"></span>
                    <span>${escaparHtml(cor)}</span>
                  </button>
                `).join("")}
              </div>
              <small class="aviso-cor">Confirme a disponibilidade da cor antes da compra.</small>
            </div>
          ` : ""}
          <button class="btn-comprar" type="button">Adicionar ao carrinho</button>
        </div>
      </div>
      <section class="relacionados-produto">
        <h2>Você também pode gostar</h2>
        <div class="produtos relacionados-lista"></div>
      </section>
    `;

    elementos.detalhes.querySelector(".btn-voltar").addEventListener("click", mostrarCatalogo);
    let corSelecionada = "";
    elementos.detalhes.querySelectorAll(".opcao-cor").forEach((opcao) => {
      opcao.addEventListener("click", () => {
        corSelecionada = opcao.dataset.cor;
        elementos.detalhes.querySelectorAll(".opcao-cor").forEach((item) => {
          const selecionada = item === opcao;
          item.classList.toggle("selecionada", selecionada);
          item.setAttribute("aria-checked", String(selecionada));
        });
      });
    });
    elementos.detalhes.querySelector(".informacoes-produto .btn-comprar")
      .addEventListener("click", () => adicionarAoCarrinho(produto.nome, produto.preco, corSelecionada));

    elementos.detalhes.querySelectorAll(".miniatura").forEach((miniatura) => {
      miniatura.addEventListener("click", () => {
        elementos.detalhes.querySelector(".foto-principal").src = imagens[Number(miniatura.dataset.imagem)];
        elementos.detalhes.querySelectorAll(".miniatura").forEach((item) => item.classList.remove("selecionada"));
        miniatura.classList.add("selecionada");
      });
    });

    const listaRelacionados = elementos.detalhes.querySelector(".relacionados-lista");
    relacionados.forEach((relacionado) => listaRelacionados.append(criarCardProduto(relacionado, false)));
    elementos.produtos.hidden = true;
    elementos.detalhes.hidden = false;
    if (atualizarEndereco) {
      window.location.hash = `produto-${produto.id}`;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function mostrarCatalogo() {
    window.location.hash = "produtos";
  }

  function renderizarRota() {
    const hash = window.location.hash;
    if (hash.startsWith("#produto-")) {
      abrirProduto(hash.slice("#produto-".length), false);
      return;
    }

    elementos.detalhes.hidden = true;
    elementos.produtos.hidden = false;
    const termo = elementos.busca.value.trim().toLocaleLowerCase("pt-BR");
    carregarProdutos(produtos.filter((produto) => produto.nome.toLocaleLowerCase("pt-BR").includes(termo)));
    if (hash === "#admin") {
      window.location.hash = "produtos";
    }
  }

  function adicionarAoCarrinho(nome, preco, cor = "") {
    carrinho.push({ nome, preco, cor: cor || "Sem preferência" });
    atualizarCarrinho();
  }

  function removerDoCarrinho(indice) {
    carrinho.splice(indice, 1);
    atualizarCarrinho();
  }

  function atualizarCarrinho() {
    elementos.listaCarrinho.replaceChildren();
    let total = 0;
    carrinho.forEach((item, indice) => {
      const linha = document.createElement("li");
      const descricao = document.createElement("span");
      const remover = document.createElement("button");
      descricao.textContent = `${item.nome} (${item.cor}) - ${formatarPreco(item.preco)}`;
      remover.className = "remover";
      remover.type = "button";
      remover.textContent = "x";
      remover.setAttribute("aria-label", `Remover ${item.nome} do carrinho`);
      remover.addEventListener("click", () => removerDoCarrinho(indice));
      linha.append(descricao, remover);
      elementos.listaCarrinho.append(linha);
      total += item.preco;
    });
    elementos.totalCarrinho.textContent = `Total: ${formatarPreco(total)}`;
    elementos.quantidadeCarrinho.textContent = carrinho.length;
  }

  function finalizarCompra() {
    if (carrinho.length === 0) {
      window.alert("Seu carrinho está vazio.");
      return;
    }
    const mensagem = `Olá, gostaria de fazer o seguinte pedido:\n\n${carrinho
      .map((item) => `• ${item.nome} | Cor: ${item.cor} | ${formatarPreco(item.preco)}`)
      .join("\n")}`;
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener");
  }

  elementos.busca.addEventListener("input", renderizarRota);
  elementos.botaoBuscar.addEventListener("click", renderizarRota);
  document.getElementById("botaoCarrinho").addEventListener("click", () => {
    elementos.popupCarrinho.style.display = elementos.popupCarrinho.style.display === "flex" ? "none" : "flex";
  });
  document.getElementById("finalizarCompra").addEventListener("click", finalizarCompra);
  window.addEventListener("hashchange", renderizarRota);

  carregarProdutos();
  renderizarRota();
  atualizarCarrinho();
})();
