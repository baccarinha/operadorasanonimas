import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
// 1. No topo do arquivo, certifique-se de importar o 'ref' e 'uploadBytes'
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

// ... (resto do código de inicialização )

const storage = getStorage(app);

// 2. Use esta função corrigida:
async function uploadArquivo(arquivo) {
    if (!arquivo) return null;

    try {
        const nomeArquivo = `${Date.now()}_${arquivo.name}`;
        
        // CORREÇÃO: No Firebase v12 usamos a função ref() passando o storage e o caminho
        const storageRef = ref(storage, `posts/${nomeArquivo}`);
        
        // CORREÇÃO: Usamos uploadBytes() em vez de put()
        await uploadBytes(storageRef, arquivo);
        
        // Pega a URL final
        const url = await getDownloadURL(storageRef);
        return url;
    } catch (e) {
        console.error("Erro no upload:", e);
        alert("Erro ao enviar arquivo: " + e.message);
        return null;
    }
}


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_UID = "lr2SFMyNrJb4b610BlGIA422u2y1";

let usuarioAtual = null;
let loginDiv, areaPrivada, postsDiv, editor, email, senha;
let unsubscribePosts = null;

document.addEventListener("DOMContentLoaded", () => {
    loginDiv = document.getElementById("login");
    areaPrivada = document.getElementById("areaPrivada");
    postsDiv = document.getElementById("posts");
    editor = document.getElementById("editor");
    email = document.getElementById("email");
    senha = document.getElementById("senha");
});

window.formatar = function(comando) {
    document.execCommand(comando, false, null);
};

window.mudarCor = function(cor) {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("foreColor", false, cor);
};

window.adicionarLink = function() {
    const url = prompt("Digite o link:");
    if (!url) return;
    document.execCommand("createLink", false, url);
};

window.entrar = async function () {
    try {
        const cred = await signInWithEmailAndPassword(auth, email.value, senha.value);
        console.log("LOGADO:", cred.user);
        alert("LOGIN OK");
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
};

window.cadastrar = function () {
    if (senha.value.length < 6) {
        alert("Senha mínima de 6 caracteres");
        return;
    }
    createUserWithEmailAndPassword(auth, email.value, senha.value)
        .catch((e) => {
            console.log(e);
            alert(e.message);
        });
};

onAuthStateChanged(auth, (user) => {
    console.log("USUARIO:", user);
    if (user) {
        usuarioAtual = user;
        loginDiv.style.display = "none";
        areaPrivada.style.display = "block";
        carregarComentarios();
    } else {
        usuarioAtual = null;
        loginDiv.style.display = "block";
        areaPrivada.style.display = "none";
        if (unsubscribePosts) {
            unsubscribePosts();
            unsubscribePosts = null;
        }
    }
});

window.publicar = async function () {
    if (!usuarioAtual) {
        alert("Faça login");
        return;
    }

    // Pega o input de mídia (garantindo que ele existe)
    const inputMidia = document.getElementById("midia");
    const arquivo = inputMidia ? inputMidia.files[0] : null;

    if (!editor || (!editor.textContent.trim() && !arquivo)) {
        alert("Digite algo ou selecione um arquivo");
        return;
    }

    try {
        let urlMidia = null;
        let tipoMidia = null;

        if (arquivo) {
            alert("Enviando arquivo... aguarde.");
            urlMidia = await uploadArquivo(arquivo);
            tipoMidia = arquivo.type;
        }

        await addDoc(collection(db, "posts"), {
            texto: editor.innerHTML,
            midia: urlMidia,
            tipoMidia: tipoMidia,
            email: usuarioAtual.email,
            uid: usuarioAtual.uid,
            criadoEm: serverTimestamp()
        });

        editor.innerHTML = "";
        if (inputMidia) inputMidia.value = ""; // Limpa o campo de arquivo
        alert("Publicado com sucesso!");

    } catch (e) {
        console.error(e);
        alert("Erro ao publicar: " + e.message);
    }
};

// ... (mantenha a função formatarData e carregarComentarios como estão)

// CORREÇÃO NA FUNÇÃO EXCLUIR (Remova a duplicidade)
async function excluirComentario(id) {
    if (confirm("Excluir comentário?")) {
        try {
            await deleteDoc(doc(db, "posts", id));
            // O onSnapshot cuidará de atualizar a tela automaticamente
        } catch (e) {
            console.error(e);
            alert("Erro ao excluir: " + e.message);
        }
    }
}

function formatarData(timestamp) {
    if (!timestamp) return "Data desconhecida";
    const data = timestamp.toDate();
    return data.toLocaleDateString("pt-BR") + " " + data.toLocaleTimeString("pt-BR");
}

function carregarComentarios() {
    const q = query(collection(db, "posts"), orderBy("criadoEm", "desc"));
    unsubscribePosts = onSnapshot(q, (snapshot) => {
        postsDiv.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const post = docSnap.data();
            const div = document.createElement("div");
            div.className = "post";

            // DATA
            const timestampDiv = document.createElement("div");
            timestampDiv.className = "post-timestamp";
            timestampDiv.textContent = formatarData(post.criadoEm);
            div.appendChild(timestampDiv);

            // TEXTO
            const textoDiv = document.createElement("div");
            textoDiv.innerHTML = DOMPurify.sanitize(post.texto);
            div.appendChild(textoDiv);

            // BOTÃO EXCLUIR
            if (usuarioAtual && (usuarioAtual.uid === ADMIN_UID || usuarioAtual.uid === post.uid)) {
                const actionsDiv = document.createElement("div");
                actionsDiv.className = "post-actions";
                const btn = document.createElement("button");
                btn.innerHTML = "🗑️ Excluir";
                btn.onclick = () => excluirComentario(docSnap.id);
                actionsDiv.appendChild(btn);
                div.appendChild(actionsDiv);
            }
            postsDiv.appendChild(div);
        });
    });
}
