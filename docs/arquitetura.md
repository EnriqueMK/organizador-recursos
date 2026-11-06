# Arquitetura — seção inicial

> **Status:** levantamento inicial, condicionado à disponibilidade dos artefatos de requisitos.
>
> Este documento distingue fatos observados, lacunas, conflitos, suposições e perguntas
> abertas. Nenhuma tecnologia, volume, SLA, usuário ou regra foi inferida como requisito.

## 1. Contexto e objetivo

### Fatos

- O repositório contém um projeto em `Site/`, descrito como gerado pelo Angular CLI
  22.1.7 em [Site/README.md](../Site/README.md). **Fonte:** `DOC-002`.
- O objetivo de negócio, o escopo funcional e o problema que o sistema deve resolver
  não estão descritos nos artefatos de produto localizados. **Fonte:** `DOC-001`,
  `DOC-002`, inventário documental desta análise.
- Existe um cron job executado diariamente ao final do dia para treinar ou retreinar,
  usando somente dados novos. **Fonte:** `USR-001` — restrição informada na
  solicitação atual.

### Objetivo arquitetural provisório

Organizar uma arquitetura que preserve a separação entre a aplicação existente e o
processo diário de treinamento/retreinamento, sem decidir componentes, fluxos,
volumes ou metas de operação que não estejam especificados. A arquitetura só poderá
ser detalhada após a confirmação do contexto de negócio e dos requisitos ausentes.

## 2. Stakeholders e personas

### Fatos

Nenhum stakeholder ou persona foi identificado nos artefatos de produto disponíveis.
`Site/README.md` documenta apenas comandos de desenvolvimento, build, testes e
servidor local; não atribui esses comandos a uma persona. **Fonte:** `DOC-002`.

### Lacuna

Faltam, no mínimo, os papéis envolvidos no uso da aplicação, na operação do job
diário, na disponibilização dos dados novos, na validação dos modelos e na
manutenção do sistema.

### Não assumido

Não foram criados nomes, perfis, permissões, responsabilidades ou jornadas de
usuário.

## 3. Requisitos arquiteturalmente significativos

### Confirmado

- **RA-001 — Treinamento incremental diário:** deve existir um cron job executado
  diariamente ao final do dia para treinar ou retreinar usando somente dados novos.
  **Origem:** `USR-001`.
- **RA-002 — Aplicação existente:** há um projeto no diretório `Site/`; o README o
  identifica como projeto Angular CLI 22.1.7. **Origem:** `DOC-002`.

### Lacunas

Não há especificação para:

- funcionalidades e fluxos de negócio;
- contratos de entrada e saída do job;
- definição de “dados novos”, janela de corte, idempotência ou deduplicação;
- comportamento quando não houver dados novos;
- tratamento de falha, repetição, concorrência ou recuperação do job;
- armazenamento de dados, modelos e versões;
- consumo, validação, aprovação e publicação de modelos;
- integração entre a aplicação e o processo de treinamento;
- autenticação, autorização, privacidade, auditoria e retenção;
- ambientes, implantação, observabilidade e operação.

## 4. Atributos de qualidade

### Fatos

Nenhum atributo de qualidade, métrica, limiar ou SLA foi definido nos documentos de
produto localizados. **Fonte:** `DOC-001`, `DOC-002`.

### Implicações a esclarecer

Os seguintes atributos são **pontos de investigação**, não requisitos confirmados:

- confiabilidade e recuperabilidade do job diário;
- consistência e rastreabilidade entre dados novos, execução e modelo produzido;
- segurança e controle de acesso aos dados e modelos;
- observabilidade da execução e dos resultados;
- manutenibilidade da aplicação e do pipeline de treinamento;
- desempenho e escalabilidade da aplicação e do processamento.

Não há base documental para ordenar esses atributos, atribuir pesos ou estabelecer
metas quantitativas.

## 5. Drivers arquiteturais priorizados

| Prioridade | Driver | Tipo | Origem | Consequência arquitetural provisória |
|---|---|---|---|---|
| 1 | Treinar ou retreinar diariamente apenas com dados novos | Restrição operacional | `USR-001` | O fluxo deve separar a seleção de dados novos da execução do treinamento e preservar a rastreabilidade dessa seleção. |
| 2 | Executar o treinamento ao final de cada dia | Restrição temporal | `USR-001` | O desenho deve comportar uma execução agendada diária; horário, fuso, tolerância e SLA permanecem indefinidos. |
| 3 | Preservar compatibilidade com a aplicação existente | Contexto técnico observado | `DOC-002` | Mudanças arquiteturais devem considerar o projeto localizado em `Site/`; não há autorização para substituir sua tecnologia. |

