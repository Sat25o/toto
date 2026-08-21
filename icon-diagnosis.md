# Diagnóstico do Ícone da Aplicação

- O manifesto, favicon e ícone Apple referenciam atualmente `/manus-storage/liga-toto-talho-app-icon-cristal_c10d8411.png`.
- Esse ficheiro contém um ícone de troféu azul, não a lata Cristal aprovada.
- A lata Cristal aprovada está disponível em `/home/ubuntu/webdev-static-assets/liga-toto-talho-app-icon-cristal.png` e será carregada para uma nova referência versionada, evitando que instalações existentes reutilizem a imagem anterior em cache.
- Após a criação do checkpoint da correção, a primeira consulta aos dois domínios públicos ainda devolveu o manifesto anterior. É necessária nova verificação após a propagação da publicação antes de orientar os utilizadores a reinstalar a app.
