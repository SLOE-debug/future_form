DECLARE @assignment NVARCHAR(50),@localref_no NVARCHAR(50),@handover_assignment NVARCHAR(50)

set @localref_no = '{1:ref_no$}'

SET @assignment = (SELECT AuditorID
FROM server50.IPdb.dbo.workflowparams
WHERE Id = {processId})

if SELECT count(1)
FROM patent_primary p
JOIN country c
    ON p.source_country = c.country_id
WHERE c.country_name = '中国台湾'



if @assignment is NULL OR @assignment = ''
BEGIN
    SET @assignment =(SELECT CASE WHEN patent_type = 3 THEN 'wangxue' ELSE NULL END
    FROM {ServerName}.IPdb.dbo.patent_primary
    WHERE ref_no = @localref_no)
END

IF @assignment IS NULL
BEGIN
    SET @assignment = (
        SELECT top 1
        assignment
    FROM {ServerName}.IPdb.dbo.assignment a
        LEFT JOIN {ServerName}.IPdb.dbo.patent_appliant t
        ON t.appliant_id = a.appliant_id
        LEFT JOIN {ServerName}.IPdb.dbo.patent_primary p ON p.ref_no = t.ref_no AND p.client_id = a.client_id
    WHERE p.ref_no = @localref_no
    )
END

IF @assignment IS NULL
BEGIN
    SET @assignment = (
        SELECT TOP 1
        assignment
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
        SELECT TOP 1
        assignment
    FROM {ServerName}.IPdb.dbo.assignment a
        LEFT JOIN {ServerName}.IPdb.dbo.patent_primary p
        ON p.client_id = a.client_id
    WHERE p.ref_no = @localref_no
    )
END

IF @assignment IS NULL
BEGIN
    SET @assignment = (
        SELECT
        CASE
                WHEN deptcode = '01' THEN 
                    CASE WHEN translate_desc LIKE '%日译%' THEN 'lijing' ELSE 'wangxx' END
                WHEN deptcode = '02' THEN 'xiaoyue'
                WHEN deptcode = '03' THEN 
                    CASE WHEN translate_desc LIKE '%日译%' THEN 'eva' ELSE 'yjplhz' END
                WHEN deptcode = '12' THEN 'zhoulei'
            ELSE (
                SELECT assignment
        FROM assignment
        WHERE appliant_id = '默认' AND client_id = '默认'
            ) END
    FROM {ServerName}.IPdb.dbo.patent_primary as p
        LEFT JOIN {ServerName}.IPdb.dbo.translate_type as t
        ON p.orig_language = t.translate_type
    WHERE p.ref_no = @localref_no
    )
END

-- 表名：assignment_handover_set，assignmen 分案人 handover_assignment 交接人 startdate 开始时间 enddate 结束时间
-- 通过分案人查询交接人,两个时间可能为空
set @handover_assignment = (
    SELECT handover_assignment
    FROM server50.IPdb.dbo.assignment_handover_set
    WHERE assignment = @assignment
    AND (startdate IS NULL OR startdate <= GETDATE())
    AND (enddate IS NULL OR enddate >= GETDATE())
)
    
if @handover_assignment is not NULL or @handover_assignment <> ''
BEGIN
    SET @assignment = @handover_assignment
END
SELECT @assignment