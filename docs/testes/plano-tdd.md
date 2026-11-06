# Plano TDD — inventário de regras

## 1. Escopo e fontes consultadas

Este plano foi elaborado somente com os artefatos encontrados no repositório. Não
foram inventadas regras de negócio, personas, resultados esperados ou critérios de
aceitação.

| Artefato | Localização | Resultado |
|---|---|---|
| README do repositório | `README.md` | Localizado e vazio (`DOC-001`) |
| README da aplicação | `Site/README.md` | Localizado; documenta Angular CLI 22.1.7 e comandos padrão (`DOC-002`) |
| Arquitetura, drivers, riscos e ADRs provisórios | `docs/arquitetura.md` | Localizado; não contém regras de negócio confirmadas |
| Código da aplicação | `Site/src/` | Localizado; contém a casca inicial do componente `App` |
| Testes existentes | `Site/src/app/app.spec.ts` | Localizado; cobre criação do componente e renderização do título |
| Personas, requisitos funcionais, regras de negócio e NFRs | Repositório aberto | Não localizados |
| ADRs separados e documentos de produto adicionais | Repositório aberto | Não localizados |

O documento [docs/arquitetura.md](../arquitetura.md) registra explicitamente a
ausência de personas, requisitos funcionais, regras de negócio, restrições
adicionais e decisões anteriores do produto.

## 2. Inventário de regras

### 2.1 Regras de negócio confirmadas

**Nenhuma regra de negócio foi encontrada.**

O único requisito comportamental relacionado ao domínio é arquitetural/operacional:

- **RA-001 — Treinamento incremental diário:** deve existir um cron job executado
  diariamente ao final do dia para treinar ou retreinar usando somente dados novos.
  **Origem:** `USR-001`, registrado em `docs/arquitetura.md` nas seções 1, 3, 5 e
  8.

RA-001 não define o que são “dados novos”, quando ocorre treino ou retreino, nem
critérios de sucesso. Portanto, não pode ser convertido em regra de negócio
testável sem decisões adicionais.

### 2.2 Itens relacionados, mas não regras de negócio

- **RA-002:** aplicação existente em `Site/`, descrita como Angular CLI 22.1.7.
  **Origem:** `DOC-002`.
- **D-001 a D-009:** propostas arquiteturais, ainda não aprovadas.
- **ADR-001 a ADR-004:** decisões arquiteturais provisórias, dependentes de
  confirmação.
- **S-01 a S-09:** cenários ATAM e hipóteses de avaliação, não requisitos
  aprovados.

## 3. Casos de teste por regra

Não há casos de teste de negócio aprovados porque não há regras de negócio
confirmadas. A matriz a seguir registra casos de elicitação associados a RA-001;
ela não autoriza escrever testes nem define comportamento ausente.

| Caso | Categoria | Fonte/condição | Resultado esperado documentado | Estado |
|---|---|---|---|---|
| RA-001-C01 | Caminho feliz | Cron dispara ao final do dia e há dados elegíveis | Treinar/retreinar somente com dados novos | Parcial; falta definição de elegibilidade |
| RA-001-C02 | Valor-limite | Exatamente o início/fim da janela diária | Não definido; horário, fuso e inclusividade ausentes | Lacuna |
| RA-001-C03 | Valor-limite | Dado atrasado ou correção retroativa | Não definido | Lacuna |
| RA-001-C04 | Entrada inválida | Esquema inválido, identificador ausente, duplicidade ou baixa qualidade | Não definido; não há contrato ou política de rejeição | Lacuna |
| RA-001-C05 | Conflito | Duas execuções selecionam a mesma fonte/partição | Não definido; lock e idempotência são propostas D-002/ADR-002 | Lacuna |
| RA-001-C06 | Estado proibido | Treinar com dado não novo ou avançar checkpoint sem conclusão | Não definido como regra; D-001/D-003 são propostas | Lacuna |
| RA-001-C07 | Sem dados | Cron executa sem dados novos | Não definido; `no-op` é hipótese S-01 | Lacuna |
| RA-001-C08 | Falha parcial | Etapa falha após seleção ou promoção | Não definido; retry/recuperação são propostas D-003/ADR-002 | Lacuna |
| RA-001-C09 | Candidato pior | Modelo candidato não supera ou não é compatível com baseline | Não definido; gates/rollback são propostas D-006/ADR-003 | Lacuna |

### Cobertura por categoria

- **Caminho feliz:** faltam pré-condições, entradas, saída e critério de sucesso.
- **Valores-limite:** faltam horário, fuso, watermark, janela e fronteiras.
- **Entradas inválidas:** faltam contrato, esquema e política de rejeição.
- **Conflitos:** faltam política de concorrência, execução manual e idempotência.
- **Estados proibidos:** os estados de D-001, D-003 e D-006 não são regras
  aprovadas.

