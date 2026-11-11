export default defineNitroConfig({
  // Configura o Nitro para rodar no Cloudflare Pages/Workers
  runtime: {
    cloudflare: {
      binding: 'DB'
    }
  },

  // Preset para Cloudflare Pages
  preset: 'cloudflare-pages',

  // Headers CORS restritos por origem
  // Em produção, configure com domínios específicos via variáveis de ambiente
  headers: process.env.NODE_ENV === 'production'
    ? {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://seu-dominio.com',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
      }
    : {
        // Desenvolvimento local
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
})
