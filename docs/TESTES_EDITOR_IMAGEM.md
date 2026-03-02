# 🧪 Plano de Testes: Editor de Imagem

## Pré-requisitos
- ✅ Projeto rodando com `npm run dev`
- ✅ Estar logado em `/settings`
- ✅ Ter uma imagem de teste (JPG, PNG ou WEBP)

---

## 🎯 Teste 1: Upload por Drag-and-Drop

**Passos:**
1. Vá para Configurações → Imagem de Capa
2. Certifique-se que "Upload" está selecionado
3. Procure uma imagem no seu computador
4. **Arraste a imagem** para a área cinza com tracejado rosa
5. O modal de recorte deve abrir automaticamente

**Validações:**
- [ ] Área muda de cor ao arrastar (hover)
- [ ] Modal abre sem erros
- [ ] Imagem aparece na pré-visualização do modal
- [ ] Grid 3x3 é visível na pré-visualização

**Resultado Esperado:** ✅ Modal com imagem carregada

---

## 🎯 Teste 2: Upload por Clique

**Passos:**
1. Na mesma área (ou refresque a página)
2. **Clique** na área cinza
3. Selecione uma imagem
4. Confirme a seleção

**Validações:**
- [ ] File picker abre
- [ ] Imagem é selecionada
- [ ] Modal abre automaticamente
- [ ] Sem erros no console (F12)

**Resultado Esperado:** ✅ Mesmo resultado do Teste 1

---

## 🎯 Teste 3: Validação de Tamanho

**Preparação:**
- Crie um arquivo > 5MB (pode ser qualquer imagem grande)

**Passos:**
1. Tente fazer upload do arquivo > 5MB
2. Clique para selecionar

**Validações:**
- [ ] Alert aparece: "Arquivo muito grande! Máximo 5MB."
- [ ] Modal NÃO abre
- [ ] Nenhum estado é alterado

**Resultado Esperado:** ✅ Validação funcionando

---

## 🎯 Teste 4: Controle de Posição Horizontal

**Preparação:**
- Imagem carregada no modal

**Passos:**
1. Localize o slider **"Posição Horizontal"**
2. Arraste para a **esquerda** (0%)
3. Veja a pré-visualização
4. Arraste para a **direita** (100%)
5. Veja a pré-visualização

**Validações:**
- [ ] Slider responde ao arrastar
- [ ] Valor muda de 0 a 100
- [ ] Pré-visualização atualiza em tempo real
- [ ] Imagem se move horizontalmente

**Resultado Esperado:** ✅ Controle funciona

---

## 🎯 Teste 5: Controle de Posição Vertical

**Passos:**
1. Localize o slider **"Posição Vertical"**
2. Arraste para **cima** (0%)
3. Veja a pré-visualização
4. Arraste para **baixo** (100%)
5. Veja a pré-visualização

**Validações:**
- [ ] Slider responde
- [ ] Valor muda de 0 a 100
- [ ] Pré-visualização atualiza
- [ ] Imagem se move verticalmente

**Resultado Esperado:** ✅ Controle funciona

---

## 🎯 Teste 6: Controle de Zoom

**Passos:**
1. Localize o slider **"Zoom"**
2. Arraste para a **esquerda** (0.5x)
3. Veja a imagem ficar pequena
4. Arraste para a **direita** (3x)
5. Veja a imagem ficar grande

**Validações:**
- [ ] Slider responde
- [ ] Valor muda de 0.5 a 3.0
- [ ] Pré-visualização atualiza
- [ ] Imagem aumenta/diminui tamanho

**Resultado Esperado:** ✅ Zoom funciona

---

## 🎯 Teste 7: Controle de Rotação

**Passos:**
1. Localize o slider **"Rotação"**
2. Arraste para **qualquer valor** (ex: 45°)
3. Veja a imagem girar
4. Coloque em 90°
5. Coloque em 180°

**Validações:**
- [ ] Slider responde
- [ ] Valor muda de 0 a 360
- [ ] Imagem gira em tempo real
- [ ] Rotação é suave

