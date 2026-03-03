# Fastify Zod Schema Serialization Fix - Bugfix Design

## Overview

O bug ocorre quando o Fastify retorna respostas HTTP sem validar ou serializar os dados conforme os schemas Zod definidos nas rotas. Embora `withTypeProvider<ZodTypeProvider>()` forneça tipagem TypeScript em tempo de desenvolvimento, ele não configura a conversão runtime dos schemas Zod. O resultado é que o Fastify ignora os schemas de resposta e retorna os dados brutos sem validação.

A estratégia de correção é registrar os compiladores `serializerCompiler` e `validatorCompiler` do pacote `fastify-type-provider-zod` na inicialização do Fastify (arquivo `src/app.ts`), antes de registrar qualquer rota. Isso garante que todos os schemas Zod sejam processados corretamente em runtime.

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug - quando rotas Fastify com schemas Zod de resposta retornam dados sem serialização/validação
- **Property (P)**: O comportamento desejado - respostas devem ser validadas e serializadas conforme os schemas Zod definidos
- **Preservation**: Comportamento existente de rotas sem schemas Zod e funcionalidade de logging/DI que devem permanecer inalterados
- **serializerCompiler**: Função do fastify-type-provider-zod que converte schemas Zod em serializadores de resposta do Fastify
- **validatorCompiler**: Função do fastify-type-provider-zod que converte schemas Zod em validadores de request do Fastify
- **withTypeProvider**: Método do Fastify que adiciona apenas tipagem TypeScript, sem configuração runtime
- **ZodTypeProvider**: Type provider que conecta schemas Zod ao sistema de tipos do Fastify

## Bug Details

### Fault Condition

O bug se manifesta quando uma rota Fastify define um schema Zod de resposta (usando `schema.response`), mas o Fastify não valida nem serializa a resposta conforme o schema. Isso ocorre porque `withTypeProvider<ZodTypeProvider>()` apenas adiciona tipagem TypeScript, mas não registra os compiladores necessários para processar schemas Zod em runtime.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { route: FastifyRoute, response: any }
  OUTPUT: boolean
  
  RETURN input.route.schema.response IS DEFINED
         AND input.route.schema.response CONTAINS ZodSchema
         AND serializerCompiler IS NOT REGISTERED
         AND response IS NOT VALIDATED_OR_SERIALIZED
