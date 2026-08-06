UPDATE "User"
SET "roleChosen" = false
WHERE lower("nickname") LIKE '%zombie%'
  AND "wechatOpenId" IS NOT NULL
  AND "isAdmin" = false;
