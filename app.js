// Função auxiliar para atualizar documento (necessária para a otimização 5)
import { updateDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

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
const storage = getStorage(app);
const ADMIN_UID = "lr2SFMyNrJb4b610BlGIA422u2y1";

let usuarioAtual = null;
let loginDiv, areaPrivada, postsDiv, editor, email, senha;
let unsubscribePosts = null;

// ============================================
// OTIMIZAÇÕES DE UPLOAD
// ============================================

// Cache de blobs comprimidos em memória (para retry rápido)
const compressedBlobCache = new Map();

// Função para detectar suporte a WebP
async function supportsWebP() {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => resolve(webP.height === 2);
    webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVkA4IC4AAAA8AwCdASoBAAEALmMolmY1AAAA";
  });
}

// Função otimizada de compressão com qualidade adaptativa
async function comprimirImagemOtimizado(arquivo) {
  return new Promise(async (resolve) => {
    // Se não for imagem, retorna o arquivo original
    if (!arquivo.type.startsWith("image/")) {
      resolve(arquivo);
      return;
    }

    // Verifica cache
    const cacheKey = `${arquivo.name}_${arquivo.size}`;
    if (compressedBlobCache.has(cacheKey)) {
      console.log("✓ Blob comprimido recuperado do cache");
      resolve(compressedBlobCache.get(cacheKey));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(arquivo);

    reader.onload = async (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Redimensiona para no máximo 1200px mantendo proporção
        const maxWidth = 1200;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // OTIMIZAÇÃO 1: Qualidade adaptativa baseada no tamanho original
        let qualidade = 0.7; // padrão
        const sizeMB = arquivo.size / (1024 * 1024);

        if (sizeMB < 1) {
          qualidade = 0.8; // Imagens pequenas: melhor qualidade
        } else if (sizeMB > 5) {
          qualidade = 0.6; // Imagens grandes: mais compressão
        }

        // OTIMIZAÇÃO 2: Suporte a WebP com fallback
        const suportaWebP = await supportsWebP();
        const formato = suportaWebP ? "image/webp" : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            // Cria arquivo comprimido
            const arquivoComprimido = new File([blob], arquivo.name, {
              type: formato
            });

            // Armazena no cache
            compressedBlobCache.set(cacheKey, arquivoComprimido);

            const tamanhoOriginal = (arquivo.size / 1024).toFixed(2);
            const tamanhoComprimido = (arquivoComprimido.size / 1024).toFixed(2);
            const reducao = (((arquivo.size - arquivoComprimido.size) / arquivo.size) * 100).toFixed(1);

            console.log(
              `📦 Imagem comprimida: ${tamanhoOriginal}KB → ${tamanhoComprimido}KB (${reducao}% redução) [${formato}]`
            );

            resolve(arquivoComprimido);
          },
          formato,
          qualidade
        );
      };
    };
  });
}

