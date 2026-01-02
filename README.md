# 💀 Rotina de Operadoras de Caixa Anônimas

## 🌟 Visão Geral do Projeto

Este projeto é uma aplicação web simples, desenvolvida em **HTML, CSS e JavaScript puro**, que simula uma plataforma de compartilhamento de rotinas e experiências. O tema central é focado em **Operadoras de Caixa Anônimas**, sugerindo um espaço seguro e privado para a troca de informações e desabafos.

A aplicação utiliza o **Firebase** para gerenciar a autenticação de usuários e o armazenamento de dados em tempo real (Firestore), criando uma experiência de feed de notícias dinâmico.

## ✨ Funcionalidades Principais

O sistema oferece as seguintes funcionalidades para os usuários:

| Funcionalidade | Descrição |
| :--- | :--- |
| **Autenticação** | Permite o cadastro de novos usuários e o login através de e-mail e senha. |
| **Feed em Tempo Real** | Exibe uma lista de posts (comentários) em ordem cronológica inversa, atualizada em tempo real via **Firestore**. |
| **Publicação de Conteúdo** | Usuários autenticados podem escrever e publicar textos sobre suas rotinas. |
| **Exclusão de Posts** | Cada usuário pode excluir apenas os seus próprios posts, garantindo o controle sobre o conteúdo publicado. |
| **Interface Temática** | Design com tema escuro (Dark Mode) e elementos visuais em estilo **Neon** e animações (caveira pulsante). |

## 🛠️ Tecnologias Utilizadas

O projeto é um exemplo de aplicação *Single Page Application* (SPA) que utiliza uma combinação de tecnologias front-end e serviços *Backend as a Service* (BaaS).

| Categoria | Tecnologia | Uso no Projeto |
| :--- | :--- | :--- |
| **Estrutura** | HTML5 | Estrutura básica da página. |
| **Estilização** | CSS3 | Estilos responsivos e tema Dark/Neon. |
| **Lógica** | JavaScript (ES Modules) | Manipulação do DOM e lógica de interação com o Firebase. |
| **Autenticação** | Firebase Auth | Gerenciamento de login e cadastro de usuários. |
| **Banco de Dados** | Firebase Firestore | Armazenamento e sincronização em tempo real dos posts. |

## 🚀 Configuração e Execução

Para rodar este projeto localmente, você precisará de um navegador web moderno.

### 1. Clonar o Repositório

Como o código está em um único arquivo `index.html` (ou similar), basta salvar o conteúdo em um arquivo e abri-lo diretamente no seu navegador.

### 2. Configuração do Firebase (Obrigatório)

O projeto está configurado para se conectar a um projeto Firebase específico. **Para que a aplicação funcione corretamente, você deve substituir as credenciais do Firebase pelas suas próprias.**

1.  Crie um novo projeto no [Console do Firebase](https://console.firebase.google.com/).
2.  Habilite o **Firebase Authentication** (método E-mail/Senha).
3.  Crie um banco de dados **Firestore** e inicie-o no modo de produção (ou teste, se preferir).
4.  Registre um novo aplicativo web no seu projeto Firebase para obter o objeto `firebaseConfig`.
5.  Substitua o objeto `firebaseConfig` no código (linhas 193-200) pelas suas credenciais:

```javascript
  const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_AUTH_DOMAIN_AQUI",
    projectId: "SEU_PROJECT_ID_AQUI",
    storageBucket: "SEU_STORAGE_BUCKET_AQUI",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID_AQUI",
    appId: "SEU_APP_ID_AQUI"
  };
```

## ⚠️ Pontos de Atenção e Segurança

É fundamental destacar alguns pontos críticos, especialmente relacionados à segurança e à funcionalidade:

### 1. Exposição da Chave API (Crítico)

A `apiKey` do Firebase está **exposta diretamente no código-fonte** do arquivo HTML. Em um ambiente de produção, isso é uma prática de segurança **altamente desaconselhada**.

> **Recomendação:** Para aplicações mais robustas, utilize um *backend* próprio ou funções *serverless* (como **Firebase Functions**) para interagir com o banco de dados, mantendo a chave API e outras credenciais sensíveis fora do código do cliente.

### 2. Anonimato Comprometido

Apesar do título sugerir "Operadoras de Caixa Anônimas", o código exibe o `post.email` do usuário que publicou o comentário (linha 277).

> **Recomendação:** Para garantir o anonimato, o campo `email` não deve ser exibido. Uma solução seria utilizar um nome de usuário genérico ou um identificador anônimo (ex: "Usuário 123") no lugar do e-mail.

### 3. Funcionalidade de Mídia Incompleta

O HTML possui um campo de upload de arquivo (`<input type="file" id="midia">`), mas a função `publicar()` (linhas 249-260) **não implementa a lógica de upload** para o Firebase Storage.

> **Recomendação:** Implementar a lógica de upload de arquivos utilizando o **Firebase Storage** e, em seguida, salvar a URL da mídia no documento do Firestore junto com o texto do comentário.

## ✍️ Contribuição

Sinta-se à vontade para inspecionar o código, sugerir melhorias ou implementar as funcionalidades pendentes.

---
*README.md gerado por **Manus AI**.*