**Resultado Esperado:** ✅ Rotação funciona

---

## 🎯 Teste 8: Botão Resetar

**Preparação:**
- Adjust todos os sliders para valores aleatórios
- H: 75%, V: 30%, Zoom: 2.1x, Rotação: 215°

**Passos:**
1. Clique no botão **"↺ Resetar"**
2. Observe todos os valores

**Validações:**
- [ ] H volta para 50%
- [ ] V volta para 50%
- [ ] Zoom volta para 1.0x
- [ ] Rotação volta para 0°
- [ ] Pré-visualização volta ao padrão

**Resultado Esperado:** ✅ Resetar funciona

---

## 🎯 Teste 9: Botão Girar 90°

**Preparação:**
- Rotação em 0°

**Passos:**
1. Clique **"🔄 Girar 90°"**
2. Clique novamente
3. Clique novamente
4. Clique novamente

**Validações:**
- 1º clique: Rotação muda para 90°
- 2º clique: Rotação muda para 180°
- 3º clique: Rotação muda para 270°
- 4º clique: Rotação volta para 0° (360°)

**Resultado Esperado:** ✅ Girar 90° funciona

---

## 🎯 Teste 10: Grid de Composição

**Preparação:**
- Modal aberto com imagem

**Passos:**
1. Observe a **pré-visualização**
2. Procure pelas linhas de grid

**Validações:**
- [ ] Grid 3x3 é visível (linhas azuis)
- [ ] Divide a imagem em 9 quadrados
- [ ] Ajuda a centralizar a composição

**Resultado Esperado:** ✅ Grid visível e útil

---

## 🎯 Teste 11: Cancelar Sem Salvar

**Preparação:**
- Modal aberto
- Ajuste alguns controles

**Passos:**
1. Clique no botão **"X"** (canto superior direito)
2. OU clique no botão **"Cancelar"** (footer)

**Validações:**
- [ ] Modal fecha
- [ ] Imagem anterior permanece (ou fica vazia)
- [ ] Alterações NÃO são salvas
- [ ] Estados são resetados

**Resultado Esperado:** ✅ Cancelamento funciona sem efeito

---

## 🎯 Teste 12: Confirmar Corte

**Preparação:**
- Modal aberto
- Ajustes finalizados

**Passos:**
1. Clique **"✓ Confirmar Corte"**
2. Aguarde o modal fechar

**Validações:**
- [ ] Modal fecha
- [ ] Imagem aparece na pré-visualização principal
- [ ] Estados do modal são resetados
- [ ] `tempImage` fica vazio

**Resultado Esperado:** ✅ Imagem aparece na preview

---

## 🎯 Teste 13: Botão Editar

**Preparação:**
- Imagem já carregada e confirmada
- Imagem visível na pré-visualização principal

**Passos:**
1. Clique no botão **"✏️"** (canto superior direito)
2. Observe o modal abrindo novamente

**Validações:**
- [ ] Modal abre com a imagem atual
- [ ] Controles estão nos valores padrão
- [ ] Pré-visualização mostra a imagem
- [ ] Pode ajustar novamente

**Resultado Esperado:** ✅ Editar reabre o modal

---

## 🎯 Teste 14: Botão Remover

**Passos:**
1. Com a imagem carregada
2. Clique no botão **"🗑️"** (canto superior direito)

**Validações:**
- [ ] Imagem desaparece
- [ ] Preview fica em branco
- [ ] Controles desaparecem (Posição Vertical e Zoom)
- [ ] Tipo de upload permanece "upload"

**Resultado Esperado:** ✅ Imagem removida

---

## 🎯 Teste 15: Responsividade Mobile

**Preparação:**
- F12 → Modo Device (Mobile, ex: iPhone 12)

**Passos:**
1. Redimensione a janela para < 768px
2. Faça upload de uma imagem
3. Modal deve aparecer em fullscreen

**Validações:**
- [ ] Modal ocupa a tela inteira
- [ ] Sliders são fáceis de usar com dedo
- [ ] Botões são grandes o suficiente
- [ ] Texto é legível
- [ ] Sem layout quebrado

**Resultado Esperado:** ✅ Layout responsivo

---

## 🎯 Teste 16: Responsividade Tablet

**Preparação:**
- F12 → Modo Device (Tablet, ex: iPad)

**Passos:**
1. Redimensione para 768px - 1200px
2. Faça o mesmo que teste anterior

**Validações:**
- [ ] Modal em tamanho apropriado
- [ ] Controles visíveis
- [ ] Sem overflow horizontal
- [ ] Sem layout quebrado

**Resultado Esperado:** ✅ Layout responsivo

---

## 🎯 Teste 17: Salvamento em localStorage

**Preparação:**
- Imagem carregada, ajustada e confirmada
- Clique "Salvar Configurações"

**Passos:**
1. Abra F12 → Application → localStorage
2. Procure pela chave `rsvp_events`
3. Busque pela `coverImage`
4. Refresque a página (F5)

**Validações:**
- [ ] Dados salvos em localStorage
- [ ] Imagem persiste após refresh
- [ ] Controlador "✏️ Editar" continua funcional

**Resultado Esperado:** ✅ Dados salvos corretamente

---

## 🎯 Teste 18: Múltiplas Imagens

**Passos:**
1. Faça upload da Imagem A
2. Confirme
3. Clique "Editar"
4. Cancele (sem confirmar)
5. Faça upload da Imagem B
6. Confirme

**Validações:**
- [ ] Imagem B aparece na preview
- [ ] Imagem A não é mais visível
- [ ] Sem erros no console

**Resultado Esperado:** ✅ Troca de imagem funciona

---

## 🎯 Teste 19: Pré-visualização em Tempo Real

**Preparação:**
- Modal aberto

**Passos:**
1. Mude o slider H lentamente (não solte)
2. Observe a pré-visualização

**Validações:**
- [ ] Imagem se move enquanto arrasta
- [ ] Não há delay/lag
- [ ] Atualização é suave

**Resultado Esperado:** ✅ Tempo real sem lag

---

## 🎯 Teste 20: Console Limpo

**Preparação:**
- Abra F12 → Console

**Passos:**
1. Realize todos os testes anteriores
2. Observe o console

**Validações:**
- [ ] Nenhum erro vermelho
- [ ] Nenhum warning
- [ ] Nenhuma exceção não capturada

**Resultado Esperado:** ✅ Console limpo

---

## 📊 Sumário de Testes

| # | Teste | Status | Notas |
|---|-------|--------|-------|
| 1 | Drag-and-Drop | ✅ | |
| 2 | Upload por Clique | ✅ | |
| 3 | Validação 5MB | ✅ | |
| 4 | Posição Horizontal | ✅ | |
| 5 | Posição Vertical | ✅ | |
| 6 | Zoom | ✅ | |
| 7 | Rotação | ✅ | |
| 8 | Resetar | ✅ | |
| 9 | Girar 90° | ✅ | |
| 10 | Grid | ✅ | |
| 11 | Cancelar | ✅ | |
| 12 | Confirmar | ✅ | |
| 13 | Editar | ✅ | |
| 14 | Remover | ✅ | |
| 15 | Mobile | ✅ | |
| 16 | Tablet | ✅ | |
| 17 | localStorage | ✅ | |
| 18 | Múltiplas Imagens | ✅ | |
| 19 | Tempo Real | ✅ | |
| 20 | Console | ✅ | |

---

## 🎉 Conclusão

Se todos os testes passarem com ✅, o editor de imagem está **100% funcional** e pronto para produção!

### Próximos Passos:
1. ✅ Execute todos os 20 testes
2. ✅ Anote qualquer problema encontrado
3. ✅ Se houver erros, consulte [IMAGEM_CAPA_GUIA.md](IMAGEM_CAPA_GUIA.md)
4. ✅ Após tudo passar, o sistema está **READY** 🚀

---

**Data**: Janeiro 2026  
**Versão**: 1.0  
**Total de Testes**: 20  
**Tempo Estimado**: 15-20 minutos

