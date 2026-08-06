UPDATE "User"
SET "isAdmin" = true
WHERE "nickname" = '肥嘟嘟左卫门'
  AND "wechatOpenId" IS NOT NULL;