END FUNCTION
```

### Examples

- **Exemplo 1**: Rota `/health` define `healthResponseSchema` com `z.object({ status: z.literal("ok"), ... })`, mas retorna dados sem validação - se o código retornar `{ status: "error" }` por engano, o Fastify não detecta o erro
- **Exemplo 2**: Schema de resposta define `timestamp: z.string()`, mas se o código retornar `timestamp: new Date()` (objeto Date), o Fastify não converte para string
- **Exemplo 3**: Schema define campos obrigatórios, mas se o código omitir campos, o Fastify não lança erro de validação
- **Edge case**: Rotas sem schemas Zod devem continuar funcionando normalmente (comportamento de preservação)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Rotas sem schemas Zod devem continuar funcionando exatamente como antes
- Sistema de logging (pino/pino-pretty) deve permanecer inalterado
- Sistema de DI (Awilix) deve permanecer inalterado
- Ordem de registro de plugins deve ser mantida (fundação → módulos de negócio)
- Configuração de ambiente e variáveis deve permanecer inalterada

**Scope:**
Todas as rotas que NÃO definem schemas Zod (ou que usam outros tipos de validação) devem ser completamente não afetadas por esta correção. Isso inclui:
- Rotas sem `schema` definido
- Rotas com validação manual
- Middlewares e hooks existentes
- Funcionalidade de logging e error handling

## Hypothesized Root Cause

Baseado na descrição do bug e análise do código, as causas mais prováveis são:

1. **Falta de Registro dos Compiladores**: O `withTypeProvider<ZodTypeProvider>()` é apenas um helper de tipagem TypeScript. Ele não registra os compiladores `serializerCompiler` e `validatorCompiler` necessários para processar schemas Zod em runtime.

2. **Ordem de Inicialização**: Mesmo que os compiladores fossem registrados em outro lugar, eles precisam ser configurados ANTES de registrar as rotas, caso contrário as rotas não usarão os compiladores.

3. **Configuração Incompleta**: O pacote `fastify-type-provider-zod` está instalado, mas suas funções principais (`serializerCompiler`, `validatorCompiler`) não estão sendo importadas nem utilizadas.

4. **Documentação Enganosa**: A API `withTypeProvider` sugere que configura o provider, mas na verdade apenas adiciona tipos - isso pode ter causado confusão durante a implementação inicial.

## Correctness Properties

Property 1: Fault Condition - Zod Schema Serialization and Validation

_For any_ rota Fastify que define um schema Zod de resposta (via `schema.response`), o Fastify corrigido SHALL validar e serializar a resposta conforme o schema Zod, lançando erros se os dados não corresponderem ao schema e convertendo tipos quando necessário.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Zod Routes Behavior

_For any_ rota que NÃO define schemas Zod (ou que não usa o sistema de schemas do Fastify), o código corrigido SHALL produzir exatamente o mesmo comportamento do código original, preservando funcionalidade de logging, DI, error handling e processamento de requests/responses.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta:

**File**: `src/app.ts`

**Function**: `AppServer`

**Specific Changes**:
1. **Importar Compiladores**: Adicionar import de `serializerCompiler` e `validatorCompiler` do pacote `fastify-type-provider-zod`
   ```typescript
   import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
   ```

2. **Registrar serializerCompiler**: Após criar a instância do Fastify e antes de registrar plugins, configurar o serializador
   ```typescript
   app.setSerializerCompiler(serializerCompiler);
   ```

3. **Registrar validatorCompiler**: Após configurar o serializador, configurar o validador
   ```typescript
   app.setValidatorCompiler(validatorCompiler);
   ```

4. **Manter withTypeProvider**: O `withTypeProvider<ZodTypeProvider>()` deve permanecer pois fornece tipagem TypeScript útil, mas agora funcionará em conjunto com os compiladores

5. **Posicionamento Correto**: Os compiladores devem ser registrados APÓS criar a instância do Fastify, mas ANTES de registrar qualquer plugin ou rota

**Estrutura Final Esperada**:
```typescript
export async function AppServer() {
    const app = Fastify({
        logger: getLoggerOptions(),
    }).withTypeProvider<ZodTypeProvider>();

    // Configurar compiladores Zod ANTES de registrar plugins/rotas
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // 1. FUNDAÇÃO (DI, Logger e Suporte a Middlewares)
    await app.register(awilixPlugin);
    await app.register(loggerPlugin);

    // 6. MÓDULOS DE NEGÓCIO
    const appModule = new AppModule();
    await appModule.register(app);
    await appModule.bootstrap(app);

    return app;
}
```

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem de duas fases: primeiro, demonstrar o bug no código não corrigido (respostas não são validadas), depois verificar que a correção funciona corretamente e preserva comportamentos existentes.

### Exploratory Fault Condition Checking

**Goal**: Demonstrar o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Test Plan**: Escrever testes que fazem requests para rotas com schemas Zod e verificam se as respostas são validadas/serializadas. Executar estes testes no código NÃO CORRIGIDO para observar falhas e entender a causa raiz.

**Test Cases**:
1. **Invalid Response Test**: Modificar temporariamente a rota `/health` para retornar `{ status: "error" }` (viola `z.literal("ok")`), fazer request e verificar se o Fastify lança erro (falhará no código não corrigido - retornará 200 com dados inválidos)
2. **Type Coercion Test**: Modificar rota para retornar `timestamp: new Date()` (objeto) ao invés de string, verificar se o Fastify converte para string (falhará no código não corrigido - retornará objeto Date serializado como string ISO)
3. **Missing Field Test**: Modificar rota para omitir campo obrigatório `uptime`, verificar se o Fastify detecta (falhará no código não corrigido - retornará resposta incompleta)
4. **Extra Field Test**: Adicionar campo não definido no schema, verificar se o Fastify remove ou mantém (comportamento pode variar)

**Expected Counterexamples**:
- Respostas inválidas são retornadas com status 200 sem erros
- Tipos não são convertidos conforme schemas Zod
- Campos obrigatórios ausentes não causam erros
- Possíveis causas: compiladores não registrados, ordem de inicialização incorreta

### Fix Checking

**Goal**: Verificar que para todas as rotas onde a condição de bug se aplica (schemas Zod definidos), o Fastify corrigido produz o comportamento esperado (validação e serialização).

**Pseudocode:**
```
FOR ALL route WHERE isBugCondition(route) DO
  response := makeRequest(route, validData)
  ASSERT response.statusCode = 200
  ASSERT response.body MATCHES route.schema.response
  
  invalidResponse := makeRequest(route, invalidData)
  ASSERT invalidResponse.statusCode = 500 OR 400
  ASSERT invalidResponse.body CONTAINS error_message
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas as rotas onde a condição de bug NÃO se aplica (sem schemas Zod), o Fastify corrigido produz o mesmo resultado que o original.

**Pseudocode:**
```
FOR ALL route WHERE NOT isBugCondition(route) DO
  ASSERT makeRequest_original(route) = makeRequest_fixed(route)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que o comportamento permanece inalterado para todas as rotas não afetadas

**Test Plan**: Observar comportamento no código NÃO CORRIGIDO primeiro para rotas sem schemas Zod, depois escrever property-based tests capturando esse comportamento.

**Test Cases**:
1. **Routes Without Schemas**: Criar rota de teste sem schema, verificar que resposta é idêntica antes e depois da correção
2. **Logging Preservation**: Verificar que logs continuam sendo gerados corretamente para todas as rotas
3. **DI Preservation**: Verificar que injeção de dependências continua funcionando em controllers/services
4. **Error Handling Preservation**: Verificar que erros não relacionados a validação Zod continuam sendo tratados da mesma forma

### Unit Tests

- Testar rota `/health` com dados válidos (deve retornar 200 com dados corretos)
- Testar rota `/health` com dados inválidos injetados (deve retornar erro após correção)
- Testar conversão de tipos (Date para string, number para string, etc.)
- Testar campos obrigatórios ausentes
- Testar rotas sem schemas Zod (devem funcionar normalmente)

### Property-Based Tests

- Gerar payloads aleatórios válidos conforme schema Zod e verificar que são aceitos
- Gerar payloads aleatórios inválidos e verificar que são rejeitados
- Gerar configurações aleatórias de rotas sem schemas e verificar preservação de comportamento
- Testar que todas as combinações de plugins/middlewares continuam funcionando

### Integration Tests

- Testar fluxo completo: inicialização do app → registro de rotas → request → response validada
- Testar múltiplas rotas com diferentes schemas Zod em sequência
- Testar que ordem de registro de plugins não afeta validação Zod
- Testar que logs e error handling funcionam corretamente com validação Zod ativa
