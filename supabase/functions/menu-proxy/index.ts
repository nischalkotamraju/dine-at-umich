Deno.serve(async (req) => {
  const { location, date } = await req.json().catch(() => ({}));

  if (!location || !date) {
    return new Response(JSON.stringify({ error: 'location and date are required' }), { status: 400 });
  }

  const url = `https://api.studentlife.umich.edu/menu/xml2print.php?controller=print&view=json&location=${encodeURIComponent(location)}&date=${date}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://dining.umich.edu/',
      'Accept': 'application/json, text/plain, */*',
    },
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: `HTTP ${res.status}` }), { status: res.status });
  }

  const text = await res.text();
  return new Response(text, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
