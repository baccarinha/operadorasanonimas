// Simulação de Login
window.entrar = function() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    if (email && senha) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('private-area').style.display = 'block';
        console.log("Usuário logado:", email);
    }
};

// Funções do Editor de Texto
window.formatar = (comando) => {
    document.execCommand(comando, false, null);
    document.getElementById('editor').focus();
};

window.mudarCor = (cor) => {
    document.execCommand('foreColor', false, cor);
};

window.adicionarLink = () => {
    const url = prompt("Digite o link (ex: https://... ):");
    if (url) document.execCommand('createLink', false, url);
};

// Lógica de Mídia (Foto/Vídeo)
const midiaInput = document.getElementById('midia');
const previewArea = document.getElementById('preview-area');
let midiaData = { url: null, type: null };

midiaInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        midiaData.url = URL.createObjectURL(file);
        midiaData.type = file.type;
        
        previewArea.innerHTML = midiaData.type.startsWith('image/') 
            ? `<img src="${midiaData.url}" style="max-width:100%; border-radius:8px; margin-top:10px;">` 
            : `<video src="${midiaData.url}" controls style="max-width:100%; border-radius:8px; margin-top:10px;"></video>`;
    }
});

// Função de Publicar
window.publicar = function() {
    const editor = document.getElementById('editor');
    const postsList = document.getElementById('posts-list');
    
    // Sanitização para segurança contra ataques XSS
    const htmlSeguro = DOMPurify.sanitize(editor.innerHTML);
    
    if (htmlSeguro.trim() === "" && !midiaData.url) {
        alert("Por favor, escreva algo ou adicione uma mídia.");
        return;
    }

    // Criando o elemento <article> para o post (Semântica HTML5)
    const postArticle = document.createElement('article');
    postArticle.className = 'post';
    
    let conteudoPost = `<div class="post-text">${htmlSeguro}</div>`;
    
    if (midiaData.url) {
        conteudoPost += `<div class="post-media">`;
        conteudoPost += midiaData.type.startsWith('image/') 
            ? `<img src="${midiaData.url}">` 
            : `<video src="${midiaData.url}" controls></video>`;
        conteudoPost += `</div>`;
    }
    
    conteudoPost += `<time class="post-time">Publicado em: ${new Date().toLocaleString('pt-BR')}</time>`;
    
    postArticle.innerHTML = conteudoPost;
    postsList.prepend(postArticle);

    // Resetar o editor
    editor.innerHTML = '';
    previewArea.innerHTML = '';
    midiaData = { url: null, type: null };
    midiaInput.value = '';
};
