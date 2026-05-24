import {
  initializeApp
}

from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
}

from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

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
}

from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig= {
  apiKey: "AIzaSyBKG2loEWbCRHgWYDdcCBe2n0P6guWJScQ",
    authDomain: "operadorasanonimas.firebaseapp.com",
    projectId: "operadorasanonimas",
    storageBucket: "operadorasanonimas.firebasestorage.app",
    messagingSenderId: "1056988174739",
    appId: "1:1056988174739:web:f5b4bdc6a1421436937066"
}

;

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);

const ADMIN_UID="lr2SFMyNrJb4b610BlGIA422u2y1";

let usuarioAtual=null;

const loginDiv=document.getElementById("login");
const areaPrivada=document.getElementById("areaPrivada");
const postsDiv=document.getElementById("posts");

const email=document.getElementById("email");
const senha=document.getElementById("senha");
const editor=document.getElementById("editor");

window.formatar = function(comando) {

  document.execCommand(comando, false, null);

};

window.mudarCor = function(cor) {

  document.execCommand(
    "foreColor",
    false,
    cor
  );

};

window.adicionarLink = function() {

  const url = prompt("Digite o link:");

  if(url){

    document.execCommand(
      "createLink",
      false,
      url
    );

  }

};
window.entrar=function () {

  signInWithEmailAndPassword(auth,
    email.value,
    senha.value) .catch((e)=> {

      console.log(e);

      alert(e.message);

    });

}

;

window.cadastrar=function () {

  if (senha.value.length < 6) {

    alert("Senha mínima de 6 caracteres");

    return;

  }

  createUserWithEmailAndPassword(auth,
    email.value,
    senha.value) .catch((e)=> {

      console.log(e);

      alert(e.message);

    });

}

;

onAuthStateChanged(auth, (user)=> {

    if (user) {

      usuarioAtual=user;

      loginDiv.style.display="none";

      areaPrivada.style.display="block";

      carregarComentarios();

    }

    else {

      usuarioAtual=null;

      loginDiv.style.display="block";

      areaPrivada.style.display="none";

    }

  });

window.publicar=async function () {

  if ( !editor.innerHTML.trim()) return;

  await addDoc(collection(db, "posts"), {

    texto: editor.innerHTML,
    email: usuarioAtual.email,
    uid: usuarioAtual.uid,
    criadoEm: serverTimestamp()
  });

editor.innerHTML="";
}

;

function formatarData(timestamp) {

  if ( !timestamp) return "Data desconhecida";

  const data=timestamp.toDate();

  return data.toLocaleDateString("pt-BR")+" "+data.toLocaleTimeString("pt-BR");

}

function carregarComentarios() {

  const q=query(collection(db, "posts"),
    orderBy("criadoEm", "desc"));

  onSnapshot(q, (snapshot)=> {

      postsDiv.innerHTML="";

      snapshot.forEach((docSnap)=> {

          const post=docSnap.data();

          const div=document.createElement("div");

          div.className="post";

          // DATA
          const timestampDiv=document.createElement("div");

          timestampDiv.className="post-timestamp";

          timestampDiv.textContent=formatarData(post.criadoEm);

          div.appendChild(timestampDiv);

          // TEXTO
          const textoDiv=document.createElement("div");

          textoDiv.innerHTML=DOMPurify.sanitize(post.texto);

          div.appendChild(textoDiv);

          // BOTÃO EXCLUIR
          if (usuarioAtual.uid===ADMIN_UID || usuarioAtual.uid===post.uid) {

            const actionsDiv=document.createElement("div");

            actionsDiv.className="post-actions";

            const btn=document.createElement("button");

            btn.innerHTML="🗑️ Excluir";

            btn.onclick=()=> excluirComentario(docSnap.id);

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