## 4. Matriz de cobertura

| Regra de origem | Casos | Teste | Status |
|---|---|---|---|
| Nenhuma regra de negócio confirmada | Não aplicável | Nenhum | Sem escopo testável |
| RA-001 (`USR-001`) | RA-001-C01 a C09 | Nenhum | Bloqueado por especificação incompleta |
| RA-002 (`DOC-002`) | Não aplicável como regra de negócio | Nenhum | Contexto técnico |

Os testes existentes em [app.spec.ts](../../Site/src/app/app.spec.ts) não cobrem
RA-001 nem RA-002; verificam apenas criação do `App` e o texto `Hello, Site`.

## 5. Ambiguidades, lacunas e perguntas

### Ambiguidades

- “Dados novos” não tem definição operacional.
- “Ao final do dia” não informa horário, fuso ou janela.
- “Treinar ou retreinar” não informa o critério de escolha.
- Não está definido se a execução sem dados produz no-op, falha ou outra saída.
- Não está definido o tratamento de dados atrasados, duplicados ou corrigidos.

### Lacunas

- Personas, stakeholders, owners e permissões não foram localizados.
- Requisitos funcionais, regras de negócio e critérios de aceitação não foram
  localizados.
- Não há contratos de entrada/saída para dados, treinamento ou aplicação.
- Não há política de qualidade, aprovação, promoção ou rollback de modelo.
- Não há política de falha, retry, concorrência, idempotência ou recuperação.
- Não há requisitos de segurança, LGPD, retenção, auditoria, volume, custo ou SLA.
- O código observado não contém domínio de negócio de reservas, recursos ou outro
  domínio funcional.

### Perguntas abertas

1. Qual atributo e qual fonte definem “dado novo”?
2. Qual horário, fuso e janela do cron?
3. O que diferencia treinamento de retreinamento?
4. O que ocorre quando não há dados novos?
5. Como tratar dados atrasados, duplicados, inválidos e corrigidos?
6. São permitidas execuções manuais ou sobrepostas?
7. Qual o comportamento esperado após falha parcial?
8. Quais métricas, baseline e limiares aprovam o modelo?
9. Qual versão permanece ativa após rejeição ou rollback?
10. Quais stakeholders aprovam as regras e qual a origem formal de cada uma?

## 6. Limite desta etapa

Não escrever testes, código de produção ou assinaturas mínimas enquanto não houver
regras de negócio verificáveis e resultados esperados aprovados. O próximo ciclo
deve atualizar esta matriz com identificadores formais, pré-condições, entradas,
saídas e critérios de aceitação confirmados.

## 7. Resultado da fase red solicitada

### Bloqueios verificados

- Não há regra de negócio confirmada para transformar em teste. RA-001 é uma
  restrição arquitetural/operacional com comportamento incompleto.
- O prompt solicita JUnit 5 e stack Java, mas o projeto encontrado é Angular CLI
  22.1.7 com TypeScript e Vitest, conforme `Site/package.json`.
- Não há `pom.xml`, `mvnw`, classes Java ou configuração JUnit no repositório.

### Decisão

Nenhum teste novo foi criado, nenhuma assinatura mínima foi adicionada e nenhuma
regra de negócio foi implementada. Criar testes JUnit neste projeto ou escolher
comportamentos para RA-001 violaria a fonte de verdade e o escopo do TDD red.

### Matriz atualizada

| Regra | Caso | Teste | Status red |
|---|---|---|---|
| Nenhuma regra de negócio confirmada | Não aplicável | Nenhum | Bloqueado por ausência de especificação |
| RA-001 (`USR-001`) | RA-001-C01 a C09 | Nenhum | Bloqueado; casos são perguntas de elicitação |
| RA-002 (`DOC-002`) | Não aplicável como regra de negócio | Nenhum | Contexto técnico |

### Suíte executada

A suíte disponível é a suíte Angular/Vitest de `Site/src/app/app.spec.ts`, não uma
suíte JUnit. Seu resultado deve ser registrado após execução; não há “testes novos”
cuja falha red possa ser atribuída a uma regra de negócio.

Execução realizada no diretório `Site/`:

- **Resultado:** 1 arquivo de teste, 2 testes aprovados.
- **Interpretação:** os dois testes existentes continuam verdes; não existem testes
  novos em red e, portanto, não há falha esperada de regra para confirmar.
- **Comando efetivo:** `npm.cmd test -- --watch=false`.
