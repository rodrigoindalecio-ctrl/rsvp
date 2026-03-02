# 📸 Guia: Editor de Imagem de Capa

## O que foi melhorado?

A seção de **Imagem de Capa** nas Configurações agora possui um editor profissional com múltiplas opções de ajuste:

### ✨ Novas Funcionalidades:

1. **Upload Aprimorado**
   - Drag-and-drop: arraste a imagem direto para a área
   - Interface visual e intuitiva
   - Limite de 5MB por arquivo

2. **Modal de Recorte Profissional**
   - Abre automaticamente após selecionar imagem
   - Grade de composição (regra dos terços) para melhor enquadramento
   - Múltiplos controles de ajuste

3. **Controles de Ajuste**
   - **Posição Horizontal**: Move a imagem esquerda/direita (0-100%)
   - **Posição Vertical**: Move a imagem cima/baixo (0-100%)
   - **Zoom**: Amplia ou reduz a imagem (0.5x - 3x)
   - **Rotação**: Gira a imagem (0-360°)

4. **Ações Rápidas**
   - 🔄 **Resetar**: Volta para configurações padrão (centro, 1x zoom, 0° rotação)
   - 🔄 **Girar 90°**: Rotaciona instantaneamente em 90 graus

5. **Botões de Edição**
   - ✏️ **Editar**: Abre o modal novamente para ajustar imagem já carregada
   - 🗑️ **Remover**: Remove a imagem completamente

---

## 📋 Passo a Passo

### **1. Acessar Editor**
1. Vá para **Configurações** (⚙️ no canto superior)
2. Procure por **"Imagem de Capa"**
3. Escolha entre **URL** ou **Upload**

### **2. Fazer Upload da Imagem**

#### Opção A: Drag-and-Drop
1. Encontre sua imagem no computador
2. Arraste-a para a área cinza com tracejado rosa
3. Modal de recorte abrirá automaticamente

#### Opção B: Clique para Selecionar
1. Clique na área cinza
2. Selecione a imagem na janela de arquivo

### **3. Recortar e Ajustar**

No modal que aparece:

```
┌─────────────────────────────────────┐
│  Recortar Imagem                [X] │
├─────────────────────────────────────┤
│                                     │
│   [  Pré-visualização da Imagem  ]  │
│   com Grade de Composição (3x3)     │
│                                     │
├─────────────────────────────────────┤
│ Posição Horizontal: ▬▬▬▬  50%       │
│ Posição Vertical:   ▬▬▬▬  50%       │
│ Zoom:               ▬▬▬▬  1.0x      │
│ Rotação:            ▬▬▬▬  0°        │
│                                     │
│ [↺ Resetar] [🔄 Girar 90°]         │
├─────────────────────────────────────┤
│ [Cancelar]  [✓ Confirmar Corte]    │
└─────────────────────────────────────┘
```

#### Ajustes:
- **Mova os sliders** para ajustar cada parâmetro
- **Veja a pré-visualização** atualizando em tempo real
- A **grade 3x3** ajuda a centralizar a composição
- Clique em **"Resetar"** para voltar ao padrão

### **4. Confirmar e Salvar**

1. Clique em **"Confirmar Corte"** quando estiver satisfeito
2. A imagem aparecerá no **Preview** principal
3. Você pode ajustar novamente com controles adicionais:
   - **Posição Vertical**: Ajusta o ponto focal verticalmente
   - **Ajuste de Zoom**: Escala final da imagem no dashboard

### **5. Salvar Configurações**

1. Role até o final da página
2. Clique em **"Salvar Configurações"**
3. Mensagem de sucesso aparecerá (✓)

---

## 💡 Dicas Pro

### Para Casamentos:
- Posicione o casal no **centro** (H: 50%, V: 50%)
- Use zoom `1.2x` a `1.5x` para preencher melhor a tela
- Teste em **mobile** para garantir que os rostos aparecem

### Para Debutantes:
- Foque no rosto da debutante (zoom `1.3x - 1.8x`)
- Posição vertical ligeiramente acima do centro (V: 40-45%)
- Use rotação se a foto estiver inclinada

### Otimização:
1. Use imagens de **2000x1200px ou maiores** para clareza
2. Formatos aceitos: **JPG**, **PNG**, **WEBP**
3. Máximo: **5MB** por arquivo
4. Teste em diferentes dispositivos (desktop, tablet, mobile)

---

## 🎬 Exemplo Completo

**Cenário**: Você tem uma foto de casamento e quer ajustá-la

```
1. Clique em "Upload" → Arraste a imagem → Modal abre

2. No Modal:
   - Posição Horizontal: 48% (casal um pouco à esquerda)
   - Posição Vertical: 45% (casal no terço superior)
   - Zoom: 1.3x (mais focado no casal)
   - Rotação: 0° (já está reta)
   - [✓ Confirmar Corte]

3. Na pré-visualização principal:
   - Posição Vertical: 45% (ajusto o foco)
   - Ajuste de Zoom: 1.1x (escalo final)
   - [Salvar Configurações]

4. Resultado: Dashboard mostra casamento perfeito! 🎉
```

---

## ❌ Solução de Problemas

### "Arquivo muito grande"
- Redimensione a imagem para menos de 5MB
- Use ferramentas como [TinyPNG](https://tinypng.com)

### "A imagem aparece distorcida"
- Use o botão **Resetar** e comece do zero
- Ajuste o **Zoom** primeiro, depois a **Posição**

### "A imagem não aparece no preview"
- Certifique-se de clicar **"Confirmar Corte"** no modal
- Se o modal fechar sem salvar, refaça

### "Imagem fica desfocada"
- Use imagem com resolução maior (mínimo 2000x1200px)
- Evite zoom muito alto (máximo recomendado: 2.5x)

---

## 🔧 Funcionalidades Técnicas

| Recurso | Limite | Recomendação |
|---------|--------|--------------|
| Tamanho arquivo | 5 MB | 2-3 MB |
| Resolução mínima | - | 1920x1080 |
| Formatos | JPG, PNG, WEBP | WEBP (melhor compressão) |
| Zoom | 0.5x - 3x | 1x - 1.8x |
| Rotação | 0-360° | Ajustes pequenos |
| Performance | Tempo real | Instant feedback |

---

## 📱 Comportamento em Dispositivos

### Desktop (> 1200px)
- Preview em tamanho real (aspect ratio 16:9)
- Controles lado a lado
- Animações suaves

### Tablet (768px - 1200px)
- Preview ajustada para a tela
- Controles empilhados
- Touch-friendly

### Mobile (< 768px)
- Preview em tamanho reduzido
- Sliders otimizados para toque
- Modal em fullscreen

---

## ✅ Checklist antes de Salvar

- [ ] Imagem carregada com sucesso
- [ ] Pré-visualização mostra corretamente
- [ ] Casal/debutante está bem centrado
- [ ] Zoom apropriado (não muito perto nem longe)
- [ ] Nenhuma rotação (a menos que intencionalmente inclinada)
- [ ] Área importante não foi cortada
- [ ] Testei em mobile também
- [ ] Cliquei "Salvar Configurações"

---

## 🎓 Aprendizado

Este editor profissional permite que você tenha **total controle** sobre como sua capa aparece em:
- 📱 Dashboard (visualização interna)
- 🌐 Página pública do evento
- 🖼️ Convites e compartilhamentos

Aproveite ao máximo para criar uma primeira impressão perfeita! ✨

---

**Dúvidas?** Verifique a seção de TROUBLESHOOTING acima ou procure ajuda nas instruções gerais do projeto.
