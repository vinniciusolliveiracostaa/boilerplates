# Bugfix Requirements Document

## Introduction

A rota `/health` do Fastify está falhando ao inicializar devido a um erro de serialização do schema de resposta. O erro ocorre porque o schema Zod está sendo passado diretamente para o Fastify sem conversão para JSON Schema, que é o formato esperado pelo Fastify para validação e serialização de respostas.

Erro específico: `"Failed building the serialization schema for GET: /health, due to error schema is invalid: data/required must be array"`

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o Fastify tenta registrar a rota `/health` com um schema Zod diretamente no campo `response[200]` THEN o sistema falha ao construir o schema de serialização com erro "schema is invalid: data/required must be array"

1.2 WHEN a aplicação tenta inicializar com a rota `/health` configurada THEN o servidor não consegue iniciar devido ao erro de schema inválido

### Expected Behavior (Correct)

2.1 WHEN o Fastify registra a rota `/health` com o schema de resposta THEN o sistema SHALL converter o schema Zod para JSON Schema usando `.toJsonSchema()` ou um type provider apropriado

2.2 WHEN a aplicação inicializa com a rota `/health` configurada THEN o servidor SHALL iniciar com sucesso e a rota SHALL estar disponível para requisições

### Unchanged Behavior (Regression Prevention)

3.1 WHEN uma requisição GET é feita para `/health` THEN o sistema SHALL CONTINUE TO retornar um objeto com as propriedades `status`, `timestamp`, `uptime` e `environment`

3.2 WHEN a resposta da rota `/health` é retornada THEN o sistema SHALL CONTINUE TO ter o formato `{ status: "ok", timestamp: string, uptime: number, environment: string }`

3.3 WHEN outras rotas do Fastify utilizam schemas (se existirem) THEN o sistema SHALL CONTINUE TO funcionar corretamente sem regressões
