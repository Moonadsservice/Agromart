exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    body: JSON.stringify({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      WHATSAPP: process.env.SITE_WHATSAPP_MSISDN,
      BANK: {
        name: process.env.BANK_NAME,
        acctName: process.env.BANK_ACCOUNT_NAME,
        acctNo: process.env.BANK_ACCOUNT_NUMBER
      }
    })
  };
};