As prioridades acima ordenam apenas os drivers confirmados. Não representam
prioridades de negócio ou de qualidade ainda não documentadas.

## 6. Glossário

| Termo | Definição baseada nas fontes | Estado |
|---|---|---|
| Aplicação | Projeto localizado em `Site/`, descrito no README como gerado pelo Angular CLI 22.1.7. | Fato (`DOC-002`) |
| Cron job | Processo agendado que deve ser executado diariamente ao final do dia para treinar ou retreinar. | Fato da solicitação (`USR-001`) |
| Dados novos | Dados que devem ser usados pelo treinamento/retreinamento diário; a regra de identificação não foi definida. | Termo não definido (`USR-001`) |
| Treinamento | Processo mencionado pela restrição diária; objetivo, entradas, saídas e tecnologia não foram especificados. | Termo parcialmente definido (`USR-001`) |
| Retreinamento | Nova execução de treinamento mencionada pela restrição diária; critérios para escolher entre treinar e retreinar não foram definidos. | Termo parcialmente definido (`USR-001`) |

## 7. Riscos iniciais

| ID | Risco | Evidência | Impacto potencial | Mitigação dependente de decisão |
|---|---|---|---|---|
| R-001 | Dados novos podem ser selecionados de forma inconsistente entre execuções. | A restrição exige somente dados novos, mas não define a regra de novidade (`USR-001`). | Treinamento incompleto, duplicado ou não reproduzível. | Definir marcador de corte, identidade dos dados, deduplicação e idempotência. |
| R-002 | O job diário pode falhar sem um comportamento operacional definido. | Não há regras de retry, alerta, recuperação ou execução sem dados (`DOC-001`, `DOC-002`). | Ausência ou atraso de modelo atualizado. | Definir política de falha, reprocessamento, alertas e estado da execução. |
| R-003 | A arquitetura pode atender ao pipeline e não atender ao produto. | Não há contexto de negócio, personas ou requisitos funcionais (`DOC-001`, `DOC-002`). | Decisões prematuras e retrabalho. | Obter e versionar os artefatos de requisitos antes do detalhamento. |
| R-004 | Compatibilidade entre a aplicação e modelos/processos futuros pode não ser preservada. | A aplicação existente é identificada, mas suas interfaces e responsabilidades não (`DOC-002`). | Integração frágil ou necessidade de mudanças incompatíveis. | Definir contratos, ciclo de vida de modelos e pontos de integração. |

## 8. Separação de evidências

### Fatos

- `DOC-001`: [README.md](../README.md) existe, mas está vazio.
- `DOC-002`: [Site/README.md](../Site/README.md) identifica o projeto como Angular CLI
  22.1.7 e documenta comandos padrão do Angular CLI.
- `USR-001`: solicitação atual informa a existência do cron job diário ao final do
  dia, com treinamento/retreinamento usando somente dados novos.

### Lacunas

Não foram localizados artefatos de personas, requisitos funcionais, requisitos não
funcionais, regras de negócio, restrições adicionais ou decisões arquiteturais
anteriores do produto.

### Conflitos

Nenhum conflito entre os artefatos disponíveis foi identificado. A ausência de
requisitos não é tratada como autorização para escolher uma solução.

### Suposições controladas

- A aplicação em `Site/` é parte do sistema em análise, pois é o único artefato de
  produto identificável no repositório.
- O cron job é uma restrição obrigatória, não uma sugestão, porque foi explicitamente
  informado na solicitação.

Essas suposições devem ser confirmadas antes de decisões arquiteturais irreversíveis.

### Perguntas abertas

1. Qual problema de negócio e quais resultados o sistema deve produzir?
2. Quais são as personas, stakeholders, permissões e jornadas principais?
3. Quais são os requisitos funcionais e as regras de negócio identificadas por
   seus IDs?
4. Como “dados novos” são definidos, identificados, armazenados e protegidos?
5. Qual é o horário exato, fuso, tolerância e comportamento esperado do cron job?
6. O que diferencia treinar de retreinar e quais critérios escolhem cada operação?
7. O que deve ocorrer quando não houver dados novos ou quando o job falhar?
8. Onde ficam os dados, modelos, metadados, logs e históricos de execução?
9. Como um modelo é validado, aprovado, publicado, revertido e consumido?
10. Quais atributos de qualidade têm prioridade e quais métricas/limiares devem ser
    atendidos?
11. Quais restrições legais, de segurança, infraestrutura, custo ou implantação se
    aplicam?
12. Quais decisões anteriores devem ser preservadas e quais interfaces da aplicação
    já são contratos?

