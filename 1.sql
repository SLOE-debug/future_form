DECLARE @assignment NVARCHAR(50)
    , @localref_no NVARCHAR(50)

SET @localref_no = '{1:ref_no$}'
SET @assignment = (
        SELECT AuditorID
        FROM server50.IPdb.dbo.workflowparams
        WHERE Id = {processId}
        )

IF @assignment IS NULL
    OR @assignment = ''
BEGIN
    SET @assignment = (
            SELECT CASE 
                    WHEN patent_type = 3
                        THEN 'wangxue'
                    ELSE NULL
                    END
            FROM {ServerName}.IPdb.dbo.patent_primary
            WHERE ref_no = @localref_no
            )
END

IF @assignment IS NULL
BEGIN
    SET @assignment = (
            SELECT TOP 1 CASE 
                    WHEN handover_assignment IS NULL
                        OR handover_assignment = ''
                        THEN assignment
                    ELSE handover_assignment
                    END AS assignment
            FROM {ServerName}.IPdb.dbo.assignment a
            LEFT JOIN {ServerName}.IPdb.dbo.patent_appliant t
                ON t.appliant_id = a.appliant_id
            LEFT JOIN {ServerName}.IPdb.dbo.patent_primary p
                ON p.ref_no = t.ref_no
                    AND p.client_id = a.client_id
            WHERE p.ref_no = @localref_no
            )
END

IF @assignment IS NULL
BEGIN
    SET @assignment = (
            SELECT TOP 1 CASE 
                    WHEN handover_assignment IS NULL
                        OR handover_assignment = ''
                        THEN assignment
                    ELSE handover_assignment
                    END AS assignment
            FROM {ServerName}.IPdb.dbo.assignment a
            LEFT JOIN {ServerName}.IPdb.dbo.patent_appliant t
                ON t.appliant_id = a.appliant_id
            LEFT JOIN {ServerName}.IPdb.dbo.patent_primary p
                ON t.ref_no = p.ref_no
            WHERE p.ref_no = @localref_no
            )
END

IF @assignment IS NULL
BEGIN
    SET @assignment = (
            SELECT TOP 1 CASE 
                    WHEN handover_assignment IS NULL
                        OR handover_assignment = ''
                        THEN assignment
                    ELSE handover_assignment
                    END AS assignment
            FROM {ServerName}.IPdb.dbo.assignment a
            LEFT JOIN {ServerName}.IPdb.dbo.patent_primary p
                ON p.client_id = a.client_id
            WHERE p.ref_no = @localref_no
            )
END

IF @assignment IS NULL
BEGIN
    SET @assignment = (
            SELECT CASE 
                    WHEN deptcode = '01'
                        THEN CASE 
                                WHEN translate_desc LIKE '%日译%'
                                    THEN 'lijing'
                                ELSE 'wangxx'
                                END
                    WHEN deptcode = '02'
                        THEN 'xiaoyue'
                    WHEN deptcode = '03'
                        THEN CASE 
                                WHEN translate_desc LIKE '%日译%'
                                    THEN 'eva'
                                ELSE 'yjplhz'
                                END
                    WHEN deptcode = '12'
                        THEN 'zhoulei'
                    ELSE (
                            SELECT CASE 
                                    WHEN handover_assignment IS NULL
                                        OR handover_assignment = ''
                                        THEN assignment
                                    ELSE handover_assignment
                                    END AS assignment
                            FROM assignment
                            WHERE appliant_id = '默认'
                                AND client_id = '默认'
                            )
                    END
            FROM {ServerName}.IPdb.dbo.patent_primary AS p
            LEFT JOIN {ServerName}.IPdb.dbo.translate_type AS t
                ON p.orig_language = t.translate_type
            WHERE p.ref_no = @localref_no
            )
END

SELECT @assignment
