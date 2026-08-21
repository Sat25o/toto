# Diagnóstico do Ícone da Aplicação

- O manifesto, favicon e ícone Apple referenciam atualmente `/manus-storage/liga-toto-talho-app-icon-cristal_c10d8411.png`.
- Esse ficheiro contém um ícone de troféu azul, não a lata Cristal aprovada.
- A lata Cristal aprovada está disponível em `/home/ubuntu/webdev-static-assets/liga-toto-talho-app-icon-cristal.png` e será carregada para uma nova referência versionada, evitando que instalações existentes reutilizem a imagem anterior em cache.
- Após a criação do checkpoint da correção, a primeira consulta aos dois domínios públicos ainda devolveu o manifesto anterior. É necessária nova verificação após a propagação da publicação antes de orientar os utilizadores a reinstalar a app.
- A publicação foi posteriormente confirmada com o caminho novo da lata Cristal. O problema restante é específico do WebAPK/launcher Android: o Chrome verifica o manifesto em intervalos e atualiza o WebAPK quando a app está fechada, o telemóvel está ligado ao carregador e em Wi-Fi. Uma configuração com ícones explícitos de 192 px e 512 px, finalidade `any` e `maskable`, e uma nova identidade de instalação evita a reutilização do atalho anterior.

Fontes consultadas: https://web.dev/articles/manifest-updates e https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons
