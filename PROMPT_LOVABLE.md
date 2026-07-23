# PROMPT PARA LOVABLE - Sistema de Agendamento Cirúrgico

## Crie um sistema web completo de agendamento cirúrgico com as seguintes especificações:

---

## 1. IDENTIDADE VISUAL
- **Paleta de cores:** Azul claro (#38BDF8, #0284C7, #E0F2FE), Cinza (#F1F5F9, #CBD5E1, #64748B, #334155), Branco (#FFFFFF)
- **Estilo:** Cards arredondados, sombras suaves, gradientes sutis azul → branco
- **Sidebar:** Gradiente escuro (#0F172A → #334155) com itens azul claro quando ativos
- **Botões primários:** Gradiente azul (#38BDF8 → #0284C7)
- **Tipografia:** Limpa e profissional, fonte Arial/Geist

## 2. AUTENTICAÇÃO
- **Tela de Login** com campos: "Usuário" e "Senha"
- **Credenciais do admin:** usuário: `admin` / senha: `superadmin`
- **Tela de Cadastro** com campos: Nome, Usuário (email), Telefone WhatsApp, Senha
- Dois perfis: ADMIN (acesso total) e USER (vê apenas suas cirurgias)
- Usuários padrão pré-cadastrados:
  - vitoria / vitoria270510 (VITORIA, +5527999060510)
  - danilo / danilo895009 (DANILO, +5519992895009)
  - marcelotognato / 7687140 (MARCELO TOGNATO, +5511976787140)
  - marcelodiesel / 811743 (MARCELO DIESEL, +5565981174381)

## 3. SIDEBAR E NAVEGAÇÃO
- Dashboard (todos)
- Agendar Cirurgia (apenas admin)
- Minhas Cirurgias (todos)
- Relatórios (apenas admin)
- Usuários (apenas admin)
- Sair

## 4. DASHBOARD ADMIN
Cards com ícones mostrando:
- Total de Cirurgias do mês
- Cirurgias Hoje
- Valor Bruto Total do mês (admin)
- Lucro Estimado do mês (admin)

Tabela com cirurgias do mês: Data, Hora, Hospital, Cirurgião, Cirurgia, Empresa (badge azul), Valor, Custo Material, Status (badge colorido: verde=Confirmada, amarelo=Agendada, azul=Realizada, vermelho=Cancelada)

## 5. FORMULÁRIO DE AGENDAMENTO (admin apenas)
Campos com dropdowns pré-preenchidos:
- Data (date picker)
- Horário (time picker)
- Hospital (select com opções abaixo)
- Cirurgião (select com opções abaixo)
- Empresa (select com opções abaixo)
- Tipo de Cirurgia (select com opções abaixo)
- Paciente (select de usuários cadastrados)
- Convênio (texto livre)
- Valor Bruto R$ (number)

### Hospitais:
Hospital SAO MATEUS, CHC, HBENTO, AMECOR, FEMINA, HGU, METROPOLITANO, HMC, SANTA ROSA, HILDA STRENGER, REGIONAL DE RONDONOPOLIS, UNIMED CUIABA, UNIMED RONDONOPOLIS, SANTA CASA DE CUIABA, SANTA CASA DE RONDONOPOLIS, SANTA RITA, SANTA ANGELA, HCLINICAS, H SANTA MARIA PRIMAVERA

### Cirurgiões:
ANDRE MACHADO, MARCEL YAMADA, JOAO CALADO, LUIZ TENORIO, ALEIXO, MARLON, ALEX SANTIAGO, FABIO PEREZ, VINICIUS ANDRADE, HELDER, RUBENS, RENATO BONAFIM, THIAGO AMORIM, CARLOS AUGUSTO, ATILA, BRUNO REGIS, LUCIANO FRANCA, EVERTON, ATHAUALPA, RONAN, KALINIO, CLEITON, RAFAEL KAMICIEK, GUSTAVO BRIANEZE, DOUGLAS GONSALES, VINICIUS NICOLELIS, JOAO AUGUSTO, JOAO OTAVIO, PACAI, PAULO SPRENGLER, DEIVIS FINGER, JOAO CHAVES, SAMUEL, FELIPE BASTOS, EDILSON, GABRIEL CHAVES, CESAR PRADO, GUSTAVO GOBATO, JOSE WESLEY, RENATO DE CARVALHO

### Empresas:
TITANIUM, QUALITY, DOCTOR MEDIC, ENDOCARDIO, MEDIC-o, SURGICAL, PACOTE, MEDNEURO, SUS, UNIMED ROO, UNIMED TGA

### Tipos de Cirurgia:
TUMOR CEREBRAL, TUMOR CEREBRAL COM ATEIO, TUMOR COLUNA COM ONDA D, TUMOR COLUNA SEM ONDA D, ESCOLIOSE, CERVICAL ANTERIOR, TORACICA, LOMBAR, ALIF, ESTIMULADOR MEDULAR, ANEURISMA, BASE DE CRANIO COM AEP, BASE DE CRANIO SEM AEP, PLEXO CERVICAL, ATM, TIREOIDE

## 6. AUTO-ENVIO DE MENSAGENS WHATSAPP
**Ao criar uma cirurgia**, o sistema DEVE enviar automaticamente a seguinte mensagem para os 4 telefones cadastrados via WhatsApp API:

```
🩺 *Lembrete de Cirurgia*

*Paciente:* [nome do paciente]
*Cirurgião:* [nome do cirurgião]
*Procedimento:* [tipo de cirurgia]
*Data:* [data no formato DD/MM/AAAA]
*Horário:* [horário]
*Hospital:* [nome do hospital]
*Convênio:* [convênio]

Por favor, chegue com 1 hora de antecedência.
```

### Números que recebem:
- VITORIA: +5527999060510
- DANILO: +5519992895009
- MARCELO TOGNATO: +5511976787140
- MARCELO DIESEL: +5565981174381

### Integração WhatsApp:
Usar Evolution API (ou Baileys) para envio automático. Configurar endpoint, API key e instance name nas variáveis de ambiente.

## 7. NOTIFICAÇÕES AUTOMÁTIZADAS
- **Na véspera:** lembrete automático com card-formato
- **2 horas antes:** alerta de urgência
- Usar cron job ou agendador que verifica cirurgias próximas

## 8. PÁGINA "MINHAS CIRURGIAS"
- Usuário comum vê APENAS suas cirurgias
- Cards com: Tipo, Hospital, Cirurgião, Data, Horário, Convênio, Empresa, Status

## 9. RELATÓRIOS (admin)
- **Filtros:** empresa, paciente, período
- **Botões de PDF** para cada empresa e relatório geral
- **Relatório por empresa:** Titanium bonifica +10% no valor bruto
- **Tabela:** Data, Hora, Hospital, Cirurgião, Cirurgia, Empresa, Paciente, Valor, Custo
- Gerar PDF com jsPDF

## 10. TABELA DE CUSTOS POR CIRURGIA
| Tipo | Custo Material (R$) |
|------|---------------------|
| Cervical, Torácica, Lombar | 700 |
| Tumor Coluna com Onda D | 1.300 |
| Tumor Coluna sem Onda D | 700 |
| Tumor Cerebral com Strip | 4.700 |
| Plexo Cervical | 1.000 |
| Tireoide | 700 |
| ATM | 500 |
| Estimulador Medular | 700 |
| **Titanium** | **0 (bonificado)** |

## 11. PWA (Progressive Web App)
- Criar manifest.json com nome "AgendaCir"
- Service Worker para funcionar offline
- Ícone azul gradiente com "SC"
- Meta tags para Apple e Android
- Instalável como app no celular

## 12. BANCO DE DADOS
Usar Prisma + SQLite com modelos: User, Hospital, Surgeon, Company, SurgeryType, Surgery, NotificationLog, Account, Session, VerificationToken

## 13. ROTAS DA API
- POST /api/auth/[...nextauth] - Login
- POST /api/register - Cadastro
- GET/POST /api/surgeries - Listar/Criar cirurgias (com auto-envio WhatsApp)
- GET /api/surgeries/select?type=hospitals|surgeons|companies|surgeryTypes|users
- GET /api/users - Listar usuários (admin)
- GET /api/reports?type=financial|company - Relatórios
- POST /api/notifications - Enviar notificações manuais
- GET /api/cron - Verificar e enviar lembretes automáticos

## 14. VARIÁVEIS DE AMBIENTE
```
DATABASE_URL=file:./dev.db
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_chave
EVOLUTION_INSTANCE=sistema-agendamento
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=chave_secreta
```

---

**IMPORTANTE:** Todo o sistema deve ser híbrido (web + PWA), funcionando em qualquer dispositivo. As mensagens WhatsApp devem ser enviadas AUTOMATICAMENTE ao cadastrar uma cirurgia, sem ação manual do usuário.
