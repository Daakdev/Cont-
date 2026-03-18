# Plan Multi-Tenant: BD separada por Admin/Empresa

**Diagnóstico actual:**
- Single BD con `empresa_id` filter.
- Request: BD física separada por admin.

**Plan Detallado:**
**1. Central 'main' DB:** auth, usuarios, empresas (meta: id, nombre, db_name).

**2. Register flow:**
- Create empresa in main DB.
- Create new MySQL DB `contplus_${empresa.id}`.
- Create tables in new DB (copy schema).
- Update empresa: db_name = `contplus_${id}`.

**3. Dynamic DB:**
- Middleware sets sequelize = pool[req.empresaId].
- All models use dynamic sequelize.

**4. Frontend:** Admin selecciona empresa (dropdown token switch).

**Dependent Files:**
- `backend/config/multi-db.js`: Pool.
- `backend/routes/auth.js`: DB creation.
- `backend/index.js`: Init pools.
- Models: accept sequelize param.

**Follow-up:**
- Setup multiple MySQL (Aiven limits? Local OK?).
- Test isolation.

