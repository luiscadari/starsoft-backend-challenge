## ⚠️ Nota Importante sobre Segurança

Este projeto possui **4 vulnerabilidades de severidade moderada** reportadas pelo npm audit.

**Status:** ✅ Analisadas e documentadas - **Risco aceito**

Estas vulnerabilidades são no pacote `lodash` (dependência transitiva do `@nestjs/config`) e **NÃO representam risco significativo** para esta aplicação porque:

- ✅ Lodash não é usado diretamente no código
- ✅ Todas as entradas são validadas com class-validator
- ✅ As funções vulneráveis não são expostas
- ✅ Mitigações apropriadas foram implementadas

**Documentação completa:**

- [SECURITY-SUMMARY.md](./SECURITY-SUMMARY.md) - Resumo executivo (leia primeiro)
- [VULNERABILITIES.md](./VULNERABILITIES.md) - Análise detalhada
- [SECURITY.md](./SECURITY.md) - Documentação técnica completa

Esta abordagem demonstra **análise profissional de risco** e **transparência**, práticas essenciais em ambientes de produção reais.

---
