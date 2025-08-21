const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try {
    // Ensure the request has an authorization header
    if (!event.headers.authorization) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Authorization required.' }) };
    }

    const body = JSON.parse(event.body || '{}');
    // Initialize the admin Supabase client to bypass RLS for inserts
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // Get the user from the JWT sent by the frontend
    const token = event.headers.authorization.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
        console.error('JWT Error:', userError);
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token.' }) };
    }

    const userId = user.id;
    const { items, total, method, shipping } = body;

    // The RLS policy `user create orders` on the frontend client would check this,
    // but here we use the service key so we must provide the user_id.
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId, // Use the authenticated user's ID
        method,
        total,
        shipping_name: shipping.name,
        shipping_phone: shipping.phone,
        shipping_address: shipping.address,
        note: shipping.note
      })
      .select('*')
      .single();

    if (error) throw error;

    const itemsPayload = items.map(i => ({
      order_id: order.id,
      product_id: i.id,
      title: i.title,
      unit: i.unit,
      qty: i.qty,
      price: i.price
    }));
    const { error: itemErr } = await supabase.from('order_items').insert(itemsPayload);
    if (itemErr) throw itemErr;

    return { statusCode: 200, body: JSON.stringify(order) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
