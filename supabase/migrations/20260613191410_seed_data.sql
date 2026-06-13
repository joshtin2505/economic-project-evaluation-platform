-- ============================================================
-- Seed: Mutually Exclusive Project Alternatives
-- Populates the database with 3 sample projects and links them
-- to a common project group for alternatives comparison.
-- ============================================================

DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_proj_a_id UUID;
    v_proj_b_id UUID;
    v_proj_c_id UUID;
    v_group_id UUID;
BEGIN
    -- 1. Obtener el primer usuario y su tenant
    SELECT id, tenant_id INTO v_user_id, v_tenant_id 
    FROM public.user_profiles 
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún perfil de usuario. Registra un usuario primero en la aplicación para poder correr el seed.';
    END IF;

    -- Evitar duplicados si ya corrió el seed (limpiar datos previos de prueba con nombres específicos)
    DELETE FROM public.project_groups WHERE name = 'Proyecto de Planta de Tratamiento de Aguas' AND user_id = v_user_id;
    DELETE FROM public.projects WHERE name IN ('Planta Tratamiento A (Básica)', 'Planta Tratamiento B (Semiautomatizada)', 'Planta Tratamiento C (Totalmente Automatizada)') AND user_id = v_user_id;

    -- 2. Crear Proyecto A (Planta Tratamiento Básica)
    INSERT INTO public.projects (
        user_id, tenant_id, name, description, initial_investment, periods, 
        discount_rate, status, salvage_value, tmar_method, results, use_tmar_as_discount_rate
    ) VALUES (
        v_user_id, v_tenant_id, 
        'Planta Tratamiento A (Básica)', 
        'Alternativa de baja inversión inicial con costos operativos estándar y control manual.', 
        100000, 5, 12, 'completed', 20000, 'simple',
        '{"npv": 24205, "irr": 0.201, "tmar": 0.12, "isViable": true, "bcRatio": 1.24}'::jsonb,
        false
    ) RETURNING id INTO v_proj_a_id;

    -- Flujos Proyecto A (Año 1 a 5)
    INSERT INTO public.cash_flows (project_id, period, inflow, outflow, source) VALUES
        (v_proj_a_id, 1, 30000, 5000, 'manual'),
        (v_proj_a_id, 2, 35000, 5000, 'manual'),
        (v_proj_a_id, 3, 40000, 6000, 'manual'),
        (v_proj_a_id, 4, 45000, 6000, 'manual'),
        (v_proj_a_id, 5, 70000, 7000, 'manual'); -- Incluye valor de salvamento en ingresos del último año

    -- 3. Crear Proyecto B (Planta Tratamiento Semiautomatizada)
    INSERT INTO public.projects (
        user_id, tenant_id, name, description, initial_investment, periods, 
        discount_rate, status, salvage_value, tmar_method, results, use_tmar_as_discount_rate
    ) VALUES (
        v_user_id, v_tenant_id, 
        'Planta Tratamiento B (Semiautomatizada)', 
        'Alternativa intermedia con mejor eficiencia operativa y menor costo de mantenimiento anual.', 
        150000, 5, 12, 'completed', 30000, 'simple',
        '{"npv": 27725, "irr": 0.179, "tmar": 0.12, "isViable": true, "bcRatio": 1.18}'::jsonb,
        false
    ) RETURNING id INTO v_proj_b_id;

    -- Flujos Proyecto B (Año 1 a 5)
    INSERT INTO public.cash_flows (project_id, period, inflow, outflow, source) VALUES
        (v_proj_b_id, 1, 45000, 8000, 'manual'),
        (v_proj_b_id, 2, 50000, 8000, 'manual'),
        (v_proj_b_id, 3, 55000, 9000, 'manual'),
        (v_proj_b_id, 4, 60000, 9000, 'manual'),
        (v_proj_b_id, 5, 95000, 10000, 'manual');

    -- 4. Crear Proyecto C (Planta Tratamiento Totalmente Automatizada)
    INSERT INTO public.projects (
        user_id, tenant_id, name, description, initial_investment, periods, 
        discount_rate, status, salvage_value, tmar_method, results, use_tmar_as_discount_rate
    ) VALUES (
        v_user_id, v_tenant_id, 
        'Planta Tratamiento C (Totalmente Automatizada)', 
        'Alta inversión inicial con tecnología robótica de punta. Mínima mano de obra y máxima vida útil.', 
        250000, 5, 12, 'completed', 50000, 'simple',
        '{"npv": 29853, "irr": 0.158, "tmar": 0.12, "isViable": true, "bcRatio": 1.12}'::jsonb,
        false
    ) RETURNING id INTO v_proj_c_id;

    -- Flujos Proyecto C (Año 1 a 5)
    INSERT INTO public.cash_flows (project_id, period, inflow, outflow, source) VALUES
        (v_proj_c_id, 1, 80000, 12000, 'manual'),
        (v_proj_c_id, 2, 85000, 12000, 'manual'),
        (v_proj_c_id, 3, 90000, 13000, 'manual'),
        (v_proj_c_id, 4, 95000, 13000, 'manual'),
        (v_proj_c_id, 5, 150000, 14000, 'manual');

    -- 5. Crear el Grupo de Comparación
    INSERT INTO public.project_groups (
        tenant_id, user_id, name, description, comparison_rate
    ) VALUES (
        v_tenant_id, v_user_id, 
        'Proyecto de Planta de Tratamiento de Aguas', 
        'Grupo de alternativas mutuamente excluyentes para la licitación del tratamiento de efluentes industriales.', 
        12.0
    ) RETURNING id INTO v_group_id;

    -- 6. Asociar miembros al grupo
    INSERT INTO public.project_group_members (group_id, project_id, rank, notes) VALUES
        (v_group_id, v_proj_a_id, 1, 'Opción básica de bajo costo'),
        (v_group_id, v_proj_b_id, 2, 'Opción semiautomatizada balanceada'),
        (v_group_id, v_proj_c_id, 3, 'Opción automatizada premium');

END $$;
