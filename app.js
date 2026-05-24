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
  authDomain: "operadorasanonimas.firebaseapp.com",
  projectId: "operadorasanonimas",
  storageBucket: "operadorasanonimas.firebasestorage.app",
  messagingSenderId: "1056988174739",
  appId: "1:1056988174739:web:f5b4bdc6a1421436937066"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let usuarioAtual = null;

const loginDiv = document.getElementById("login");
const areaPrivada = document.getElementById("areaPrivada");
const postsDiv = document.getElementById("posts");
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const comentario = document.getElementById("comentario");

window.entrar = function () {
  signInWithEmailAndPassword(
    auth,
    email.value,
    senha.value
  ).catch(() => alert("Email ou senha inválidos"));
};

window.cadastrar = function () {
  if (senha.value.length < 6) {
    alert("Senha mínima de 6 caracteres");
    return;
  }

  createUserWithEmailAndPassword(auth, email.value, senha.value)
    .catch(e => {
      if (e.code === "auth/email-already-in-use") {
        alert("Email já cadastrado");
      } else {
        alert("Erro ao cadastrar");
      }
    });
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    usuarioAtual = user;
    loginDiv.style.display = "none";
    areaPrivada.style.display = "block";
    carregarComentarios();
  } else {
    usuarioAtual = null;
    loginDiv.style.display = "block";
    areaPrivada.style.display = "none";
  }
});

window.publicar = async function () {
  if (!comentario.value.trim()) return;

  await addDoc(collection(db, "posts"), {
    texto: comentario.value,
    email: usuarioAtual.email,
    uid: usuarioAtual.uid,
    criadoEm: serverTimestamp()
  });

  comentario.value = "";
};

function formatarData(timestamp) {
  if (!timestamp) return "Data desconhecida";
  const data = timestamp.toDate();
  return data.toLocaleDateString("pt-BR") + " " + data.toLocaleTimeString("pt-BR");
}

function carregarComentarios() {
  unsubscribe = carregarComentarios();
}
return onSnapshot(q, (snapshot) => {
  
    const postsDiv = document.getElementById("posts");

    postsDiv.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const div = document.createElement("div");
      div.className = "post";

      // Exibir timestamp formatado
      const timestampDiv = document.createElement("div");
      timestampDiv.className = "post-timestamp";
      timestampDiv.textContent = formatarData(post.criadoEm);
      div.appendChild(timestampDiv);

      // Exibir apenas o texto do post (SEM EMAIL)
      const textoDiv = document.createElement("div");
      textoDiv.textContent = post.texto;
      div.appendChild(textoDiv);

      // Botão de exclusão apenas para o proprietário do post
      if (usuarioAtual.uid === post.uid) {
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "post-actions";

        const btn = document.createElement("button");
        btn.textContent = "🗑️ Excluir";
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
    await deleteDoc(doc(db, "posts", id));
  }
}
