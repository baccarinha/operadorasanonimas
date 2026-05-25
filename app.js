import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    deleteDoc, 
    doc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBKG2loEWbCRHgWYDdcCBe2n0P6guWJScQ",
    authDomain: "operadorasanonimas-32d29.firebaseapp.com",
    projectId: "operadorasanonimas-32d29",
    storageBucket: "operadorasanonimas-32d29.firebasestorage.app",
    messagingSenderId: "1056988174739",
    appId: "1:1056988174739:web:f5b4bdc6a1421436937066"
};


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

    if (!editor || !editor.textContent.trim()) {
        alert("Digite algo");
        return;
    }

    try {
        await addDoc(collection(db, "posts"), {
            texto: editor.innerHTML,
            email: usuarioAtual.email,
            uid: usuarioAtual.uid,
            criadoEm: serverTimestamp()
        });
        editor.innerHTML = "";
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
};

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

async function excluirComentario(id) {
    if (confirm("Excluir comentário?")) {
        try {
            await deleteDoc(doc(db, "posts", id));
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    }
}