// OTIMIZAÇÃO 3: Retry automático com backoff exponencial
async function uploadArquivoComRetry(arquivo, maxTentativas = 3) {
  if (!arquivo) return null;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      // Comprime imagem se for imagem
      let arquivoParaEnviar = arquivo;
      if (arquivo.type.startsWith("image/")) {
        arquivoParaEnviar = await comprimirImagemOtimizado(arquivo);
      }

      const nomeArquivo = `${Date.now()}_${arquivo.name}`;
      const storageRef = ref(storage, `posts/${nomeArquivo}`);

      console.log(`⬆️ Upload tentativa ${tentativa}/${maxTentativas}...`);

      // OTIMIZAÇÃO 4: Mede tempo de upload
      const inicioUpload = performance.now();
      await uploadBytes(storageRef, arquivoParaEnviar);
      const tempoUpload = (performance.now() - inicioUpload).toFixed(0);

      console.log(`✓ Upload concluído em ${tempoUpload}ms`);

      // OTIMIZAÇÃO 5: Paralelização - não aguarda URL antes de salvar no Firestore
      const urlPromise = getDownloadURL(storageRef);

      return {
        urlPromise, // Promise que será resolvida depois
        tipo: arquivo.type,
        nomeArquivo
      };
    } catch (e) {
      console.error(`❌ Tentativa ${tentativa} falhou:`, e.message);

      if (tentativa < maxTentativas) {
        // Backoff exponencial: 1s, 2s, 4s
        const delayMs = Math.pow(2, tentativa - 1) * 1000;
        console.log(`⏳ Aguardando ${delayMs}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        console.error("Erro no upload após todas as tentativas:", e);
        alert("Erro ao enviar arquivo após 3 tentativas: " + e.message);
        return null;
      }
    }
  }
}

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

// OTIMIZAÇÃO 6: Publicação otimizada com feedback de progresso
window.publicar = async function () {
  if (!usuarioAtual) {
    alert("Faça login");
    return;
  }

  const btnPublicar = document.querySelector("button[onclick='publicar()']");
  const inputMidia = document.getElementById("midia");
  const arquivo = inputMidia ? inputMidia.files[0] : null;

  if (!editor || (!editor.textContent.trim() && !arquivo)) {
    alert("Digite algo ou selecione um arquivo");
    return;
  }

  try {
    // Desativa o botão e muda o texto para dar feedback visual
    btnPublicar.disabled = true;
    btnPublicar.textContent = "Processando... aguarde";
    btnPublicar.style.opacity = "0.6";

    const inicioTotal = performance.now();
    let urlMidia = null;
    let tipoMidia = null;
    let uploadResult = null;

    if (arquivo) {
      // Upload com retry automático
      uploadResult = await uploadArquivoComRetry(arquivo);
      if (!uploadResult) {
        throw new Error("Falha no upload após todas as tentativas");
      }
      tipoMidia = arquivo.type;
    }

    // OTIMIZAÇÃO 5: Salva no Firestore enquanto aguarda URL
    btnPublicar.textContent = "Salvando...";

    const docRef = await addDoc(collection(db, "posts"), {
      texto: editor.innerHTML,
      midia: uploadResult ? "pending" : null, // Marcador temporário
      tipoMidia: tipoMidia,
      email: usuarioAtual.email,
      uid: usuarioAtual.uid,
      criadoEm: serverTimestamp(),
      nomeArquivo: uploadResult ? uploadResult.nomeArquivo : null
    });

    // Se houver upload, aguarda URL e atualiza documento
    if (uploadResult) {
      btnPublicar.textContent = "Finalizando...";
      urlMidia = await uploadResult.urlPromise;

      // Atualiza documento com URL real
      await updateDoc(doc(db, "posts", docRef.id), {
        midia: urlMidia
      });
    }

    editor.innerHTML = "";
    if (inputMidia) inputMidia.value = "";

    const tempoTotal = (performance.now() - inicioTotal).toFixed(0);
    console.log(`🎉 Publicado com sucesso em ${tempoTotal}ms!`);

  } catch (e) {
    console.error(e);
    alert("Erro ao publicar: " + e.message);
  } finally {
    // Reativa o botão
    btnPublicar.disabled = false;
    btnPublicar.textContent = "Publicar";
    btnPublicar.style.opacity = "1";
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
      if (post.texto && post.texto.trim() !== "") {
        const textoDiv = document.createElement("div");
        textoDiv.innerHTML = DOMPurify.sanitize(post.texto);
        div.appendChild(textoDiv);
      }

      // MÍDIA
      if (post.midia && post.midia !== "pending") {
        if (post.tipoMidia && post.tipoMidia.startsWith("image/")) {
          const img = document.createElement("img");
          img.src = post.midia;
          img.style.maxWidth = "100%";
          img.style.borderRadius = "12px";
          img.style.marginTop = "10px";
          div.appendChild(img);
        } else if (post.tipoMidia && post.tipoMidia.startsWith("video/")) {
          const video = document.createElement("video");
          video.src = post.midia;
          video.controls = true;
          video.style.maxWidth = "100%";
          video.style.borderRadius = "12px";
          video.style.marginTop = "10px";
          div.appendChild(video);
        } else if (post.tipoMidia && post.tipoMidia.startsWith("audio/")) {
          const audio = document.createElement("audio");
          audio.src = post.midia;
          audio.controls = true;
          audio.style.marginTop = "10px";
          div.appendChild(audio);
        }
      }

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
      alert("Erro ao excluir: " + e.message);
    }
  }
}

