/* 必须在任何会调用 staticFile() 的模块求值前设置。
   staticFile() 默认解析到站点根「/xxx」，且会把返回值强制规范成以「/」开头
   （见 remotion/dist/cjs/static-file.js 末尾），所以相对基准行不通；本站又托管在
   子路径 /projects/remotion-try/ 下。因此从 location.pathname 推导出页面目录，
   拼出绝对基准：/projects/remotion-try/public —— 在 GitHub Pages、自定义域与
   本地「仓库根起服务」三种基址下都能正确解析 public/ 资产。 */
const pathname = window.location.pathname;
const dir = pathname.endsWith('/') ? pathname : pathname.slice(0, pathname.lastIndexOf('/') + 1);
(window as unknown as {remotion_staticBase: string}).remotion_staticBase =
  dir.replace(/\/$/, '') + '/public';
